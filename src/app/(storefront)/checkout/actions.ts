"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { normalizeCouponCode } from "@/lib/admin/coupons";
import { getCheckoutCartSummary, evaluateCouponForOrder } from "@/lib/coupon-checkout";
import { notifyOrderConfirmation } from "@/lib/email/notify";

const checkoutSchema = z.object({
  addressId: z.string().min(1, "Please select a shipping address."),
  // Only these two literal values are ever accepted — anything else
  // (PAID, STRIPE, ADMIN, FREE, BANK_TRANSFER, or any other string) fails
  // validation here and never reaches the database. BANK_TRANSFER remains
  // a valid PaymentMethod enum value (one real historical order uses it)
  // but is deliberately no longer an active checkout choice as of Phase
  // 4.4.14 — EASYPAISA replaced it as this store's second payment option.
  paymentMethod: z.enum(["COD", "EASYPAISA"]),
  // Optional — an empty/absent value means "no coupon", not an error.
  couponCode: z.string().trim().optional(),
});

export type CheckoutState = {
  errors?: {
    addressId?: string;
    paymentMethod?: string;
    form?: string;
  };
};

// Thrown only for coupon-related rejections inside the placeOrder
// transaction, so its message (already friendly — see
// evaluateCouponForOrder) can be surfaced directly, the same way
// CART_ALREADY_CLEARED is distinguished from an unexpected/raw error below.
class CheckoutCouponError extends Error {}

export type ApplyCouponState = {
  code?: string;
  discountAmount?: number;
  subtotal?: number;
  total?: number;
  error?: string;
};

/**
 * Read-only preview: recomputes the real cart subtotal server-side and
 * evaluates the coupon against it, purely for UI feedback before the
 * customer submits the order. Never mutates Coupon (no usageCount
 * increment), never mutates Order, never clears the cart — placeOrder()
 * below is the only place a coupon actually gets applied.
 *
 * Called imperatively (useTransition), not bound to a <form>/useActionState
 * — matching this codebase's convention for other imperative, non-form
 * server actions (e.g. toggleCouponActive) — so it takes a plain string
 * rather than FormData.
 */
export async function applyCoupon(rawCode: string): Promise<ApplyCouponState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to apply a coupon." };
  }
  const userId = session.user.id;

  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { error: "Coupon code is required." };
  }

  const cartResult = await getCheckoutCartSummary(userId);
  if (!cartResult.ok) {
    return { error: cartResult.error };
  }
  const { subtotal } = cartResult.summary;

  const coupon = await db.coupon.findUnique({ where: { code } });
  const evaluation = evaluateCouponForOrder(coupon, subtotal, new Date());
  if (!evaluation.ok) {
    return { error: evaluation.error };
  }

  const total = subtotal.minus(evaluation.discountAmount);
  return {
    code,
    discountAmount: evaluation.discountAmount.toNumber(),
    subtotal: subtotal.toNumber(),
    total: total.toNumber(),
  };
}

