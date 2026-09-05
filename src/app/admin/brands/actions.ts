"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { slugify } from "@/lib/admin/products";
import { logActivity } from "@/lib/admin/activity-log";

const brandSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100, "Slug is too long.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens."),
  logoUrl: z.string().trim().optional(),
  description: z.string().trim().optional(),
  seoTitle: z.string().trim().max(60, "SEO Title should not exceed 60 characters.").optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160, "SEO Description should not exceed 160 characters.").optional().or(z.literal("")),
});

type BrandFormField = "name" | "slug" | "logoUrl" | "description" | "seoTitle" | "seoDescription" | "form";

export type BrandActionState = {
  errors?: Partial<Record<BrandFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<BrandActionState["errors"]> {
  const errors: NonNullable<BrandActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as BrandFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string; meta?: { target?: string[] } } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapBrandWriteError(err: unknown): string {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") return "A brand with this slug already exists.";
    if (err.code === "P2025") return "This brand no longer exists.";
  }
  console.error("[admin/brands] write failed:", err);
  return "Unable to save this brand. Please try again.";
}

async function revalidateBrandProductPages(brandId: string) {
  const products = await db.product.findMany({ where: { brandId }, select: { slug: true } });
  for (const p of products) revalidatePath(`/product/${p.slug}`);
}

export async function createBrand(_prevState: BrandActionState, formData: FormData): Promise<BrandActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slugCandidate = slugInput ? slugInput : slugify(name);

  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    slug: slugCandidate,
    logoUrl: formData.get("logoUrl") || undefined,
    description: formData.get("description") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const slugTaken = await db.brand.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugTaken) {
    return { errors: { slug: "A brand with this slug already exists." } };
  }

  try {
    await db.$transaction(async (tx) => {
      const brand = await tx.brand.create({
        data: {
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl ?? null,
          description: data.description ?? null,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
        select: { id: true },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "BRAND",
        entityId: brand.id,
        description: `Created brand ${data.name}`,
      });
    });
  } catch (err) {
    return { errors: { form: mapBrandWriteError(err) } };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  redirect("/admin/brands");
}

export async function updateBrand(_prevState: BrandActionState, formData: FormData): Promise<BrandActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing brand id." } };
  }

  const existing = await db.brand.findUnique({ where: { id }, select: { name: true, slug: true, logoUrl: true } });
  if (!existing) {
    return { errors: { form: "This brand no longer exists." } };
  }

  const parsed = brandSchema.safeParse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "").trim(),
    logoUrl: formData.get("logoUrl") || undefined,
    description: formData.get("description") || undefined,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.slug !== existing.slug) {
    const slugTaken = await db.brand.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return { errors: { slug: "A brand with this slug already exists." } };
  }

  const changedFields: string[] = [];
  if (existing.name !== data.name) changedFields.push("name");
  if (existing.slug !== data.slug) changedFields.push("slug");
  if ((existing.logoUrl ?? null) !== (data.logoUrl ?? null)) changedFields.push("logoUrl");

  try {
    await db.$transaction(async (tx) => {
      await tx.brand.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          logoUrl: data.logoUrl ?? null,
          description: data.description ?? null,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "BRAND",
        entityId: id,
        description: `Updated brand ${data.name}`,
        metadata: { changedFields },
      });
    });
  } catch (err) {
    return { errors: { form: mapBrandWriteError(err) } };
  }

  await revalidateBrandProductPages(id);
  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  redirect("/admin/brands");
}

export async function deleteBrand(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const brand = await db.brand.findUnique({
    where: { id },
    select: { name: true, _count: { select: { products: true } } },
  });
  if (!brand) {
    return { error: "This brand no longer exists." };
  }

  if (brand._count.products > 0) {
    const count = brand._count.products;
    return {
      error: `This brand is currently used by ${count} product${count === 1 ? "" : "s"}. Reassign those products before deleting the brand.`,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.brand.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "BRAND",
        entityId: id,
        description: `Deleted brand ${brand.name}`,
      });
    });
  } catch (err) {
    return { error: mapBrandWriteError(err) };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/admin/products");
  return {};
}
