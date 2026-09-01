"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { normalizeCouponCode, COUPON_CODE_MAX_LENGTH } from "@/lib/admin/coupons";
import { logActivity } from "@/lib/admin/activity-log";

// See src/app/admin/orders/actions.ts for the full rationale.
class RaceLostError extends Error {}

const couponSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required.").max(COUPON_CODE_MAX_LENGTH, "Code is too long."),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"], { message: "Please select a valid discount type." }),
    discountValue: z.coerce.number().positive("Discount value must be greater than zero."),
    minimumOrderAmount: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().min(0, "Minimum order amount cannot be negative.").optional(),
    ),
    maximumDiscountAmount: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number().positive("Maximum discount must be greater than zero.").optional(),
    ),
    startDate: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.date().optional()),
    endDate: z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.coerce.date().optional()),
    usageLimit: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce
        .number()
        .int("Usage limit must be a whole number.")
        .positive("Usage limit must be a positive number.")
        .optional(),
    ),
    isActive: z.boolean(),
  })
  .refine((data) => !(data.discountType === "PERCENTAGE" && data.discountValue > 100), {
    message: "A percentage discount cannot exceed 100.",
    path: ["discountValue"],
  })
  .refine((data) => !(data.startDate && data.endDate && data.endDate < data.startDate), {
    message: "End date cannot be before the start date.",
    path: ["endDate"],
  });

type CouponFormField =
  | "code"
  | "discountType"
  | "discountValue"
  | "minimumOrderAmount"
  | "maximumDiscountAmount"
  | "startDate"
  | "endDate"
  | "usageLimit"
  | "form";

export type CouponActionState = {
  errors?: Partial<Record<CouponFormField, string>>;
};

function collectZodErrors(error: z.ZodError): NonNullable<CouponActionState["errors"]> {
  const errors: NonNullable<CouponActionState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as CouponFormField] = issue.message;
    }
  }
  return errors;
}

function isPrismaKnownError(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

function mapCouponWriteError(err: unknown): string {
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") return "A coupon with this code already exists.";
    if (err.code === "P2025") return "This coupon no longer exists.";
  }
  console.error("[admin/discounts] write failed:", err);
  return "Unable to save this coupon. Please try again.";
}

function readFormValues(formData: FormData) {
  return {
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minimumOrderAmount: formData.get("minimumOrderAmount") || undefined,
    maximumDiscountAmount: formData.get("maximumDiscountAmount") || undefined,
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    usageLimit: formData.get("usageLimit") || undefined,
    isActive: formData.get("isActive") === "on",
  };
}

function toWriteData(data: z.infer<typeof couponSchema>) {
  return {
    code: data.code,
    discountType: data.discountType,
    discountValue: data.discountValue.toFixed(2),
    minimumOrderAmount: data.minimumOrderAmount != null ? data.minimumOrderAmount.toFixed(2) : null,
    maximumDiscountAmount: data.maximumDiscountAmount != null ? data.maximumDiscountAmount.toFixed(2) : null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    usageLimit: data.usageLimit ?? null,
    isActive: data.isActive,
  };
}

