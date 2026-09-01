"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { orderStatusLabel } from "@/lib/order-status";
import { paymentStatusLabel } from "@/lib/payment";
import { ALLOWED_ORDER_TRANSITIONS } from "@/lib/admin/order-transitions";
import { ALLOWED_PAYMENT_TRANSITIONS } from "@/lib/admin/payment-transitions";
import { logActivity } from "@/lib/admin/activity-log";
import { notifyOrderStatusChange, notifyPaymentConfirmation, notifyRefund } from "@/lib/email/notify";
import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: readonly OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const VALID_PAYMENT_STATUSES: readonly PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

// Thrown only to abort the transaction when the race-safe conditional
// update matches zero rows (another admin/customer changed the row first)
// — caught locally and mapped back to the exact existing friendly message.
// Mirrors the established local-sentinel-error convention already used by
// CheckoutCouponError in src/app/(storefront)/checkout/actions.ts.
class RaceLostError extends Error {}

// No automatic inventory changes and no refund logic are triggered by any
// transition below — neither exists in this schema, and none is invented
// here. See src/lib/admin/order-transitions.ts for the full transition
// policy and its rationale.

export type UpdateOrderStatusResult = { error?: string };

export async function updateOrderStatus(
  orderId: string,
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): Promise<UpdateOrderStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // five real enum values" — this rejects any forged/typo'd value before
  // it ever reaches a query.
  if (!VALID_STATUSES.includes(nextStatus)) {
    return { error: "Invalid order status." };
  }
  if (!VALID_STATUSES.includes(currentStatus)) {
    return { error: "Invalid order status." };
  }

  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) {
    return { error: "This order no longer exists." };
  }

  const allowed = ALLOWED_ORDER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      error: `This order can't be moved from ${orderStatusLabel[order.status]} to ${orderStatusLabel[nextStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring the exact pattern already established by the
    // customer's own cancelOrder() action: the WHERE clause re-checks the
    // expected current status at the moment of the write, not just at the
    // read above. If it changed in between (another admin tab, or the
    // customer cancelling it themselves), this matches zero rows instead of
    // overwriting a state the admin never actually saw. The audit log
    // write is inside the same transaction, so it can only ever be
    // created alongside a genuinely successful, race-winning update.
    await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        // deliveredAt (Phase 4.4.18) is set exactly once, the moment an
        // order first reaches DELIVERED — never overwritten on any other
        // transition, and never touched anywhere else in the codebase.
        // It's the sole timestamp ReturnRequest's 7-day eligibility window
        // computes from.
        data: { status: nextStatus, ...(nextStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}) },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "ORDER",
        entityId: orderId,
        description: `Changed order status from ${orderStatusLabel[order.status]} to ${orderStatusLabel[nextStatus]}`,
        metadata: { field: "status", from: order.status, to: nextStatus },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This order's status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  // Downstream of the committed, race-won transaction above — a losing
  // request (RaceLostError, caught above) never reaches this line, so no
  // email is ever sent for a transition that didn't actually happen.
  notifyOrderStatusChange(orderId, nextStatus);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin");
  return {};
}

// Phase 4.4.3 — a narrow, independent action for the payment-status state
// machine (see src/lib/admin/payment-transitions.ts). Deliberately never
// touches OrderStatus, subtotal/total, discountCode/discountAmount, or
// items — payment reconciliation and fulfillment tracking are separate
// concerns in this schema and stay separate here. No dashboard card
// currently reflects paymentStatus, so unlike updateOrderStatus above this
// doesn't revalidate "/admin".

export type UpdatePaymentStatusResult = { error?: string };

export async function updatePaymentStatus(
  orderId: string,
  currentPaymentStatus: PaymentStatus,
  nextPaymentStatus: PaymentStatus,
): Promise<UpdatePaymentStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // four real enum values" — this rejects any forged/typo'd value before
  // it ever reaches a query.
  if (!VALID_PAYMENT_STATUSES.includes(nextPaymentStatus)) {
    return { error: "Invalid payment status." };
  }
  if (!VALID_PAYMENT_STATUSES.includes(currentPaymentStatus)) {
    return { error: "Invalid payment status." };
  }

  const order = await db.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
  if (!order) {
    return { error: "This order no longer exists." };
  }

  const allowed = ALLOWED_PAYMENT_TRANSITIONS[order.paymentStatus] ?? [];
  if (!allowed.includes(nextPaymentStatus)) {
    return {
      error: `Payment status can't be moved from ${paymentStatusLabel[order.paymentStatus]} to ${paymentStatusLabel[nextPaymentStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring updateOrderStatus above exactly: the WHERE clause
    // re-checks the expected current payment status at the moment of the
    // write, not just at the read above. Logged as its own, separate
    // STATUS_CHANGE event from order-status changes — paymentStatus and
    // status are independent axes in this schema, and stay independent
    // here too (see the "field" key in metadata below).
    await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: order.paymentStatus },
        data: { paymentStatus: nextPaymentStatus },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "ORDER",
        entityId: orderId,
        description: `Changed payment status from ${paymentStatusLabel[order.paymentStatus]} to ${paymentStatusLabel[nextPaymentStatus]}`,
        metadata: { field: "paymentStatus", from: order.paymentStatus, to: nextPaymentStatus },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return {
        error: "This order's payment status has changed since you loaded this page. Please refresh and try again.",
      };
    }
    throw err;
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// Phase 4.4.14 — the guided, business-rule-gated path for verifying a
// manual Easypaisa payment. Deliberately separate from updatePaymentStatus
// above (which stays fully untouched, still available for COD/other manual
// reconciliation and for FAILED/REFUNDED transitions): this action layers
// two extra checks that generic transition doesn't and shouldn't enforce
// for every payment method — the order must actually use EASYPAISA, and a
// transactionId must already be on file — matching the spec's explicit
// "if no transaction ID exists, do not allow confirmation" requirement.
// The client can only ever send orderId; paymentStatus/paidAt/adminId are
// never accepted from the client and are computed entirely server-side.

