// Phase 4.4.22 — one builder function per business event. Each returns
// {subject, html, text} only — no recipient address here (that's the
// caller's job, resolved from the authoritative User/Order row, never
// from client input; see notify.ts). Every value rendered here is passed
// in by the caller from data already read from the database after a
// successful mutation — nothing here re-derives amounts or fabricates
// data (no tracking numbers, no invented reasons, no partial-refund
// amounts, since none of those fields exist in the schema).
import "server-only";
import { formatPrice } from "@/lib/utils";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import { orderStatusLabel } from "@/lib/order-status";
import { returnStatusLabel } from "@/lib/return-status";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { RESET_TOKEN_EXPIRY_MINUTES } from "@/lib/reset-token";
import {
  renderEmailHtml,
  renderEmailText,
  emailHeading,
  emailParagraph,
  emailLinkParagraph,
  emailDetailsTable,
  absoluteUrl,
  type EmailButton,
} from "./layout";

export type EmailContent = { subject: string; html: string; text: string };

/** Matches the `#XXXXXXXX` short-id convention already used throughout the admin/customer UI. */
export function shortId(id: string): string {
  return `#${id.slice(-8).toUpperCase()}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ---------------------------------------------------------------------
// 1. Welcome / account creation
// ---------------------------------------------------------------------
export function welcomeEmail(data: { name: string }): EmailContent {
  const button: EmailButton = { label: "Go to My Account", url: absoluteUrl("/account") };
  const paragraphs = [
    `Hi ${data.name}, welcome to i.Link Systems & Solutions! Your account has been created successfully.`,
    "You can now sign in any time to track orders, manage your addresses, and request returns.",
    "If you didn't create this account, please contact our support team right away.",
  ];
  return {
    subject: "Welcome to i.Link Systems & Solutions",
    html: renderEmailHtml({
      preheader: "Your i.Link account is ready.",
      bodyHtml: [emailHeading("Welcome!"), ...paragraphs.map(emailParagraph)].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Welcome!", paragraphs, button }),
  };
}

// ---------------------------------------------------------------------
// 2. Order confirmation
// ---------------------------------------------------------------------
export type OrderConfirmationData = {
  orderId: string;
  customerName: string;
  createdAt: Date;
  items: { name: string; quantity: number; lineTotal: number }[];
  subtotal: number;
  discountCode: string | null;
  discountAmount: number | null;
  shippingAmount: number | null;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingLabel: string | null;
  shippingLines: string | null;
};

export function orderConfirmationEmail(data: OrderConfirmationData): EmailContent {
  const orderNo = shortId(data.orderId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };

  const itemLines = data.items.map((i) => `${i.quantity} × ${i.name} — ${formatPrice(i.lineTotal)}`);

  const details: { label: string; value: string }[] = [
    { label: "Order", value: orderNo },
    { label: "Date", value: formatDate(data.createdAt) },
    { label: "Subtotal", value: formatPrice(data.subtotal) },
  ];
  if (data.discountAmount != null && data.discountCode) {
    details.push({ label: `Discount (${data.discountCode})`, value: `-${formatPrice(data.discountAmount)}` });
  }
  details.push({ label: "Shipping", value: data.shippingAmount ? formatPrice(data.shippingAmount) : "Free" });
  details.push({ label: "Total", value: formatPrice(data.total) });
  details.push({ label: "Payment Method", value: paymentMethodLabel[data.paymentMethod] });
  details.push({ label: "Payment Status", value: paymentStatusLabel[data.paymentStatus] });
  if (data.shippingLabel) {
    details.push({ label: "Shipping Address", value: `${data.shippingLabel} — ${data.shippingLines ?? ""}` });
  }

  const paragraphs = [
    `Hi ${data.customerName}, thanks for your order! We've received it and will begin processing it shortly.`,
    `Items: ${itemLines.join("; ")}.`,
  ];

  return {
    subject: `Order Confirmed — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `Your order ${orderNo} has been received.`,
      bodyHtml: [
        emailHeading("Order Confirmed"),
        ...paragraphs.map(emailParagraph),
        emailDetailsTable(details),
      ].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Order Confirmed", paragraphs, details, button }),
  };
}

// ---------------------------------------------------------------------
// 3. Order status change (CONFIRMED / SHIPPED / DELIVERED / CANCELLED)
// ---------------------------------------------------------------------
const STATUS_COPY: Partial<Record<OrderStatus, { subject: string; heading: string; body: string }>> = {
  CONFIRMED: {
    subject: "Order Confirmed",
    heading: "Your Order Has Been Confirmed",
    body: "We've confirmed your order and it's now being prepared.",
  },
  SHIPPED: {
    subject: "Order Shipped",
    heading: "Your Order Is On Its Way",
    body: "Your order has been shipped and is on its way to you.",
  },
  DELIVERED: {
    subject: "Order Delivered",
    heading: "Your Order Has Been Delivered",
    body: "Your order has been marked as delivered. If you need to request a return, you have 7 days from today.",
  },
  CANCELLED: {
    subject: "Order Cancelled",
    heading: "Your Order Has Been Cancelled",
    body: "Your order has been cancelled. If you have any questions, please contact our support team.",
  },
};

export function orderStatusChangeEmail(data: {
  orderId: string;
  customerName: string;
  status: OrderStatus;
}): EmailContent | null {
  const copy = STATUS_COPY[data.status];
  if (!copy) return null; // PENDING has no customer-facing notification of its own.

  const orderNo = shortId(data.orderId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };
  const paragraphs = [`Hi ${data.customerName}, ${copy.body}`];
  const details = [
    { label: "Order", value: orderNo },
    { label: "Status", value: orderStatusLabel[data.status] },
  ];

  return {
    subject: `${copy.subject} — ${orderNo}`,
    html: renderEmailHtml({
      preheader: copy.body,
      bodyHtml: [emailHeading(copy.heading), ...paragraphs.map(emailParagraph), emailDetailsTable(details)].join(""),
      button,
    }),
    text: renderEmailText({ heading: copy.heading, paragraphs, details, button }),
  };
}

// ---------------------------------------------------------------------
// 4. Payment confirmation (Easypaisa)
// ---------------------------------------------------------------------
export function paymentConfirmationEmail(data: {
  orderId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  paidAt: Date;
}): EmailContent {
  const orderNo = shortId(data.orderId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };
  const paragraphs = [`Hi ${data.customerName}, we've confirmed your payment for order ${orderNo}.`];
  const details: { label: string; value: string }[] = [
    { label: "Order", value: orderNo },
    { label: "Amount", value: formatPrice(data.amount) },
    { label: "Payment Method", value: paymentMethodLabel[data.paymentMethod] },
  ];
  if (data.transactionId) {
    details.push({ label: "Transaction ID", value: data.transactionId });
  }
  details.push({ label: "Status", value: "Paid" }, { label: "Date", value: formatDate(data.paidAt) });

  return {
    subject: `Payment Confirmed — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `Payment confirmed for order ${orderNo}.`,
      bodyHtml: [
        emailHeading("Payment Confirmed"),
        ...paragraphs.map(emailParagraph),
        emailDetailsTable(details),
      ].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Payment Confirmed", paragraphs, details, button }),
  };
}

// ---------------------------------------------------------------------
// 5. Refund confirmation
// ---------------------------------------------------------------------
export function refundEmail(data: {
  orderId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  refundedAt: Date;
}): EmailContent {
  const orderNo = shortId(data.orderId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };
  const paragraphs = [`Hi ${data.customerName}, your payment for order ${orderNo} has been refunded.`];
  const details = [
    { label: "Order", value: orderNo },
    { label: "Refund Amount", value: formatPrice(data.amount) },
    { label: "Payment Method", value: paymentMethodLabel[data.paymentMethod] },
    { label: "Payment Status", value: "Refunded" },
    { label: "Date", value: formatDate(data.refundedAt) },
  ];

  return {
    subject: `Refund Processed — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `Your refund for order ${orderNo} has been processed.`,
      bodyHtml: [emailHeading("Refund Processed"), ...paragraphs.map(emailParagraph), emailDetailsTable(details)].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Refund Processed", paragraphs, details, button }),
  };
}

