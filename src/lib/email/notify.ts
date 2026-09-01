// Phase 4.4.22 — the only module business Server Actions import from
// src/lib/email/. Each function here takes just an id (or, for the
// welcome email, the exact values already written to the User row a
// moment earlier), re-reads the authoritative row fresh from the
// database, and only then builds + sends the email. The recipient
// address is never taken from client input or from a caller-supplied
// value — always the database's own User.email for the order/return's
// actual owner. Every function is safe to call with `void` from a
// Server Action: it never throws, so a database hiccup or a missing
// provider can never fail the business mutation that already succeeded.
//
// Per the phase's transaction rule, every call site invokes these AFTER
// its own db.$transaction has already committed — never from inside one.
import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "./send";
import {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusChangeEmail,
  paymentConfirmationEmail,
  refundEmail,
  returnSubmittedEmail,
  returnApprovedEmail,
  returnRejectedEmail,
  passwordResetEmail,
} from "./templates";
import type { OrderStatus } from "@/generated/prisma/enums";

function customerDisplayName(name: string | null, email: string): string {
  return name && name.trim().length > 0 ? name : email;
}

async function safeSend(build: () => Promise<void>, context: string): Promise<void> {
  try {
    await build();
  } catch (err) {
    // A failure resolving/building the email (e.g. a transient DB read
    // error) must never surface to the caller — the underlying business
    // mutation already succeeded and must not be affected by this.
    console.error(`[email] notify.${context} failed:`, err instanceof Error ? err.message : err);
  }
}

export function notifyWelcome(data: { email: string; name: string }): void {
  void safeSend(async () => {
    const content = welcomeEmail({ name: data.name });
    await sendEmail({ to: data.email, ...content });
  }, "notifyWelcome");
}

// Phase 4.4.29 — the raw reset token is only ever known in-memory by the
// caller (forgot-password/actions.ts), right after it's generated and
// hashed for storage — there is nothing to re-read from the database, so
// this mirrors notifyWelcome's direct-values shape above, not the
// re-read-by-id shape every other notify* function below uses.
export function notifyPasswordReset(data: { email: string; name: string | null; token: string }): void {
  void safeSend(async () => {
    const content = passwordResetEmail({ name: data.name, token: data.token });
    await sendEmail({ to: data.email, ...content });
  }, "notifyPasswordReset");
}

export function notifyOrderConfirmation(orderId: string): void {
  void safeSend(async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true, email: true } } },
    });
    if (!order) return;

    const content = orderConfirmationEmail({
      orderId: order.id,
      customerName: customerDisplayName(order.user.name, order.user.email),
      createdAt: order.createdAt,
      items: order.items.map((i) => ({
        name: i.nameSnapshot,
        quantity: i.quantity,
        lineTotal: i.priceSnapshot.toNumber() * i.quantity,
      })),
      subtotal: order.subtotal.toNumber(),
      discountCode: order.discountCode,
      discountAmount: order.discountAmount?.toNumber() ?? null,
      shippingAmount: order.shippingAmount?.toNumber() ?? null,
      total: order.total.toNumber(),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      shippingLabel: order.shippingLabel,
      shippingLines: order.shippingLabel
        ? [order.shippingLine1, order.shippingLine2, order.shippingCity, order.shippingProvince]
            .filter(Boolean)
            .join(", ")
        : null,
    });
    await sendEmail({ to: order.user.email, ...content });
  }, "notifyOrderConfirmation");
}

export function notifyOrderStatusChange(orderId: string, status: OrderStatus): void {
  void safeSend(async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, user: { select: { name: true, email: true } } },
    });
    if (!order) return;

    const content = orderStatusChangeEmail({
      orderId: order.id,
      customerName: customerDisplayName(order.user.name, order.user.email),
      status,
    });
    if (!content) return; // No customer-facing copy for this status (e.g. PENDING).
    await sendEmail({ to: order.user.email, ...content });
  }, "notifyOrderStatusChange");
}

export function notifyPaymentConfirmation(orderId: string): void {
  void safeSend(async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        total: true,
        paymentMethod: true,
        transactionId: true,
        paidAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order || !order.paidAt) return;

    const content = paymentConfirmationEmail({
      orderId: order.id,
      customerName: customerDisplayName(order.user.name, order.user.email),
      amount: order.total.toNumber(),
      paymentMethod: order.paymentMethod,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
    });
    await sendEmail({ to: order.user.email, ...content });
  }, "notifyPaymentConfirmation");
}

export function notifyRefund(orderId: string): void {
  void safeSend(async () => {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        total: true,
        paymentMethod: true,
        refundedAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!order || !order.refundedAt) return;

    const content = refundEmail({
      orderId: order.id,
      customerName: customerDisplayName(order.user.name, order.user.email),
      amount: order.total.toNumber(),
      paymentMethod: order.paymentMethod,
      refundedAt: order.refundedAt,
    });
    await sendEmail({ to: order.user.email, ...content });
  }, "notifyRefund");
}

export function notifyReturnSubmitted(returnRequestId: string): void {
  void safeSend(async () => {
    const returnRequest = await db.returnRequest.findUnique({
      where: { id: returnRequestId },
      select: {
        id: true,
        orderId: true,
        reason: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!returnRequest) return;

    const content = returnSubmittedEmail({
      orderId: returnRequest.orderId,
      returnRequestId: returnRequest.id,
      customerName: customerDisplayName(returnRequest.user.name, returnRequest.user.email),
      reason: returnRequest.reason,
      submittedAt: returnRequest.createdAt,
    });
    await sendEmail({ to: returnRequest.user.email, ...content });
  }, "notifyReturnSubmitted");
}

export function notifyReturnApproved(returnRequestId: string): void {
  void safeSend(async () => {
    const returnRequest = await db.returnRequest.findUnique({
      where: { id: returnRequestId },
      select: { id: true, orderId: true, user: { select: { name: true, email: true } } },
    });
    if (!returnRequest) return;

    const content = returnApprovedEmail({
      orderId: returnRequest.orderId,
      returnRequestId: returnRequest.id,
      customerName: customerDisplayName(returnRequest.user.name, returnRequest.user.email),
    });
    await sendEmail({ to: returnRequest.user.email, ...content });
  }, "notifyReturnApproved");
}

export function notifyReturnRejected(returnRequestId: string): void {
  void safeSend(async () => {
    const returnRequest = await db.returnRequest.findUnique({
      where: { id: returnRequestId },
      select: {
        id: true,
        orderId: true,
        rejectionReason: true,
        user: { select: { name: true, email: true } },
      },
    });
    if (!returnRequest) return;

    const content = returnRejectedEmail({
      orderId: returnRequest.orderId,
      returnRequestId: returnRequest.id,
      customerName: customerDisplayName(returnRequest.user.name, returnRequest.user.email),
      rejectionReason: returnRequest.rejectionReason,
    });
    await sendEmail({ to: returnRequest.user.email, ...content });
  }, "notifyReturnRejected");
}
