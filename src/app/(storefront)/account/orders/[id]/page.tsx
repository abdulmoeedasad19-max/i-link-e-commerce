import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Badge from "@/components/ui/badge";
import Card from "@/components/ui/card";
import CancelOrderButton from "@/components/sections/cancel-order-button";
import EasypaisaPaymentCard from "@/components/sections/easypaisa-payment-card";
import ReturnRequestSection from "@/components/sections/return-request-section";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import { getStoreSettings } from "@/lib/admin/store-settings";

const RETURN_WINDOW_DAYS = 7;

export const metadata: Metadata = {
  title: "Order Details",
  robots: { index: false, follow: true },
};

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Layer 2 of route protection — independent of proxy.ts (Layer 1). Never
  // rely on the proxy alone.
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/account/orders/${id}`);
  }

  // Ownership is baked directly into the query — never findUnique-then-
  // trust. A forged or foreign order id simply matches nothing here, and a
  // customer can never view another customer's order by editing the URL.
  // A nonexistent id and another user's id are handled identically below.
  const order = await db.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, shippingAddress: true },
  });

  if (!order) {
    notFound();
  }

  const settings = order.paymentMethod === "EASYPAISA" ? await getStoreSettings() : null;

  // Phase 4.4.18 — Returns/RMA eligibility, computed entirely server-side
  // from Order.deliveredAt (never trusted from the client). Only the most
  // recent request matters for display/gating; historical requests (e.g.
  // an old REJECTED one) remain in the database but aren't separately
  // listed here — this is an order-detail summary, not a return history
  // page.
  const now = new Date();
  const isReturnEligible = Boolean(
    order.status === "DELIVERED" &&
      order.deliveredAt &&
      now.getTime() - order.deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const latestReturnRequestRow = await db.returnRequest.findFirst({
    where: { orderId: order.id },
    orderBy: { createdAt: "desc" },
    select: { status: true, reason: true, rejectionReason: true, createdAt: true },
  });
  const hasActiveReturnRequest =
    latestReturnRequestRow?.status === "PENDING" || latestReturnRequestRow?.status === "APPROVED";
  const canSubmitReturnRequest = isReturnEligible && !hasActiveReturnRequest;
  const showReturnSection = isReturnEligible || Boolean(latestReturnRequestRow);

  // Prefer the order's own historical snapshot — it reflects exactly what
  // was on file at checkout, immune to later edits or deletion of the
  // Address it was copied from. `shippingLabel` is the presence check
  // since all snapshot fields (other than the inherently optional line2)
  // are always written together at order creation; a null here means this
  // order predates the snapshot migration, so fall back to the live
  // relation for backward compatibility only.
  const shipping = order.shippingLabel
    ? {
        label: order.shippingLabel,
        line1: order.shippingLine1,
        line2: order.shippingLine2,
        city: order.shippingCity,
        province: order.shippingProvince,
        postalCode: order.shippingPostalCode,
        phone: order.shippingPhone,
      }
    : order.shippingAddress
      ? {
          label: order.shippingAddress.label,
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          postalCode: order.shippingAddress.postalCode,
          phone: order.shippingAddress.phone,
        }
      : null;

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate transition-colors hover:text-royal"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Back to My Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <SectionHeading
            eyebrow="My Account"
            title={`Order #${order.id.slice(-8).toUpperCase()}`}
            align="left"
            className="mx-0 text-left"
          />
          <p className="mt-2 text-sm text-slate">
            {order.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <Card hover={false} className="p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-navy">Items</h2>
          <div className="mt-4 divide-y divide-light-gray">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-semibold text-navy">{item.nameSnapshot}</p>
                  <p className="text-xs text-slate">
                    Qty {item.quantity} &times; {formatPrice(item.priceSnapshot.toNumber())}
                  </p>
                </div>
                <p className="font-semibold text-navy">
                  {formatPrice(item.priceSnapshot.toNumber() * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-navy">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Subtotal</dt>
                <dd className="font-semibold text-navy">{formatPrice(order.subtotal.toNumber())}</dd>
              </div>
              {order.discountAmount != null && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate">
                    Discount <span className="font-mono">({order.discountCode})</span>
                  </dt>
                  <dd className="font-semibold text-success">-{formatPrice(order.discountAmount.toNumber())}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-slate">Shipping</dt>
                {/* Historical snapshot (Phase 4.4.8) — order.shippingAmount
                    is null for every order placed before this phase, which
                    correctly always means "Rs. 0 / Free" since shipping was
                    unconditionally free at that time. A later StoreSettings
                    change must never reinterpret what this order actually
                    charged. */}
                {order.shippingAmount != null && order.shippingAmount.toNumber() > 0 ? (
                  <dd className="font-semibold text-navy">{formatPrice(order.shippingAmount.toNumber())}</dd>
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
              <div className="mt-3 rounded-xl bg-soft-gray px-4 py-3 text-sm">
                <p className="font-semibold text-navy">Payment Refunded</p>
                {order.refundReason && (
                  <p className="mt-1 text-xs text-slate">
                    Reason: <span className="text-dark-slate">{order.refundReason}</span>
                  </p>
                )}
                {order.refundedAt && (
                  <p className="mt-1 text-xs text-slate">
                    Refunded:{" "}
                    {order.refundedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-light-gray pt-4">
              <span className="text-base font-bold text-navy">Total</span>
              <span className="text-xl font-bold text-navy">{formatPrice(order.total.toNumber())}</span>
            </div>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-lg font-bold text-navy">Shipping Address</h2>
            {shipping ? (
              <div className="mt-3 text-sm">
                <p className="font-semibold text-navy">{shipping.label}</p>
                <p className="mt-1 text-slate">
                  {shipping.line1}
                  {shipping.line2 ? `, ${shipping.line2}` : ""}
                </p>
                <p className="text-slate">
                  {shipping.city}, {shipping.province} {shipping.postalCode}
                </p>
                <p className="text-slate">{shipping.phone}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate">Shipping address unavailable</p>
            )}
          </Card>

          {order.paymentMethod === "EASYPAISA" && settings && (
            <EasypaisaPaymentCard
              orderId={order.id}
              total={order.total.toNumber()}
              paymentStatus={order.paymentStatus}
              transactionId={order.transactionId}
              settings={{
                accountName: settings.easypaisaAccountName,
                number: settings.easypaisaNumber,
                qrCode: settings.easypaisaQrCode,
                instructions: settings.easypaisaInstructions,
              }}
            />
          )}

          {showReturnSection && (
            <ReturnRequestSection
              orderId={order.id}
              canSubmit={canSubmitReturnRequest}
              latestRequest={
                latestReturnRequestRow
                  ? {
                      status: latestReturnRequestRow.status,
                      reason: latestReturnRequestRow.reason,
                      rejectionReason: latestReturnRequestRow.rejectionReason,
                      createdAt: latestReturnRequestRow.createdAt.toISOString(),
                    }
                  : null
              }
            />
          )}

          {order.status === "PENDING" && <CancelOrderButton orderId={order.id} />}
        </div>
      </div>
    </div>
  );
}
