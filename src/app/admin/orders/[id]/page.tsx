import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminOrderById } from "@/lib/admin/orders";
import { db } from "@/lib/db";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import OrderStatusControl from "@/components/admin/orders/order-status-control";
import PaymentStatusControl from "@/components/admin/orders/payment-status-control";
import ConfirmEasypaisaPayment from "@/components/admin/orders/confirm-easypaisa-payment";
import RefundOrder from "@/components/admin/orders/refund-order";

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  // Phase 4.4.8 — getAdminOrderById() (src/lib/admin/orders.ts) is
  // out-of-scope to modify for this phase, and its AdminOrderDetail type
  // predates the shippingAmount column, so it's read here via one small,
  // additional, direct query instead — never a second/competing "shipping
  // calculation," just this one extra scalar field off the same order row.
  const shippingSnapshot = await db.order.findUnique({
    where: { id: order.id },
    select: { shippingAmount: true },
  });
  const shippingAmount = shippingSnapshot?.shippingAmount?.toNumber() ?? null;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy" title={order.id}>
            Order #{order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-slate">
            Placed{" "}
            {order.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Items</h2>
            <div className="mt-4 divide-y divide-light-gray">
              {order.items.length === 0 ? (
                <p className="py-3 text-sm text-slate">This order has no items.</p>
              ) : (
                order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy">{item.nameSnapshot}</p>
                      <p className="text-xs text-slate">
                        Qty {item.quantity} &times; {formatPrice(item.priceSnapshot)}
                      </p>
                      {/* productSlug is historical only — the current product
                          may have been edited, archived, or deleted since
                          this order was placed, so this deliberately doesn't
                          verify or link to a live product record. */}
                      <p className="mt-0.5 text-xs text-slate/70">Slug: {item.productSlug}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-navy">{formatPrice(item.lineTotal)}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Customer</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{order.customer.name || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{order.customer.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold text-navy">{order.customer.phone || "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Shipping Address</h2>
            {order.shipping ? (
              <div className="mt-3 text-sm">
                <p className="font-semibold text-navy">{order.shipping.label}</p>
                <p className="mt-1 text-slate">
                  {order.shipping.line1}
                  {order.shipping.line2 ? `, ${order.shipping.line2}` : ""}
                </p>
                <p className="text-slate">
                  {order.shipping.city}, {order.shipping.province} {order.shipping.postalCode}
                </p>
                <p className="text-slate">{order.shipping.phone}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate">Shipping address unavailable.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Subtotal</dt>
                <dd className="font-semibold text-navy">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discountAmount != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate">
                    Discount <span className="font-mono">({order.discountCode})</span>
                  </dt>
                  <dd className="font-semibold text-success">-{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-slate">Shipping</dt>
                {/* Historical snapshot (Phase 4.4.8) — order.shippingAmount
                    is null for every order placed before this phase (when
                    shipping was unconditionally free), which correctly
                    always displays as "Free" below. A later edit to
                    StoreSettings.shippingCost must never reinterpret what
                    this specific order actually charged. */}
                {shippingAmount != null && shippingAmount > 0 ? (
                  <dd className="font-semibold text-navy">{formatPrice(shippingAmount)}</dd>
                ) : (
                  <dd className="font-semibold text-success">Free</dd>
                )}
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Payment Method</dt>
                <dd className="font-semibold text-navy">{paymentMethodLabel[order.paymentMethod]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Payment Status</dt>
                <dd className="font-semibold text-navy">{paymentStatusLabel[order.paymentStatus]}</dd>
              </div>
            </dl>
            {order.paymentStatus === "REFUNDED" && (
              <dl className="mt-3 space-y-2 border-t border-light-gray pt-3 text-sm">
                {order.refundedAt && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate">Refunded At</dt>
                    <dd className="font-semibold text-navy">
                      {order.refundedAt.toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                )}
                {order.refundReason && (
                  <div>
                    <dt className="text-slate">Refund Reason</dt>
                    <dd className="mt-1 font-semibold text-navy">{order.refundReason}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-light-gray pt-4">
              <span className="text-base font-bold text-navy">Total</span>
              <span className="text-xl font-bold text-navy">{formatPrice(order.total)}</span>
            </div>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Order Status</h2>
            <div className="mt-4">
              <OrderStatusControl orderId={order.id} status={order.status} />
            </div>
          </Card>

          {/* Deliberately its own card, separate from Order Status above —
              payment reconciliation and fulfillment tracking are
              independent state machines in this schema (see
              src/lib/admin/payment-transitions.ts) and must never be
              presented as though they're the same status. */}
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Payment Status</h2>
            <p className="mt-1 text-xs text-slate">{paymentMethodLabel[order.paymentMethod]}</p>
            <div className="mt-4">
              <PaymentStatusControl orderId={order.id} paymentStatus={order.paymentStatus} />
            </div>
            {order.paymentMethod === "EASYPAISA" && (
              <ConfirmEasypaisaPayment
                orderId={order.id}
                transactionId={order.transactionId}
                isPaid={order.paymentStatus === "PAID"}
              />
            )}
            {order.paymentStatus === "PAID" && <RefundOrder orderId={order.id} />}
          </Card>
        </div>
      </div>
    </div>
  );
}
