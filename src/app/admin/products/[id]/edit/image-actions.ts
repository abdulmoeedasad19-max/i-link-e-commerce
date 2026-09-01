"use server";

// Phase 4.3.4 — ProductImage CRUD/reorder/primary-selection, colocated with
// the edit route that's the only place these are used from (mirrors
// src/app/(storefront)/cart/actions.ts etc.'s route-colocated convention).
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { uploadProductImage, deleteProductImageLocal } from "@/lib/storage/local-images";

const imageSchema = z.object({
  url: z.string().trim().min(1, "Image path is required.").max(500, "Image path is too long."),
  altText: z.string().trim().max(200, "Alt text is too long.").optional(),
});

// A generous cap, not a business rule — just a sane upper bound so a
// script/mistake can't attach an unbounded number of rows/files to one
// product. Enforced server-side; the upload UI has no client-side limit
// beyond this same number.
const MAX_IMAGES_PER_PRODUCT = 8;

type ImageFormField = "url" | "altText" | "form";

export type ImageActionState = {
  errors?: Partial<Record<ImageFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<ImageActionState["errors"]> {
  const errors: NonNullable<ImageActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as ImageFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapWriteError(err: unknown): string {
  if (isPrismaKnownError(err) && err.code === "P2025") {
    return "This image no longer exists.";
  }
  console.error("[admin/products/images] write failed:", err);
  return "Unable to save this image. Please try again.";
}

// Same set of storefront/admin paths Phase 4.3.2/4.3.3's product/category
// mutations already revalidate, since an image change affects exactly the
// same surfaces a product edit does (list thumbnail, product page, shop
// grid, category page).
async function revalidateProductPaths(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { slug: true, category: { select: { slug: true } } },
  });
  if (!product) return;
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin/products");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${product.category.slug}`);
}

export async function createProductImage(
  _prevState: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return { errors: { form: "Product not found." } };
  }

  const parsed = imageSchema.safeParse({
    url: formData.get("url"),
    altText: formData.get("altText") || undefined,
  });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }

  try {
    const maxSort = await db.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
    const created = await db.productImage.create({
      data: {
        productId,
        url: parsed.data.url,
        altText: parsed.data.altText ?? null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        isPrimary: false,
      },
      select: { id: true },
    });

    // First-image behavior: a product that had zero images before this
    // create now has exactly one — make it primary automatically, matching
    // the repository's primary -> first -> category-image fallback and the
    // seed's own convention (every product's sole image is primary).
    const count = await db.productImage.count({ where: { productId } });
    if (count === 1) {
      await db.productImage.update({ where: { id: created.id }, data: { isPrimary: true } });
    }
  } catch (err) {
    return { errors: { form: mapWriteError(err) } };
  }

  await revalidateProductPaths(productId);
  return {};
}

/**
 * Admin Product Management upgrade — the real upload path, replacing the
 * "type a path you copied from somewhere else" workflow above with actual
 * file upload. `createProductImage` above is kept as-is (now a secondary,
 * "add by URL" fallback in the UI) for the rare case of reusing an
 * already-hosted image — this function is the primary flow.
 *
 * Stops at the first failed file rather than attempting the rest: simpler
 * to reason about and to explain to the admin than a partial-batch report,
 * and every file already uploaded+saved before the failure stays saved
 * (never rolled back) — only a DB write failing *after* a successful
 * upload triggers a compensating file delete, so a genuinely orphaned
 * file is the rare exception, not the common case.
 */
