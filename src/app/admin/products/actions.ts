"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { slugify } from "@/lib/admin/products";
import { logActivity } from "@/lib/admin/activity-log";
import { uploadProductImage, deleteProductImageLocal } from "@/lib/storage/local-images";

const MAX_IMAGES_PER_PRODUCT = 8;

const productSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(200, "Name is too long."),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required.")
      .max(200, "Slug is too long.")
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens."),
    description: z.string().trim().min(1, "Description is required."),
    // Short Description / Key Specifications upgrade — freeform,
    // admin-authored text; optional, no length cap, matching the
    // uncapped `description` field above (a hard limit was never a
    // stated requirement, and Postgres TEXT already has no practical
    // limit worth enforcing artificially).
    shortDescription: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().trim().optional(),
      ),
    categoryId: z.string().trim().min(1, "Category is required."),
    brandId: z.string().trim().optional(),
    // "Normal Price" in the admin UI — the original/list price, shown
    // struck through on the storefront when set. Optional: a product with
    // no discount active has no normal-price concept, just its one price.
    compareAtPrice: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.coerce.number().min(0, "Normal price must be zero or greater.").optional(),
      ),
    // "Discounted Price" in the admin UI when a normal price is set,
    // otherwise just "Price" — always the actual amount a customer pays.
    price: z.coerce.number().min(0, "Price must be zero or greater."),
    sku: z.string().trim().optional(),
    stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock must be zero or greater."),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"], { message: "Please select a valid status." }),
    featured: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(50)).max(20, "A product can have at most 20 tags."),
    // Already-uploaded local image URLs, staged client-side by
    // ProductImageStagingUpload before the product itself exists — see
    // uploadStagedProductImage below. Each is trusted only as far as
    // "some admin-authorized upload produced this URL"; it's never a
    // client-supplied path in the unsafe sense (there's no filesystem
    // write, no way to reference an arbitrary file).
    imageUrls: z.array(z.string().trim().min(1).max(1000)).max(MAX_IMAGES_PER_PRODUCT, {
      message: `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`,
    }),
    seoTitle: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().trim().max(200, "SEO title is too long.").optional(),
      ),
    seoDescription: z
      .preprocess(
        (v) => (v === "" || v === null || v === undefined ? undefined : v),
        z.string().trim().max(500, "SEO description is too long.").optional(),
      ),
  })
  .refine((data) => data.compareAtPrice == null || data.price <= data.compareAtPrice, {
    message: "Discounted price cannot be greater than normal price.",
    path: ["price"],
  });

type ProductFormField =
  | "name"
  | "slug"
  | "description"
  | "shortDescription"
  | "categoryId"
  | "brandId"
  | "price"
  | "compareAtPrice"
  | "sku"
  | "stock"
  | "status"
  | "tags"
  | "imageUrls"
  | "seoTitle"
  | "seoDescription"
  | "form";

export type ProductActionState = {
  errors?: Partial<Record<ProductFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<ProductActionState["errors"]> {
  const errors: NonNullable<ProductActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as ProductFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string; meta?: { target?: string[] } } {
  return typeof err === "object" && err !== null && "code" in err;
}

/**
 * Saves one image to local server storage independent of any product
 * existing yet — the Add Product form's own images section calls this
 * per file as soon as it's selected/dropped, holding the resulting URL in client
 * state (ProductImageStagingUpload) until the surrounding product form
 * is actually submitted. No ProductImage row is created here; that
 * happens inside createProduct's own transaction once the product it
 * belongs to exists. Never crashes and never hides behind a generic
 * "product not found"-style message the way the edit page's
 * product-scoped upload does, because there genuinely is no product yet
 * — this is intentionally the one product-image entry point that isn't
 * scoped to a specific productId.
 */
export async function uploadStagedProductImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file selected." };
  }

  return uploadProductImage(file);
}

function mapProductWriteError(err: unknown): string {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      const target = err.meta?.target?.join(",") ?? "";
      if (target.includes("slug")) return "A product with this slug already exists.";
      if (target.includes("sku")) return "A product with this SKU already exists.";
      return "A product with conflicting details already exists.";
    }
    if (err.code === "P2003") {
      return "The selected category or brand no longer exists.";
    }
    if (err.code === "P2025") {
      return "This product no longer exists.";
    }
  }
  console.error("[admin/products] write failed:", err);
  return "Unable to save this product. Please try again.";
}

