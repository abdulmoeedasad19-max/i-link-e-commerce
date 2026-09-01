"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifyOrderStatusChange, notifyReturnSubmitted } from "@/lib/email/notify";

const cancelOrderSchema = z.object({
  orderId: z.string().min(1),
});

export type CancelOrderState = {
  error?: string;
  success?: boolean;
};

export async function cancelOrder(
  _prevState: CancelOrderState,
  formData: FormData,
): Promise<CancelOrderState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to cancel an order." };
  }
  const userId = session.user.id;

  const parsed = cancelOrderSchema.safeParse({ orderId: formData.get("orderId") });
  if (!parsed.success) {
    return { error: "Unable to cancel this order. Please try again." };
  }
  const { orderId } = parsed.data;

  // Ownership + current-status check, scoped exclusively to the
  // authenticated session's own id — never a client-supplied id or status.
  const existing = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { status: true },
  });
  if (!existing) {
    return { error: "This order could not be found." };
  }
  if (existing.status !== "PENDING") {
    return { error: "This order can no longer be cancelled." };
  }

  // The atomic, race-safe step: the WHERE clause re-checks ownership AND
  // status === PENDING at the moment of the update, not just at the
  // earlier read above. If a concurrent request already changed the
  // status in between, this matches zero rows instead of overwriting it —
  // exactly one of two concurrent cancellations can ever succeed.
  const result = await db.order.updateMany({
    where: { id: orderId, userId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  if (result.count === 0) {
    return { error: "This order can no longer be cancelled." };
  }

  // Downstream of the race-won update above.
  notifyOrderStatusChange(orderId, "CANCELLED");

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { success: true };
}

// Phase 4.4.14 — manual Easypaisa transaction-ID submission. Mirrors
// cancelOrder above exactly: session-derived ownership (never a
// client-supplied userId), a single race-safe conditional updateMany, no
// $transaction (one operation, nothing else to keep atomic with it), and
// no ActivityLog entry — ordinary customer actions aren't logged in this
// project (see cancelOrder, applyCoupon, etc.). The client can only ever
// send orderId and transactionId; paymentStatus/paidAt/paymentMethod are
// never accepted from the form and are never touched by this action.
const submitTransactionIdSchema = z.object({
  orderId: z.string().min(1),
  transactionId: z
    .string()
    .trim()
    .min(3, "Transaction ID must be at least 3 characters.")
    .max(100, "Transaction ID is too long."),
});

export type SubmitPaymentTransactionIdState = {
  error?: string;
  success?: boolean;
};

export async function submitPaymentTransactionId(
  _prevState: SubmitPaymentTransactionIdState,
  formData: FormData,
): Promise<SubmitPaymentTransactionIdState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to submit a transaction ID." };
  }
  const userId = session.user.id;

  const parsed = submitTransactionIdSchema.safeParse({
    orderId: formData.get("orderId"),
    transactionId: formData.get("transactionId"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please enter a valid transaction ID.";
    return { error: message };
  }
  const { orderId, transactionId } = parsed.data;

  // Ownership + method + current-payment-status check, scoped exclusively
  // to the authenticated session's own id — never a client-supplied id,
  // method, or status.
  const existing = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { paymentMethod: true, paymentStatus: true },
  });
  if (!existing) {
    return { error: "Order not found." };
  }
  if (existing.paymentMethod !== "EASYPAISA") {
    return { error: "This order does not use Easypaisa payment." };
  }
  if (existing.paymentStatus === "PAID") {
    return { error: "Payment has already been confirmed." };
  }

  // The atomic, race-safe step: the WHERE clause re-checks ownership,
  // method, and paymentStatus !== PAID at the moment of the write, not
  // just at the read above. If an admin confirms payment in between, this
  // matches zero rows instead of silently overwriting a transaction ID
  // that no longer needs to be submitted/replaced.
  const result = await db.order.updateMany({
    where: { id: orderId, userId, paymentMethod: "EASYPAISA", paymentStatus: { not: "PAID" } },
    data: { transactionId },
  });

  if (result.count === 0) {
    return { error: "Payment has already been confirmed." };
  }

  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath(`/checkout/success/${orderId}`);
  return { success: true };
}

