// Phase 4.3.9 — centralized coupon status computation. Mirrors the
// label/variant map convention of src/lib/order-status.ts and
// src/lib/quotation-status.ts, except the underlying value is never
// stored — Coupon has no status column by design (see prisma/schema.prisma)
// — it is computed here, once, and reused by every page that displays it.
export type CouponComputedStatus = "DISABLED" | "SCHEDULED" | "ACTIVE" | "EXPIRED" | "EXHAUSTED";

export const couponStatusLabel: Record<CouponComputedStatus, string> = {
  DISABLED: "Disabled",
  SCHEDULED: "Scheduled",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  EXHAUSTED: "Exhausted",
};

export const couponStatusVariant: Record<CouponComputedStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  DISABLED: "navy",
  SCHEDULED: "royal",
  ACTIVE: "success",
  EXPIRED: "error",
  EXHAUSTED: "gold",
};

export type ClassifiableCoupon = {
  isActive: boolean;
  startDate: Date | null;
  endDate: Date | null;
  usageLimit: number | null;
  usageCount: number;
};

/**
 * Deterministic precedence, per the approved spec:
 *   1. isActive === false          -> DISABLED
 *   2. usageLimit reached           -> EXHAUSTED
 *   3. startDate is in the future   -> SCHEDULED
 *   4. endDate is in the past       -> EXPIRED
 *   5. otherwise                    -> ACTIVE
 */
export function classifyCoupon(coupon: ClassifiableCoupon, now: Date = new Date()): CouponComputedStatus {
  if (!coupon.isActive) return "DISABLED";
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) return "EXHAUSTED";
  if (coupon.startDate && now < coupon.startDate) return "SCHEDULED";
  if (coupon.endDate && now > coupon.endDate) return "EXPIRED";
  return "ACTIVE";
}
