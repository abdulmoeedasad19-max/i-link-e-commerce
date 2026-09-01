// Phase 4.3.10 (Stage B) — the single, authoritative place where checkout
// computes cart totals and evaluates a coupon. Both the preview action
// (applyCoupon) and the authoritative mutation (placeOrder) in
// src/app/(storefront)/checkout/actions.ts call these same two functions —
// there is deliberately no second copy of this math or these eligibility
// rules anywhere else.
import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { Coupon } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getProductById } from "@/lib/products-repository";
import { classifyCoupon } from "@/lib/admin/coupon-status";
import { formatPrice } from "@/lib/utils";
import { getStoreSettings } from "@/lib/admin/store-settings";

// Mirrors the cap already enforced when cart quantities are written
// (src/app/(storefront)/cart/actions.ts) — re-checked here defensively
// since the CartItem row is the authoritative source for an order, and
// this is the last checkpoint before it becomes an immutable OrderItem.
const MAX_QUANTITY = 99;

export type CheckoutLineItem = {
  productSlug: string;
  nameSnapshot: string;
  price: Prisma.Decimal;
  quantity: number;
};

export type CheckoutCartSummary = {
  lineItems: CheckoutLineItem[];
  subtotal: Prisma.Decimal;
  // Flat, store-wide shipping cost (Phase 4.4.8) — read from the single
  // StoreSettings singleton via getStoreSettings(), the one authoritative
  // settings reader. Both applyCoupon() and placeOrder() derive their
  // shipping figure from this same field of this same summary object, so
  // there is never a second, independently-computed shipping value.
  shipping: Prisma.Decimal;
};

export type CheckoutCartSummaryResult = { ok: true; summary: CheckoutCartSummary } | { ok: false; error: string };

/**
 * Loads the authenticated user's real database cart, validates it exactly
 * as checkout always has, and computes subtotal/shipping on Prisma.Decimal.
 * Never trusts anything from the client — this is the one place both the
 * coupon preview and the final order draw their cart numbers from.
 */
export async function getCheckoutCartSummary(userId: string): Promise<CheckoutCartSummaryResult> {
  const cartItems = await db.cartItem.findMany({ where: { userId } });
  if (cartItems.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const lineItems: CheckoutLineItem[] = [];
  for (const item of cartItems) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > MAX_QUANTITY) {
      return {
        ok: false,
        error: "One or more items in your cart have an invalid quantity. Please review your cart and try again.",
      };
    }

    const product = await getProductById(item.productId);
    if (!product) {
      return {
        ok: false,
        error: "One or more items in your cart are no longer available. Please review your cart and try again.",
      };
    }

    lineItems.push({
      productSlug: product.slug,
      nameSnapshot: product.name,
      price: new Prisma.Decimal(product.price),
      quantity: item.quantity,
    });
  }

  const subtotal = lineItems.reduce((sum, li) => sum.plus(li.price.times(li.quantity)), new Prisma.Decimal(0));
  const settings = await getStoreSettings();
  const shipping = settings.shippingCost;

  return { ok: true, summary: { lineItems, subtotal, shipping } };
}

export type CouponEvaluationResult = { ok: true; discountAmount: Prisma.Decimal } | { ok: false; error: string };

/**
 * The single authoritative coupon-eligibility + discount-calculation
 * function. Reuses the existing Stage A classifyCoupon() precedence for
 * isActive/dates/usage-limit rather than re-implementing it — a coupon
 * that isn't currently ACTIVE by that same definition can never be applied
 * at checkout either.
 */
export function evaluateCouponForOrder(
  coupon: Coupon | null,
  subtotal: Prisma.Decimal,
  now: Date = new Date(),
): CouponEvaluationResult {
  if (!coupon) {
    return { ok: false, error: "Coupon not found." };
  }

  const status = classifyCoupon(coupon, now);
  if (status === "DISABLED") return { ok: false, error: "This coupon is currently disabled." };
  if (status === "SCHEDULED") return { ok: false, error: "This coupon is not active yet." };
  if (status === "EXPIRED") return { ok: false, error: "This coupon has expired." };
  if (status === "EXHAUSTED") return { ok: false, error: "This coupon has reached its usage limit." };

  if (coupon.minimumOrderAmount && subtotal.lessThan(coupon.minimumOrderAmount)) {
    return {
      ok: false,
      error: `Minimum order amount for this coupon is ${formatPrice(coupon.minimumOrderAmount.toNumber())}.`,
    };
  }

  let discount =
    coupon.discountType === "PERCENTAGE"
      ? subtotal.times(coupon.discountValue).dividedBy(100)
      : coupon.discountValue;

  if (coupon.maximumDiscountAmount) {
    discount = Prisma.Decimal.min(discount, coupon.maximumDiscountAmount);
  }
  // Never exceed subtotal, never negative — the final clamp regardless of
  // how discount was derived above.
  discount = Prisma.Decimal.min(discount, subtotal);
  if (discount.lessThan(0)) discount = new Prisma.Decimal(0);

  return { ok: true, discountAmount: discount };
}