// ---------------------------------------------------------------------
// 6/7/8. Return request submitted / approved / rejected
// ---------------------------------------------------------------------
export function returnSubmittedEmail(data: {
  orderId: string;
  returnRequestId: string;
  customerName: string;
  reason: string;
  submittedAt: Date;
}): EmailContent {
  const orderNo = shortId(data.orderId);
  const returnNo = shortId(data.returnRequestId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };
  const paragraphs = [
    `Hi ${data.customerName}, we've received your return request for order ${orderNo}. Our team will review it and let you know the outcome.`,
  ];
  const details = [
    { label: "Order", value: orderNo },
    { label: "Return Request", value: returnNo },
    { label: "Reason", value: data.reason },
    { label: "Status", value: returnStatusLabel.PENDING },
    { label: "Submitted", value: formatDate(data.submittedAt) },
  ];

  return {
    subject: `Return Request Received — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `We've received your return request for order ${orderNo}.`,
      bodyHtml: [
        emailHeading("Return Request Received"),
        ...paragraphs.map(emailParagraph),
        emailDetailsTable(details),
        emailLinkParagraph("See our ", absoluteUrl("/returns"), "Returns page", " for how this process works."),
      ].join(""),
      button,
    }),
    text: renderEmailText({
      heading: "Return Request Received",
      paragraphs: [...paragraphs, `Returns policy: ${absoluteUrl("/returns")}`],
      details,
      button,
    }),
  };
}

