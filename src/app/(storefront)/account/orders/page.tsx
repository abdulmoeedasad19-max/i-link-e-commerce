import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false, follow: true },
};

export default async function OrdersPage() {
  // Layer 2 of route protection — independent of proxy.ts (Layer 1). Never
  // rely on the proxy alone.
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/orders");
  }

  // Scoped exclusively to the authenticated session's own id — never a
  // client-supplied id from a query param, form field, or anywhere else.
  const orders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div>
      <SectionHeading eyebrow="My Account" title="My Orders" align="left" className="mx-0 text-left" />

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
            <Package className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-lg font-bold text-navy">You don&apos;t have any orders yet</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate">
            Once you place an order, your orders will appear here.
          </p>
          <div className="mt-6">
            <Button href="/shop" variant="primary" size="md">
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <Card key={order.id} hover={false} className="p-5 sm:p-6">
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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-light-gray pt-4">
                  <p className="text-sm text-slate">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-base font-bold text-navy">{formatPrice(order.total.toNumber())}</p>
                </div>

                <p className="mt-1.5 text-xs text-slate">
                  {paymentMethodLabel[order.paymentMethod]} · {paymentStatusLabel[order.paymentStatus]}
                  {order.discountAmount != null && (
                    <>
                      {" "}
                      · Coupon <span className="font-mono">{order.discountCode}</span> applied
                    </>
                  )}
                </p>

                <div className="mt-4 border-t border-light-gray pt-4">
                  <Button href={`/account/orders/${order.id}`} variant="ghost" size="sm">
                    View Details →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
