"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { slugify } from "@/lib/admin/products";
import { logActivity } from "@/lib/admin/activity-log";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .max(100, "Slug is too long.")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens."),
  description: z.string().trim().optional(),
  image: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  tier: z.enum(["FEATURED", "SECONDARY", "COMPACT"], { message: "Please select a valid tier." }),
  seoTitle: z.string().trim().max(60, "SEO Title should not exceed 60 characters.").optional().or(z.literal("")),
  seoDescription: z.string().trim().max(160, "SEO Description should not exceed 160 characters.").optional().or(z.literal("")),
});

type CategoryFormField = "name" | "slug" | "description" | "image" | "icon" | "tier" | "seoTitle" | "seoDescription" | "form";

export type CategoryActionState = {
  errors?: Partial<Record<CategoryFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<CategoryActionState["errors"]> {
  const errors: NonNullable<CategoryActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as CategoryFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string; meta?: { target?: string[] } } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapCategoryWriteError(err: unknown): string {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") return "A category with this slug already exists.";
    if (err.code === "P2025") return "This category no longer exists.";
  }
  console.error("[admin/categories] write failed:", err);
  return "Unable to save this category. Please try again.";
}

function readFormValues(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    image: formData.get("image") || undefined,
    icon: formData.get("icon") || undefined,
    tier: formData.get("tier"),
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
  };
}

async function revalidateCategoryProductPages(categoryId: string) {
  const products = await db.product.findMany({ where: { categoryId }, select: { slug: true } });
  for (const p of products) revalidatePath(`/product/${p.slug}`);
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slugCandidate = slugInput ? slugInput : slugify(name);

  const parsed = categorySchema.safeParse({ ...readFormValues(formData), slug: slugCandidate });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const slugTaken = await db.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
  if (slugTaken) {
    return { errors: { slug: "A category with this slug already exists." } };
  }

  const maxSort = await db.category.aggregate({ _max: { sortOrder: true } });
  const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  try {
    await db.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          image: data.image ?? null,
          icon: data.icon ?? null,
          tier: data.tier,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          sortOrder: nextSortOrder,
        },
        select: { id: true },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "CATEGORY",
        entityId: category.id,
        description: `Created category ${data.name}`,
      });
    });
  } catch (err) {
    return { errors: { form: mapCategoryWriteError(err) } };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/admin/products/new");
  revalidatePath("/shop");
  redirect("/admin/categories");
}

export async function updateCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing category id." } };
  }

  const existing = await db.category.findUnique({
    where: { id },
    select: { name: true, slug: true, description: true, image: true, icon: true, tier: true },
  });
  if (!existing) {
    return { errors: { form: "This category no longer exists." } };
  }

  const slug = String(formData.get("slug") ?? "").trim();
  const parsed = categorySchema.safeParse({ ...readFormValues(formData), slug });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.slug !== existing.slug) {
    const slugTaken = await db.category.findUnique({ where: { slug: data.slug }, select: { id: true } });
    if (slugTaken) return { errors: { slug: "A category with this slug already exists." } };
  }

  const changedFields: string[] = [];
  if (existing.name !== data.name) changedFields.push("name");
  if (existing.slug !== data.slug) changedFields.push("slug");
  if ((existing.description ?? null) !== (data.description ?? null)) changedFields.push("description");
  if ((existing.image ?? null) !== (data.image ?? null)) changedFields.push("image");
  if ((existing.icon ?? null) !== (data.icon ?? null)) changedFields.push("icon");
  if (existing.tier !== data.tier) changedFields.push("tier");

  try {
    await db.$transaction(async (tx) => {
      await tx.category.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          image: data.image ?? null,
          icon: data.icon ?? null,
          tier: data.tier,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
        },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "CATEGORY",
        entityId: id,
        description: `Updated category ${data.name}`,
        metadata: { changedFields },
      });
    });
  } catch (err) {
    return { errors: { form: mapCategoryWriteError(err) } };
  }

  await revalidateCategoryProductPages(id);
  revalidatePath("/admin/categories");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath(`/shop/${existing.slug}`);
  if (data.slug !== existing.slug) revalidatePath(`/shop/${data.slug}`);
  redirect("/admin/categories");
}

export async function deleteCategory(id: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  const category = await db.category.findUnique({
    where: { id },
    select: { name: true, slug: true, _count: { select: { products: true } } },
  });
  if (!category) {
    return { error: "This category no longer exists." };
  }

  if (category._count.products > 0) {
    const count = category._count.products;
    return {
      error: `This category is currently used by ${count} product${count === 1 ? "" : "s"}. Reassign those products to another category before deleting it.`,
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.category.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "CATEGORY",
        entityId: id,
        description: `Deleted category ${category.name}`,
      });
    });
  } catch (err) {
    return { error: mapCategoryWriteError(err) };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath(`/shop/${category.slug}`);
  return {};
}