export async function placeOrder(_prevState: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { form: "You must be logged in to place an order." } };
  }
  const userId = session.user.id;

  const parsed = checkoutSchema.safeParse({
    addressId: formData.get("addressId"),
    paymentMethod: formData.get("paymentMethod"),
    couponCode: formData.get("couponCode") || undefined,
  });
  if (!parsed.success) {
    const errors: CheckoutState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "addressId") errors.addressId = "Please select a shipping address.";
      if (field === "paymentMethod") errors.paymentMethod = "Please select a valid payment method.";
    }
    return { errors: Object.keys(errors).length > 0 ? errors : { form: "Please check your order details and try again." } };
  }
  const { addressId, paymentMethod } = parsed.data;
  // Empty/absent means "no coupon" — never an error by itself.
  const couponCode = parsed.data.couponCode ? normalizeCouponCode(parsed.data.couponCode) : null;

  // Ownership check before anything else — a forged or foreign address id
  // is rejected here, never trusted just because it was submitted. The
  // full set of fields is read once here, and those exact values (not a
  // fresh lookup later) become the order's shipping snapshot below, so the
  // snapshot can never drift from what was actually verified as belonging
  // to this user.
  const address = await db.address.findFirst({
    where: { id: addressId, userId },
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      province: true,
      postalCode: true,
      phone: true,
    },
  });
  if (!address) {
    return { errors: { form: "Please select a valid shipping address." } };
  }

  // The authoritative cart: read fresh from the database, scoped to the
  // authenticated user. Nothing about products, prices, or quantities is
  // ever read from client input here.
  const cartResult = await getCheckoutCartSummary(userId);
  if (!cartResult.ok) {
    return { errors: { form: cartResult.error } };
  }
  const { lineItems, subtotal, shipping } = cartResult.summary;

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      // Clearing the cart FIRST (before creating the order) is what makes
      // an accidental double submission safe: two concurrent requests
      // deleting the same CartItem rows serialize on Postgres's row locks,
      // and whichever one loses that race deletes zero rows here and
      // aborts the whole transaction before any order is created. This
      // must remain the first database operation inside the transaction.
      const deleted = await tx.cartItem.deleteMany({ where: { userId } });
      if (deleted.count === 0) {
        throw new Error("CART_ALREADY_CLEARED");
      }

      // Coupon is optional. When present, it's re-validated here from
      // scratch against a fresh, transaction-scoped read — the pre-submit
      // preview (applyCoupon) is informational only and is never trusted
      // as the source of the actual discount applied. If anything below
      // throws, the cart-clear above rolls back too, so a failed coupon
      // never empties the customer's cart.
      let discountCode: string | null = null;
      let discountAmount: Prisma.Decimal | null = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon) {
          throw new CheckoutCouponError("Coupon not found.");
        }
        const evaluation = evaluateCouponForOrder(coupon, subtotal, new Date());
        if (!evaluation.ok) {
          throw new CheckoutCouponError(evaluation.error);
        }

        // The actual protection against two concurrent checkouts consuming
        // the last available use: a single atomic conditional update, not
        // a read-then-write. If this matches zero rows, the coupon became
        // unavailable between the check above and this statement (a
        // concurrent order, a concurrent admin edit, or the clock crossing
        // a date boundary) — the whole transaction, including the cart
        // clear, rolls back.
        const now = new Date();
        const incremented = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            isActive: true,
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
            ...(coupon.usageLimit !== null ? { usageCount: { lt: coupon.usageLimit } } : {}),
          },
          data: { usageCount: { increment: 1 } },
        });
        if (incremented.count === 0) {
          throw new CheckoutCouponError("This coupon is no longer available.");
        }

        discountCode = coupon.code;
        discountAmount = evaluation.discountAmount;
      }

      const total = subtotal.minus(discountAmount ?? new Prisma.Decimal(0)).plus(shipping);

      const order = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          subtotal,
          total,
          discountCode,
          discountAmount,
          // Historical snapshot (Phase 4.4.8) — the exact shipping value
          // already read into `shipping` above (via getCheckoutCartSummary,
          // which is itself the same shared reader applyCoupon's preview
          // uses), never a second, independent settings lookup here. A
          // later admin edit to StoreSettings.shippingCost can never change
          // what this order displays or totals.
          shippingAmount: shipping,
          shippingAddressId: addressId,
          // Selection only — no gateway/verification exists yet, so every
          // order's payment status starts and stays PENDING regardless of
          // which method was chosen. Never read from the client.
          paymentMethod,
          paymentStatus: "PENDING",
          // Historical snapshot, copied from the address record already
          // verified above — never re-read from Address later, so a
          // future edit or deletion of this address can never change what
          // this order displays.
          shippingLabel: address.label,
          shippingLine1: address.line1,
          shippingLine2: address.line2,
          shippingCity: address.city,
          shippingProvince: address.province,
          shippingPostalCode: address.postalCode,
          shippingPhone: address.phone,
          items: {
            create: lineItems.map((li) => ({
              productSlug: li.productSlug,
              nameSnapshot: li.nameSnapshot,
              priceSnapshot: li.price,
              quantity: li.quantity,
            })),
          },
        },
        select: { id: true },
      });

      return order.id;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_ALREADY_CLEARED") {
      return { errors: { form: "This order has already been placed." } };
    }
    if (error instanceof CheckoutCouponError) {
      return { errors: { form: error.message } };
    }
    // Never expose raw Prisma/SQL errors to the client.
    return { errors: { form: "Unable to place your order. Please try again." } };
  }

  // Downstream of the committed transaction above, never inside it — an
  // email provider outage must never affect order creation. Never throws.
  notifyOrderConfirmation(orderId);

  redirect(`/checkout/success/${orderId}`);
}