export type ConfirmEasypaisaPaymentResult = { error?: string };

export async function confirmEasypaisaPayment(orderId: string): Promise<ConfirmEasypaisaPaymentResult> {
  const session = await requireAdmin();

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentMethod: true, paymentStatus: true, transactionId: true },
  });
  if (!order) {
    return { error: "This order no longer exists." };
  }
  if (order.paymentMethod !== "EASYPAISA") {
    return { error: "This order does not use Easypaisa payment." };
  }
  if (!order.transactionId) {
    return { error: "This order has no transaction ID to verify yet." };
  }
  if (order.paymentStatus === "PAID") {
    return { error: "Payment has already been confirmed." };
  }

  try {
    // Race-safe, mirroring updatePaymentStatus above: the WHERE clause
    // re-checks method, transaction-ID presence, and paymentStatus !== PAID
    // at the moment of the write, not just at the read above.
    await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          paymentMethod: "EASYPAISA",
          paymentStatus: { not: "PAID" },
          transactionId: { not: null },
        },
        data: { paymentStatus: "PAID", paidAt: new Date() },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "ORDER",
        entityId: orderId,
        description: `Confirmed Easypaisa payment for order ${orderId}`,
        metadata: { field: "paymentStatus", from: order.paymentStatus, to: "PAID", transactionId: order.transactionId },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This order's payment status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  // Downstream of the committed, race-won transaction above.
  notifyPaymentConfirmation(orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}

// Phase 4.4.15 — the guided, reason-capturing path for recording a manual
// refund. Deliberately separate from updatePaymentStatus above (which
// stays fully untouched, still available for every other payment-status
// transition, including PAID -> REFUNDED without a captured reason if an
// admin uses it directly): this action layers the one extra requirement
// the generic control can't express — a required refund reason — on top
// of the exact same race-safe updateMany + logActivity pattern already
// proven by confirmEasypaisaPayment. Works for any payment method (COD,
// EASYPAISA, BANK_TRANSFER) since the business rule is paymentStatus ===
// PAID, not any particular method. Never touches OrderStatus. This is a
// full-refund record only — no refundAmount, no partial refunds, no
// return/RMA tracking (see the Phase 4.4.15 audit for why those are
// explicitly out of scope).

const refundReasonSchema = z
  .string()
  .trim()
  .min(3, "Refund reason must be at least 3 characters.")
  .max(500, "Refund reason is too long.");

export type RefundOrderResult = { error?: string };

export async function refundOrder(orderId: string, reason: string): Promise<RefundOrderResult> {
  const session = await requireAdmin();

  const parsedReason = refundReasonSchema.safeParse(reason);
  if (!parsedReason.success) {
    return { error: parsedReason.error.issues[0]?.message ?? "Please enter a valid refund reason." };
  }
  const refundReason = parsedReason.data;

  const order = await db.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } });
  if (!order) {
    return { error: "This order no longer exists." };
  }
  if (order.paymentStatus === "REFUNDED") {
    return { error: "Payment has already been refunded." };
  }
  if (order.paymentStatus !== "PAID") {
    return {
      error: `Only a PAID order can be refunded. This order's payment status is ${paymentStatusLabel[order.paymentStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring confirmEasypaisaPayment exactly: the WHERE
    // clause re-checks paymentStatus === PAID at the moment of the write,
    // not just at the read above, so a double-click or a concurrent admin
    // tab can never produce two refunds or overwrite a state this request
    // never actually saw.
    await db.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: { id: orderId, paymentStatus: "PAID" },
        data: { paymentStatus: "REFUNDED", refundReason, refundedAt: new Date() },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "ORDER",
        entityId: orderId,
        description: `Refunded payment for order ${orderId}`,
        metadata: { field: "paymentStatus", from: "PAID", to: "REFUNDED", reason: refundReason },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This order's payment status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  // Downstream of the committed, race-won transaction above.
  notifyRefund(orderId);

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return {};
}
