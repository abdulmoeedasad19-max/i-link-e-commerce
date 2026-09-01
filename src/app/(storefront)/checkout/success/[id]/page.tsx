import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/container";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import { getStoreSettings } from "@/lib/admin/store-settings";
import EasypaisaPaymentCard from "@/components/sections/easypaisa-payment-card";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: true },
};

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/orders");
  }

  const { id } = await params;

  // Ownership is baked directly into the query — never findUnique-then-
  // trust. A forged or foreign order id simply matches nothing here, and a
  // customer can never view another customer's order by editing the URL.
  const order = await db.order.findFirst({
    where: { id, userId: session.user.id },
    include: { items: true, shippingAddress: true },
  });

  if (!order) {
    notFound();
  }

  // Only fetched when actually needed — every other payment method never
  // touches this Easypaisa-only settings read.
  const settings = order.paymentMethod === "EASYPAISA" ? await getStoreSettings() : null;

  // Prefer the order's own historical shipping snapshot (Phase 2 Step 12),
  // immune to later edits or deletion of the Address it was copied from;
  // fall back to the live relation only for orders that predate it. Same
  // logic as src/app/account/orders/[id]/page.tsx.
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
    <div className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Order Placed Successfully</h1>
            <p className="mt-3 leading-relaxed text-slate">Thank you for your order.</p>
          </div>

          <div className="mt-10 rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                  Order #{order.id.slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-slate">
                  {order.createdAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
            </div>

            <div className="mt-5 divide-y divide-light-gray border-y border-light-gray">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-navy">{item.nameSnapshot}</p>
                    <p className="text-xs text-slate">Qty {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-navy">
                    {formatPrice(item.priceSnapshot.toNumber() * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <dl className="mt-4 space-y-1.5 text-sm">
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
                <dt className="text-slate">Payment Method</dt>
                <dd className="font-semibold text-navy">{paymentMethodLabel[order.paymentMethod]}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate">Payment Status</dt>
                <dd className="font-semibold text-navy">{paymentStatusLabel[order.paymentStatus]}</dd>
              </div>
            </dl>
            {order.paymentMethod === "BANK_TRANSFER" && (
              <p className="mt-3 text-xs leading-relaxed text-slate">
                Payment instructions will be provided separately.
              </p>
            )}
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

            {shipping && (
              <div className="mt-5 border-t border-light-gray pt-4 text-sm">
                <p className="font-semibold text-navy">Shipping Address</p>
                <p className="mt-1 text-slate">{shipping.label}</p>
                <p className="text-slate">
                  {shipping.line1}
                  {shipping.line2 ? `, ${shipping.line2}` : ""}
                </p>
                <p className="text-slate">
                  {shipping.city}, {shipping.province} {shipping.postalCode}
                </p>
                <p className="text-slate">{shipping.phone}</p>
              </div>
            )}
          </div>

          {order.paymentMethod === "EASYPAISA" && settings && (
            <div className="mt-6">
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
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/shop" variant="ghost" size="md">
              Continue Shopping
            </Button>
            <Button href="/account/orders" variant="primary" size="md">
              View My Orders
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