export async function createCoupon(_prevState: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const session = await requireAdmin();

  const normalizedCode = normalizeCouponCode(String(formData.get("code") ?? ""));
  const parsed = couponSchema.safeParse({ ...readFormValues(formData), code: normalizedCode });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  const existing = await db.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
  if (existing) {
    return { errors: { code: "A coupon with this code already exists." } };
  }

  try {
    await db.$transaction(async (tx) => {
      const coupon = await tx.coupon.create({ data: toWriteData(data), select: { id: true } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "CREATE",
        entityType: "COUPON",
        entityId: coupon.id,
        description: `Created coupon ${data.code}`,
      });
    });
  } catch (err) {
    return { errors: { form: mapCouponWriteError(err) } };
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}

export async function updateCoupon(_prevState: CouponActionState, formData: FormData): Promise<CouponActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) {
    return { errors: { form: "Missing coupon id." } };
  }

  const existing = await db.coupon.findUnique({
    where: { id },
    select: {
      code: true,
      discountType: true,
      discountValue: true,
      minimumOrderAmount: true,
      maximumDiscountAmount: true,
      startDate: true,
      endDate: true,
      usageLimit: true,
      isActive: true,
    },
  });
  if (!existing) {
    return { errors: { form: "This coupon no longer exists." } };
  }

  const normalizedCode = normalizeCouponCode(String(formData.get("code") ?? ""));
  const parsed = couponSchema.safeParse({ ...readFormValues(formData), code: normalizedCode });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;

  if (data.code !== existing.code) {
    const codeTaken = await db.coupon.findUnique({ where: { code: data.code }, select: { id: true } });
    if (codeTaken) return { errors: { code: "A coupon with this code already exists." } };
  }

  // Small, explicit field-by-field diff — never a blind serialization of
  // the whole row — matching the "changedFields" metadata shape given in
  // the Phase 4.4.7 spec.
  const changedFields: string[] = [];
  if (existing.code !== data.code) changedFields.push("code");
  if (existing.discountType !== data.discountType) changedFields.push("discountType");
  if (existing.discountValue.toNumber() !== data.discountValue) changedFields.push("discountValue");
  if ((existing.minimumOrderAmount?.toNumber() ?? null) !== (data.minimumOrderAmount ?? null)) {
    changedFields.push("minimumOrderAmount");
  }
  if ((existing.maximumDiscountAmount?.toNumber() ?? null) !== (data.maximumDiscountAmount ?? null)) {
    changedFields.push("maximumDiscountAmount");
  }
  if ((existing.startDate?.getTime() ?? null) !== (data.startDate?.getTime() ?? null)) changedFields.push("startDate");
  if ((existing.endDate?.getTime() ?? null) !== (data.endDate?.getTime() ?? null)) changedFields.push("endDate");
  if ((existing.usageLimit ?? null) !== (data.usageLimit ?? null)) changedFields.push("usageLimit");
  if (existing.isActive !== data.isActive) changedFields.push("isActive");

  try {
    // usageCount, createdAt are never part of toWriteData — this can never
    // touch either, matching the spec's "not editable" list exactly.
    await db.$transaction(async (tx) => {
      await tx.coupon.update({ where: { id }, data: toWriteData(data) });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "COUPON",
        entityId: id,
        description: `Updated coupon ${data.code}`,
        metadata: { changedFields },
      });
    });
  } catch (err) {
    return { errors: { form: mapCouponWriteError(err) } };
  }

  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/discounts/${id}`);
  revalidatePath(`/admin/discounts/${id}/edit`);
  redirect("/admin/discounts");
}

export type ToggleCouponActiveResult = { error?: string };

export async function toggleCouponActive(id: string, expectedIsActive: boolean): Promise<ToggleCouponActiveResult> {
  const session = await requireAdmin();

  const coupon = await db.coupon.findUnique({ where: { id }, select: { isActive: true, code: true } });
  if (!coupon) {
    return { error: "This coupon no longer exists." };
  }

  try {
    // Race-safe: the WHERE clause re-checks the expected current value at
    // the moment of the write, mirroring updateOrderStatus/
    // updateQuotationStatus.
    await db.$transaction(async (tx) => {
      const result = await tx.coupon.updateMany({
        where: { id, isActive: expectedIsActive },
        data: { isActive: !expectedIsActive },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "COUPON",
        entityId: id,
        description: `${expectedIsActive ? "Deactivated" : "Activated"} coupon ${coupon.code}`,
        metadata: { field: "isActive", from: expectedIsActive, to: !expectedIsActive },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This coupon's status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/discounts/${id}`);
  return {};
}

export type DeleteCouponResult = { error?: string };

export async function deleteCoupon(id: string): Promise<DeleteCouponResult> {
  const session = await requireAdmin();

  const coupon = await db.coupon.findUnique({ where: { id }, select: { usageCount: true, code: true } });
  if (!coupon) {
    return { error: "This coupon no longer exists." };
  }

  // Coupon has no relations, so a hard delete is DB-safe either way — this
  // is an application-level discipline check only, per the approved spec:
  // once a coupon has recorded usage, deactivating (not deleting) preserves
  // that history.
  if (coupon.usageCount > 0) {
    return { error: "This coupon has recorded usage and can't be deleted. Deactivate it instead." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.coupon.delete({ where: { id } });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "DELETE",
        entityType: "COUPON",
        entityId: id,
        description: `Deleted coupon ${coupon.code}`,
      });
    });
  } catch (err) {
    return { error: mapCouponWriteError(err) };
  }

  revalidatePath("/admin/discounts");
  return {};
}
