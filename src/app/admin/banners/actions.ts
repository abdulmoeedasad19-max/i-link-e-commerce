"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logActivity } from "@/lib/admin/activity-log";

const bannerSchema = z.object({
  image: z.string().trim().min(1, "Image is required.").max(500, "Image path/URL is too long."),
  imageAlt: z.string().trim().min(1, "Image alt text is required.").max(300, "Alt text is too long."),
  category: z.string().trim().min(1, "Category is required.").max(100, "Category is too long."),
  title: z.string().trim().min(1, "Title is required.").max(200, "Title is too long."),
  description: z.string().trim().min(1, "Description is required.").max(1000, "Description is too long."),
  primaryCtaLabel: z.string().trim().min(1, "Primary button label is required.").max(100, "Primary button label is too long."),
  primaryCtaHref: z.string().trim().min(1, "Primary button link is required.").max(500, "Primary button link is too long."),
  secondaryCtaLabel: z.string().trim().min(1, "Secondary button label is required.").max(100, "Secondary button label is too long."),
  secondaryCtaHref: z.string().trim().min(1, "Secondary button link is required.").max(500, "Secondary button link is too long."),
  sortOrder: z.coerce.number().int("Sort order must be a whole number.").min(0, "Sort order must be zero or greater.").max(9999, "Sort order is too large."),
  isActive: z.boolean(),
});

type BannerFormField = keyof z.infer<typeof bannerSchema> | "form";

export type BannerActionState = {
  errors?: Partial<Record<BannerFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<BannerActionState["errors"]> {
  const errors: NonNullable<BannerActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as BannerFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapBannerWriteError(err: unknown): string {
  if (isPrismaKnownError(err) && err.code === "P2025") {
    return "This banner no longer exists.";
  }
  console.error("[admin/banners] write failed:", err);
  return "Unable to save this banner. Please try again.";
}

function readFormValues(formData: FormData) {
  return {
    image: formData.get("image"),
    imageAlt: formData.get("imageAlt"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description"),
    primaryCtaLabel: formData.get("primaryCtaLabel"),
    primaryCtaHref: formData.get("primaryCtaHref"),
    secondaryCtaLabel: formData.get("secondaryCtaLabel"),
    secondaryCtaHref: formData.get("secondaryCtaHref"),
    sortOrder: formData.get("sortOrder"),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createBanner(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();

  const parsed = bannerSchema.safeParse(readFormValues(formData));
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  try {
    // id/createdAt/updatedAt are always database-controlled — never
    // accepted from the client, and not passed here.
    await db.$transaction(async (tx) => {
      const banner = await tx.banner.create({ data, select: { id: true } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "BANNER",
        entityId: banner.id,
        description: `Created banner "${data.title}"`,
      });
    });
  } catch (err) {
    return { errors: { form: mapBannerWriteError(err) } };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  redirect("/admin/banners");
}

export async function updateBanner(_prevState: BannerActionState, formData: FormData): Promise<BannerActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing banner id." } };
  }

  const existing = await db.banner.findUnique({
    where: { id },
    select: {
      image: true,
      imageAlt: true,
      category: true,
      title: true,
      description: true,
      primaryCtaLabel: true,
      primaryCtaHref: true,
      secondaryCtaLabel: true,
      secondaryCtaHref: true,
      sortOrder: true,
      isActive: true,
    },
  });
  if (!existing) {
    return { errors: { form: "This banner no longer exists." } };
  }

  const parsed = bannerSchema.safeParse(readFormValues(formData));
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  // Small, explicit field-by-field diff — never a blind serialization of
  // the whole row — matching the established Phase 4.4.7 "changedFields"
  // pattern. Matches updateCategory/updateProduct's own convention: always
  // writes and always logs, even if the diff turns out empty (unlike the
  // Settings singleton's deliberate no-op short-circuit) — a general CRUD
  // save action, not a status-transition action.
  const changedFields: string[] = [];
  for (const key of Object.keys(data) as (keyof typeof data)[]) {
    if (existing[key] !== data[key]) changedFields.push(key);
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.banner.update({ where: { id }, data });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "BANNER",
        entityId: id,
        description: `Updated banner "${data.title}"`,
        metadata: { changedFields },
      });
    });
  } catch (err) {
    return { errors: { form: mapBannerWriteError(err) } };
  }

  revalidatePath("/admin/banners");
  revalidatePath(`/admin/banners/${id}/edit`);
  revalidatePath("/");
  redirect("/admin/banners");
}

export type DeleteBannerResult = { error?: string };

export async function deleteBanner(id: string): Promise<DeleteBannerResult> {
  const session = await requireAdmin();

  const banner = await db.banner.findUnique({ where: { id }, select: { title: true } });
  if (!banner) {
    return { error: "This banner no longer exists." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.banner.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "BANNER",
        entityId: id,
        description: `Deleted banner "${banner.title}"`,
      });
    });
  } catch (err) {
    return { error: mapBannerWriteError(err) };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return {};
}

// See src/app/admin/orders/actions.ts for the full rationale behind this
// local-sentinel-error pattern.
class RaceLostError extends Error {}

export type ToggleBannerStatusResult = { error?: string };

export async function toggleBannerStatus(id: string, expectedIsActive: boolean): Promise<ToggleBannerStatusResult> {
  const session = await requireAdmin();

  const banner = await db.banner.findUnique({ where: { id }, select: { isActive: true, title: true } });
  if (!banner) {
    return { error: "This banner no longer exists." };
  }

  try {
    // Race-safe, mirroring the exact conditional-update pattern already
    // established for Coupon's own toggleCouponActive: the WHERE clause
    // re-checks the expected current value at the moment of the write.
    await db.$transaction(async (tx) => {
      const result = await tx.banner.updateMany({
        where: { id, isActive: expectedIsActive },
        data: { isActive: !expectedIsActive },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "BANNER",
        entityId: id,
        description: `${expectedIsActive ? "Deactivated" : "Activated"} banner "${banner.title}"`,
        metadata: { field: "isActive", from: expectedIsActive, to: !expectedIsActive },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This banner's status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return {};
}

export type MoveBannerResult = { error?: string };

export async function moveBanner(id: string, direction: "up" | "down"): Promise<MoveBannerResult> {
  const session = await requireAdmin();

  // Same exact mechanism already proven by moveProductImage
  // (src/app/admin/products/[id]/edit/image-actions.ts): read the full
  // ordered list, find this row's neighbor, swap sortOrder values in one
  // transaction. Works correctly even if sortOrder values aren't perfectly
  // contiguous, since it only ever swaps two known values, never assumes a
  // specific numbering scheme.
  const banners = await db.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, sortOrder: true, title: true },
  });
  const index = banners.findIndex((b) => b.id === id);
  if (index === -1) {
    return { error: "This banner no longer exists." };
  }

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= banners.length) {
    return {}; // already at the edge — no-op, not an error
  }

  const current = banners[index];
  const swapWith = banners[swapIndex];

  try {
    await db.$transaction(async (tx) => {
      await tx.banner.update({ where: { id: current.id }, data: { sortOrder: swapWith.sortOrder } });
      await tx.banner.update({ where: { id: swapWith.id }, data: { sortOrder: current.sortOrder } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "BANNER",
        entityId: current.id,
        description: `Moved banner "${current.title}" ${direction}`,
        metadata: { changedFields: ["sortOrder"] },
      });
    });
  } catch (err) {
    return { error: mapBannerWriteError(err) };
  }

  revalidatePath("/admin/banners");
  revalidatePath("/");
  return {};
}