export async function uploadProductImages(
  productId: string,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireAdmin();

  const product = await db.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return { error: "Product not found." };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { error: "No files selected." };
  }

  const existingCount = await db.productImage.count({ where: { productId } });
  if (existingCount + files.length > MAX_IMAGES_PER_PRODUCT) {
    return {
      error: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images (this product already has ${existingCount}).`,
    };
  }

  const maxSort = await db.productImage.aggregate({ where: { productId }, _max: { sortOrder: true } });
  let nextSort = maxSort._max.sortOrder ?? -1;
  let uploadedCount = 0;
  let firstError: string | null = null;

  for (const file of files) {
    const result = await uploadProductImage(file);
    if ("error" in result) {
      firstError = result.error;
      break;
    }
    nextSort += 1;
    try {
      await db.productImage.create({
        data: { productId, url: result.url, sortOrder: nextSort, isPrimary: false },
      });
      uploadedCount += 1;
    } catch (err) {
      // The upload itself succeeded but the DB row didn't — clean up the
      // now-orphaned file rather than leaving it unreferenced forever.
      await deleteProductImageLocal(result.url);
      console.error("[admin/products/images] uploadProductImages db write failed:", err);
      firstError = "Unable to save this image. Please try again.";
      break;
    }
  }

  if (uploadedCount > 0 && existingCount === 0) {
    // First image(s) ever for this product — make the first upload
    // primary, matching createProductImage's own first-image convention.
    const first = await db.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "asc" } });
    if (first) {
      await db.productImage.update({ where: { id: first.id }, data: { isPrimary: true } });
    }
  }

  if (uploadedCount > 0) {
    await revalidateProductPaths(productId);
  }

  if (firstError) {
    return {
      error:
        uploadedCount > 0
          ? `${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded, but then: ${firstError}`
          : firstError,
    };
  }
  return {};
}

export async function updateProductImage(
  _prevState: ImageActionState,
  formData: FormData,
): Promise<ImageActionState> {
  await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const imageId = String(formData.get("imageId") ?? "");

  const image = await db.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
  if (!image || image.productId !== productId) {
    return { errors: { form: "This image no longer exists." } };
  }

  const parsed = imageSchema.safeParse({
    url: formData.get("url"),
    altText: formData.get("altText") || undefined,
  });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }

  try {
    await db.productImage.update({
      where: { id: imageId },
      data: { url: parsed.data.url, altText: parsed.data.altText ?? null },
    });
  } catch (err) {
    return { errors: { form: mapWriteError(err) } };
  }

  await revalidateProductPaths(productId);
  return {};
}

export async function deleteProductImage(productId: string, imageId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const image = await db.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) {
    return { error: "This image no longer exists." };
  }

  try {
    if (image.isPrimary) {
      // Deleting the primary image: promote the next one (by sortOrder) in
      // the same transaction, so the product is never left — even
      // momentarily — with either zero or more than one primary image.
      const next = await db.productImage.findFirst({
        where: { productId, id: { not: imageId } },
        orderBy: { sortOrder: "asc" },
      });
      if (next) {
        await db.$transaction([
          db.productImage.delete({ where: { id: imageId } }),
          db.productImage.update({ where: { id: next.id }, data: { isPrimary: true } }),
        ]);
      } else {
        await db.productImage.delete({ where: { id: imageId } });
      }
    } else {
      await db.productImage.delete({ where: { id: imageId } });
    }
  } catch (err) {
    return { error: mapWriteError(err) };
  }

  // Best-effort, after the DB row is already gone. deleteProductImageLocal
  // itself safely no-ops for any URL outside our managed uploads
  // directory — an image added via the manual "add by URL" fallback (a
  // static /public path, a category placeholder, or any other URL) is
  // never touched here, only files this app actually uploaded.
  await deleteProductImageLocal(image.url);

  await revalidateProductPaths(productId);
  return {};
}

export async function setPrimaryProductImage(productId: string, imageId: string): Promise<{ error?: string }> {
  await requireAdmin();

  const image = await db.productImage.findUnique({ where: { id: imageId }, select: { productId: true } });
  if (!image || image.productId !== productId) {
    return { error: "This image no longer exists." };
  }

  try {
    // Atomic unset-all-then-set-one — a product can never end up with two
    // primary images, even under a race, because both writes commit or
    // neither does.
    await db.$transaction([
      db.productImage.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } }),
      db.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
  } catch (err) {
    return { error: mapWriteError(err) };
  }

  await revalidateProductPaths(productId);
  return {};
}

export async function moveProductImage(
  productId: string,
  imageId: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  await requireAdmin();

  const images = await db.productImage.findMany({ where: { productId }, orderBy: { sortOrder: "asc" } });
  const index = images.findIndex((img) => img.id === imageId);
  if (index === -1) {
    return { error: "This image no longer exists." };
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= images.length) {
    return {}; // already at the edge — no-op, not an error
  }

  const current = images[index];
  const swapWith = images[swapIndex];

  try {
    await db.$transaction([
      db.productImage.update({ where: { id: current.id }, data: { sortOrder: swapWith.sortOrder } }),
      db.productImage.update({ where: { id: swapWith.id }, data: { sortOrder: current.sortOrder } }),
    ]);
  } catch (err) {
    return { error: mapWriteError(err) };
  }

  await revalidateProductPaths(productId);
  return {};
}