export function returnApprovedEmail(data: {
  orderId: string;
  returnRequestId: string;
  customerName: string;
}): EmailContent {
  const orderNo = shortId(data.orderId);
  const returnNo = shortId(data.returnRequestId);
  const button: EmailButton = { label: "View Order", url: absoluteUrl(`/account/orders/${data.orderId}`) };
  const paragraphs = [
    `Hi ${data.customerName}, your return request for order ${orderNo} has been approved.`,
    // Explicit, deliberate wording — approval is not a refund. Matches the
    // exact framing already used in ReturnRequestSection and the Refund
    // Policy page: never claim the customer has already been refunded.
    "This means your request has been accepted for processing. Any applicable refund is handled as a separate step — see our Refund Policy for how that works.",
  ];
  const details = [
    { label: "Order", value: orderNo },
    { label: "Return Request", value: returnNo },
    { label: "Status", value: returnStatusLabel.APPROVED },
  ];

  return {
    subject: `Return Request Approved — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `Your return request for order ${orderNo} has been approved.`,
      bodyHtml: [
        emailHeading("Return Request Approved"),
        ...paragraphs.map(emailParagraph),
        emailDetailsTable(details),
        emailLinkParagraph("", absoluteUrl("/policies/refunds"), "Refund Policy"),
      ].join(""),
      button,
    }),
    text: renderEmailText({
      heading: "Return Request Approved",
      paragraphs: [...paragraphs, `Refund Policy: ${absoluteUrl("/policies/refunds")}`],
      details,
      button,
    }),
  };
}

export function returnRejectedEmail(data: {
  orderId: string;
  returnRequestId: string;
  customerName: string;
  rejectionReason: string | null;
}): EmailContent {
  const orderNo = shortId(data.orderId);
  const returnNo = shortId(data.returnRequestId);
  const button: EmailButton = { label: "Contact Support", url: absoluteUrl("/support") };
  const paragraphs = [`Hi ${data.customerName}, your return request for order ${orderNo} was not approved.`];
  const details: { label: string; value: string }[] = [
    { label: "Order", value: orderNo },
    { label: "Return Request", value: returnNo },
    { label: "Status", value: returnStatusLabel.REJECTED },
  ];
  // Only ever included if the admin actually recorded one — never invented.
  if (data.rejectionReason) {
    details.push({ label: "Reason", value: data.rejectionReason });
  }
  paragraphs.push("If you have questions about this decision, our support team is happy to help.");

  return {
    subject: `Return Request Update — ${orderNo}`,
    html: renderEmailHtml({
      preheader: `An update on your return request for order ${orderNo}.`,
      bodyHtml: [
        emailHeading("Return Request Update"),
        ...paragraphs.map(emailParagraph),
        emailDetailsTable(details),
      ].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Return Request Update", paragraphs, details, button }),
  };
}

// ---------------------------------------------------------------------
// 9. Password reset (Phase 4.4.29)
// ---------------------------------------------------------------------
export function passwordResetEmail(data: { name: string | null; token: string }): EmailContent {
  // The raw token only ever appears here, inside a single query-param URL
  // built server-side — never logged, never rendered anywhere else in
  // the email body.
  const resetUrl = absoluteUrl(`/reset-password?token=${encodeURIComponent(data.token)}`);
  const button: EmailButton = { label: "Reset Password", url: resetUrl };
  const greetingName = data.name && data.name.trim().length > 0 ? data.name : "there";
  const paragraphs = [
    `Hi ${greetingName}, we received a request to reset the password for your i.Link account.`,
    `Click the button below to choose a new password. This link will expire in ${RESET_TOKEN_EXPIRY_MINUTES} minutes and can only be used once.`,
    "If you did not request this, you can safely ignore this email — your password will not be changed.",
  ];

  return {
    subject: "Reset Your i.Link Password",
    html: renderEmailHtml({
      preheader: "Reset your i.Link account password.",
      bodyHtml: [emailHeading("Reset Your Password"), ...paragraphs.map(emailParagraph)].join(""),
      button,
    }),
    text: renderEmailText({ heading: "Reset Your Password", paragraphs, button }),
  };
}
