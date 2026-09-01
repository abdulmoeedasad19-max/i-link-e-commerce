import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CreditCard, Package, TrendingUp, TriangleAlert, Users } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getRecentAdminOrders,
  getAdminOrderCount,
  getAdminRevenueSummary,
  getTopSellingProducts,
} from "@/lib/admin/orders";
import { getAdminCustomerCount } from "@/lib/admin/customers";
import { getAdminProductCount } from "@/lib/admin/products";
import { getLowStockSummary } from "@/lib/admin/inventory";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const RECENT_ORDERS_LIMIT = 5;
const LOW_STOCK_CARD_LIMIT = 5;
const TOP_SELLING_LIMIT = 5;

// Phase 4.4.2 — all four metric cards are now wired to real data. Revenue
// is formatted as currency at render time; the other three are plain
// counts (see the value lookup below).
const metrics = [
  { label: "Revenue", icon: CreditCard },
  { label: "Orders", icon: Clock },
  { label: "Customers", icon: Users },
  { label: "Products", icon: Package },
];

export default async function AdminHomePage() {
  // Redundant with the layout's own check, matching this codebase's
  // established per-page defense-in-depth convention (see every page
  // under /account for the same pattern).
  const session = await requireAdmin();
  const [recentOrders, customerCount, lowStock, revenue, orderCount, productCount, topSelling] = await Promise.all([
    getRecentAdminOrders(RECENT_ORDERS_LIMIT),
    getAdminCustomerCount(),
    getLowStockSummary(LOW_STOCK_CARD_LIMIT),
    getAdminRevenueSummary(),
    getAdminOrderCount(),
    getAdminProductCount(),
    getTopSellingProducts(TOP_SELLING_LIMIT),
  ]);

  const metricValues: Record<string, number> = {
    Revenue: revenue,
    Orders: orderCount,
    Customers: customerCount,
    Products: productCount,
  };
  const metricsWithValues = metrics.map((metric) => ({ ...metric, value: metricValues[metric.label] }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
        Welcome back, {session.user.name || session.user.email}. Here&rsquo;s how the store is doing.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricsWithValues.map((metric) => (
          <Card key={metric.label} hover={false} className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate">
              <metric.icon className="h-4 w-4" aria-hidden="true" />
              {metric.label}
            </div>
            <p className="mt-3 text-2xl font-bold text-navy">
              {metric.label === "Revenue" ? formatPrice(metric.value) : metric.value.toLocaleString("en-US")}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card hover={false} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-navy">Recent Orders</h2>
            {recentOrders.length > 0 && (
              <Link href="/admin/orders" className="text-xs font-semibold text-royal hover:text-royal-600">
                View All →
              </Link>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-light-gray py-10 text-center">
              <Clock className="h-6 w-6 text-slate" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate">No orders yet</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-light-gray p-3 text-sm transition-colors hover:border-royal/30 hover:bg-soft-gray"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">
                        #{order.id.slice(-8).toUpperCase()} — {order.customerName || order.customerEmail}
                      </p>
                      <p className="text-xs text-slate">
                        {order.createdAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-semibold text-navy">{formatPrice(order.total)}</span>
                      <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card hover={false} className="p-5">
          <h2 className="text-sm font-bold text-navy">Top Selling Products</h2>
          {topSelling.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-light-gray py-10 text-center">
              <TrendingUp className="h-6 w-6 text-slate" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate">No product data available</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {topSelling.map((product, index) => (
                <li
                  key={product.productSlug}
                  // Historical only, like every other productSlug shown in
                  // this admin — see src/app/admin/orders/[id]/page.tsx.
                  // The product behind this slug may since have been
                  // edited, archived, or deleted, so this deliberately
                  // isn't a link to a live product record.
                  className="flex items-center gap-3 rounded-xl border border-light-gray p-2.5 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal/10 text-xs font-bold text-royal">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-navy">{product.nameSnapshot}</span>
                  <span className="shrink-0 font-semibold text-slate">
                    {product.quantitySold} sold
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card hover={false} className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-navy">Low Stock</h2>
            {lowStock.items.length > 0 && (
              <Link href="/admin/inventory" className="text-xs font-semibold text-royal hover:text-royal-600">
                View All →
              </Link>
            )}
          </div>
          {lowStock.items.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-light-gray py-10 text-center">
              <TriangleAlert className="h-6 w-6 text-slate" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate">No stock data available</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {lowStock.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/products/${item.id}/edit`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-light-gray p-2.5 text-sm transition-colors hover:border-royal/30 hover:bg-soft-gray"
                  >
                    <span className="truncate font-medium text-navy">{item.name}</span>
                    <span
                      className={`shrink-0 font-semibold ${item.stock === 0 ? "text-error" : "text-[#b5760f]"}`}
                    >
                      {item.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