function readFormValues(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDescription: formData.get("shortDescription") || undefined,
    categoryId: formData.get("categoryId"),
    brandId: formData.get("brandId") || undefined,
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    sku: formData.get("sku") || undefined,
    stock: formData.get("stock"),
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
    // ProductTagsInput renders one hidden <input name="tags"> per chip —
    // getAll() collects every one of them, in the order they appear.
    tags: formData.getAll("tags").map(String),
    // ProductImageStagingUpload renders one hidden <input name="imageUrls">
    // per already-uploaded image, in display/primary order — same
    // getAll() convention as tags above.
    imageUrls: formData.getAll("imageUrls").map(String),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slugCandidate = slugInput ? slugInput : slugify(name);

  const parsed = productSchema.safeParse({ ...readFormValues(formData), slug: slugCandidate });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { slug: true } });
  if (!category) {
    return { errors: { categoryId: "The selected category no longer exists." } };
  }
  if (data.brandId) {
    const brand = await db.brand.findUnique({ where: { id: data.brandId }, select: { id: true } });
    if (!brand) return { errors: { brandId: "The selected brand no longer exists." } };
  }

  const slugTaken = await db.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugTaken) {
    return { errors: { slug: "A product with this slug already exists." } };
  }
  if (data.sku) {
    const skuTaken = await db.product.findFirst({ where: { sku: data.sku }, select: { id: true } });
    if (skuTaken) return { errors: { sku: "A product with this SKU already exists." } };
  }

  try {
    await db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          id: randomUUID(),
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription ?? null,
          categoryId: data.categoryId,
          brandId: data.brandId ?? null,
          price: data.price.toFixed(2),
          compareAtPrice: data.compareAtPrice != null ? data.compareAtPrice.toFixed(2) : null,
          sku: data.sku ?? null,
          stock: data.stock,
          status: data.status,
          featured: data.featured,
          tags: data.tags,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
        select: { id: true },
      });

      // Images were already saved to local storage before this submit
      // (see ProductImageStagingUpload/uploadStagedProductImage) — this
      // just attaches the already-produced URLs to the now-existing
      // product, in the same order the admin arranged them, with the
      // first one primary. Nothing here touches the filesystem.
      if (data.imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: data.imageUrls.map((url, index) => ({
            productId: product.id,
            url,
            sortOrder: index,
            isPrimary: index === 0,
          })),
        });
      }

      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "PRODUCT",
        entityId: product.id,
        description: `Created product ${data.name}`,
      });
    });
  } catch (err) {
    return { errors: { form: mapProductWriteError(err) } };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${category.slug}`);
  redirect("/admin/products");
}

export async function updateProduct(
  _prevState: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing product id." } };
  }

  const existing = await db.product.findUnique({
    where: { id },
    select: {
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      categoryId: true,
      brandId: true,
      price: true,
      compareAtPrice: true,
      sku: true,
      stock: true,
      status: true,
      featured: true,
      tags: true,
      seoTitle: true,
      seoDescription: true,
      category: { select: { slug: true } },
    },
  });
  if (!existing) {
    return { errors: { form: "This product no longer exists." } };
  }

  const parsed = productSchema.safeParse(readFormValues(formData));
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const category = await db.category.findUnique({ where: { id: data.categoryId }, select: { slug: true } });
  if (!category) {
    return { errors: { categoryId: "The selected category no longer exists." } };
  }
  if (data.brandId) {
    const brand = await db.brand.findUnique({ where: { id: data.brandId }, select: { id: true } });
    if (!brand) return { errors: { brandId: "The selected brand no longer exists." } };
  }

  if (data.slug !== existing.slug) {
    const slugTaken = await db.product.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return { errors: { slug: "A product with this slug already exists." } };
  }
  if (data.sku) {
    const skuTaken = await db.product.findFirst({ where: { sku: data.sku }, select: { id: true } });
    if (skuTaken && skuTaken.id !== id) return { errors: { sku: "A product with this SKU already exists." } };
  }

  // Small, explicit field-by-field diff — never a blind serialization of
  // the whole row.
  const changedFields: string[] = [];
  if (existing.name !== data.name) changedFields.push("name");
  if (existing.slug !== data.slug) changedFields.push("slug");
  if (existing.description !== data.description) changedFields.push("description");
  if ((existing.shortDescription ?? null) !== (data.shortDescription ?? null)) {
    changedFields.push("shortDescription");
  }
  if (existing.categoryId !== data.categoryId) changedFields.push("categoryId");
  if ((existing.brandId ?? null) !== (data.brandId ?? null)) changedFields.push("brandId");
  if (existing.price.toNumber() !== data.price) changedFields.push("price");
  if ((existing.compareAtPrice?.toNumber() ?? null) !== (data.compareAtPrice ?? null)) {
    changedFields.push("compareAtPrice");
  }
  if ((existing.sku ?? null) !== (data.sku ?? null)) changedFields.push("sku");
  if (existing.stock !== data.stock) changedFields.push("stock");
  if (existing.status !== data.status) changedFields.push("status");
  if (existing.featured !== data.featured) changedFields.push("featured");
  if (JSON.stringify(existing.tags) !== JSON.stringify(data.tags)) changedFields.push("tags");
  if ((existing.seoTitle ?? null) !== (data.seoTitle ?? null)) changedFields.push("seoTitle");
  if ((existing.seoDescription ?? null) !== (data.seoDescription ?? null)) changedFields.push("seoDescription");

  try {
    await db.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription ?? null,
          categoryId: data.categoryId,
          brandId: data.brandId ?? null,
          price: data.price.toFixed(2),
          compareAtPrice: data.compareAtPrice != null ? data.compareAtPrice.toFixed(2) : null,
          sku: data.sku ?? null,
          stock: data.stock,
          tags: data.tags,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          status: data.status,
          featured: data.featured,
        },
      });

      // Phase 1: Product Slug SEO Redirect System
      if (existing.slug !== data.slug) {
        // If the new slug was previously an old redirect, clear it to prevent conflict
        await tx.productRedirect.deleteMany({
          where: { oldSlug: data.slug },
        });

        // Save the old slug pointing to this product
        await tx.productRedirect.upsert({
          where: { oldSlug: existing.slug },
          create: { oldSlug: existing.slug, productId: id },
          update: { productId: id },
        });
      }

      // Images are managed exclusively by the dedicated actions in
      // src/app/admin/products/[id]/edit/image-actions.ts — this action
      // never touches that relation, so a basic-info save can never lose
      // them.
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "PRODUCT",
        entityId: id,
        description: `Updated product ${data.name}`,
        metadata: { changedFields },
      });
    });
  } catch (err) {
    return { errors: { form: mapProductWriteError(err) } };
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${existing.category.slug}`);
  if (existing.category.slug !== category.slug) revalidatePath(`/shop/${category.slug}`);
  revalidatePath(`/product/${existing.slug}`);
  if (data.slug !== existing.slug) revalidatePath(`/product/${data.slug}`);
  redirect("/admin/products");
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const product = await db.product.findUnique({
    where: { id },
    select: {
      name: true,
      slug: true,
      category: { select: { slug: true } },
      images: { select: { url: true } },
    },
  });
  if (!product) {
    return { error: "This product no longer exists." };
  }

  // OrderItem has no relation to Product at all (it snapshots
  // productSlug/nameSnapshot/priceSnapshot independently — see
  // prisma/schema.prisma), so historical orders can never be affected by a
  // product deletion. ProductImage cascades automatically.
  // CartItem/WishlistItem.productId, however, is a live
  // (non-snapshotted, non-FK) reference — hard-deleting a product that's
  // currently in a customer's cart or wishlist would silently orphan those
  // rows, so that case is refused in favor of archiving instead.
  const [cartCount, wishlistCount] = await Promise.all([
    db.cartItem.count({ where: { productId: id } }),
    db.wishlistItem.count({ where: { productId: id } }),
  ]);
  if (cartCount > 0 || wishlistCount > 0) {
    return {
      error:
        "This product can't be deleted because it's currently in a customer's cart or wishlist. Archive it instead to hide it from the storefront.",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.product.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "PRODUCT",
        entityId: id,
        description: `Deleted product ${product.name}`,
      });
    });
  } catch (err) {
    return { error: mapProductWriteError(err) };
  }

  // After the DB row (and its cascaded ProductImage rows) is genuinely
  // gone — every filename is a server-generated UUID unique to that one
  // upload (see local-images.ts), so no other product's image can ever
  // share it; deleting it here can never affect another product. Same
  // best-effort tolerance as every other cleanup-after-mutation in this
  // codebase: a failed file delete is logged, never surfaced as an error
  // for a product deletion that already succeeded.
  await Promise.all(product.images.map((img) => deleteProductImageLocal(img.url)));

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${product.category.slug}`);
  revalidatePath(`/product/${product.slug}`);
  return {};
}

export async function toggleProductStatus(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, status: true, slug: true, category: { select: { slug: true } } },
  });
  if (!product) {
    return { error: "This product no longer exists." };
  }

  const nextStatus = product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE";

  try {
    // Unchanged from the existing behavior: this was already an
    // unconditional update, not a race-safe conditional one, before this
    // phase — adding audit logging is not the occasion to change that.
    await db.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { status: nextStatus } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "PRODUCT",
        entityId: id,
        description: `Changed product status from ${product.status} to ${nextStatus}`,
        metadata: { field: "status", from: product.status, to: nextStatus },
      });
    });
  } catch (err) {
    return { error: mapProductWriteError(err) };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${product.category.slug}`);
  revalidatePath(`/product/${product.slug}`);
  return {};
}
