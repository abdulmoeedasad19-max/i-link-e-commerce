import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SectionHeading from "@/components/ui/section-heading";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: true },
};

export default async function AccountDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  // Read exclusively from the authenticated session — the browser has no
  // way to influence which user's information is shown here.
  const { user } = session;

  // Scoped exclusively to the authenticated session's own id, and capped
  // to the 3 most recent — this is a lightweight dashboard preview, not a
  // replacement for the full /account/orders list.
  const recentOrders = await db.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <div>
      <SectionHeading
        eyebrow="My Account"
        title={user.name ? `Welcome back, ${user.name}` : "Welcome back"}
        align="left"
        className="mx-0 text-left"
      />

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Email</p>
          <p className="mt-1 text-sm font-bold text-navy">{user.email}</p>
        </div>
        <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Account Type</p>
          <p className="mt-1 text-sm font-bold text-navy">
            {user.role === "ADMIN" ? "Administrator" : "Customer"}
          </p>
        </div>
      </div>

      {recentOrders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
            <Button href="/account/orders" variant="ghost" size="sm">
              View All →
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {recentOrders.map((order) => (
              <Card key={order.id} hover={false} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                      Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-slate">
                      {order.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-light-gray pt-3">
                  <p className="text-sm font-bold text-navy">{formatPrice(order.total.toNumber())}</p>
                  <Button href={`/account/orders/${order.id}`} variant="ghost" size="sm">
                    View Details →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