// Phase 4.4.18 — customer return requests. Gives the storefront's public
// 7-day return policy (src/app/(storefront)/returns/page.tsx) actual
// system backing. Mirrors cancelOrder/submitPaymentTransactionId
// above exactly: session-derived ownership, no ActivityLog entry (ordinary
// customer action). This creates a REQUEST only — it never touches
// OrderStatus, PaymentStatus, Order.total, or Order.items, and never
// triggers refundOrder; a refund remains a fully separate, manually
// invoked admin decision. Eligibility is computed entirely server-side
// from Order.deliveredAt (Phase 4.4.18), never trusted from the client.
const RETURN_WINDOW_DAYS = 7;

const submitReturnRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(3, "Please describe your reason for the return.")
    .max(1000, "Reason is too long."),
});

export type SubmitReturnRequestState = {
  error?: string;
  success?: boolean;
};

// Thrown only to abort the transaction when another active request for
// this order is found — caught locally and mapped to a friendly message,
// mirroring the established local-sentinel-error convention (see
// RaceLostError in src/app/admin/orders/actions.ts).
class DuplicateReturnRequestError extends Error {}

export async function submitReturnRequest(
  _prevState: SubmitReturnRequestState,
  formData: FormData,
): Promise<SubmitReturnRequestState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to request a return." };
  }
  const userId = session.user.id;

  const parsed = submitReturnRequestSchema.safeParse({
    orderId: formData.get("orderId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please enter a valid reason.";
    return { error: message };
  }
  const { orderId, reason } = parsed.data;

  // Ownership + eligibility, scoped exclusively to the authenticated
  // session's own id — never a client-supplied id, order status, or
  // delivery date. Only a DELIVERED order with a recorded deliveredAt
  // timestamp within the last 7 days is eligible.
  const order = await db.order.findFirst({
    where: { id: orderId, userId },
    select: { status: true, deliveredAt: true },
  });
  if (!order) {
    return { error: "Order not found." };
  }
  if (order.status !== "DELIVERED" || !order.deliveredAt) {
    return { error: "This order is not eligible for a return." };
  }
  const windowEnd = new Date(order.deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (new Date() > windowEnd) {
    return { error: "This order is no longer eligible for a return — the 7-day window has passed." };
  }

  let returnRequestId: string;
  try {
    // Best-effort duplicate protection: re-checked here, immediately
    // before the write, inside the same transaction as the create. Not a
    // hard database constraint — Prisma's schema DSL has no partial
    // unique index support for "unique while PENDING/APPROVED," and
    // adding one via hand-edited migration SQL would create permanent,
    // undocumented drift between schema.prisma and the database for every
    // future `prisma migrate dev` diff. Acceptable for this low-stakes
    // case (a data-quality nuisance from a double-click, not a
    // financial/security exploit) — the customer-facing submit button is
    // also disabled while the request is pending, covering the
    // overwhelmingly common case.
    returnRequestId = await db.$transaction(async (tx) => {
      const activeExisting = await tx.returnRequest.findFirst({
        where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
        select: { id: true },
      });
      if (activeExisting) {
        throw new DuplicateReturnRequestError();
      }
      const created = await tx.returnRequest.create({ data: { orderId, userId, reason }, select: { id: true } });
      return created.id;
    });
  } catch (err) {
    if (err instanceof DuplicateReturnRequestError) {
      return { error: "You already have an active return request for this order." };
    }
    return { error: "Unable to submit your request. Please try again." };
  }

  // Downstream of the committed transaction above.
  notifyReturnSubmitted(returnRequestId);

  revalidatePath(`/account/orders/${orderId}`);
  return { success: true };
}
