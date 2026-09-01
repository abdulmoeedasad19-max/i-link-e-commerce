import type { Metadata } from "next";
import Link from "next/link";
import { Package, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import { orderStatusLabel, orderStatusVariant } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import {
  getAdminOrders,
  type AdminOrderPaymentMethodFilter,
  type AdminOrderPaymentStatusFilter,
  type AdminOrderStatusFilter,
} from "@/lib/admin/orders";

export const metadata: Metadata = {
  title: "Orders",
};

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    page?: string;
  }>;
};

const STATUS_OPTIONS: { value: AdminOrderStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS: { value: AdminOrderPaymentStatusFilter; label: string }[] = [
  { value: "ALL", label: "All payment statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS: { value: AdminOrderPaymentMethodFilter; label: string }[] = [
  { value: "ALL", label: "All payment methods" },
  { value: "COD", label: "Cash on Delivery" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminOrderStatusFilter) || "ALL";
  const paymentStatus = (params.paymentStatus as AdminOrderPaymentStatusFilter) || "ALL";
  const paymentMethod = (params.paymentMethod as AdminOrderPaymentMethodFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { orders, totalCount, totalPages } = await getAdminOrders({
    search,
    status,
    paymentStatus,
    paymentMethod,
    page,
  });

  const hasFilters = Boolean(
    search || status !== "ALL" || paymentStatus !== "ALL" || paymentMethod !== "ALL",
  );
  const filterParams = {
    q: search || undefined,
    status: status !== "ALL" ? status : undefined,
    paymentStatus: paymentStatus !== "ALL" ? paymentStatus : undefined,
    paymentMethod: paymentMethod !== "ALL" ? paymentMethod : undefined,
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Orders</h1>
        <p className="mt-1 text-sm text-slate">
          {totalCount} order{totalCount === 1 ? "" : "s"} placed.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="order-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="order-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Order ID, customer name or email…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="order-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="order-status-filter"
              name="status"
              defaultValue={status}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="order-payment-status-filter"
              className="mb-1.5 block text-xs font-semibold text-slate"
            >
              Payment Status
            </label>
            <select
              id="order-payment-status-filter"
              name="paymentStatus"
              defaultValue={paymentStatus}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="order-payment-method-filter"
              className="mb-1.5 block text-xs font-semibold text-slate"
            >
              Payment Method
            </label>
            <select
              id="order-payment-method-filter"
              name="paymentMethod"
              defaultValue={paymentMethod}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {hasFilters && (
              <Button href="/admin/orders" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Package className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No orders match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/orders" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No orders yet</h3>
                <p className="mt-2 text-sm text-slate">Orders placed by customers will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Order #
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Items
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-navy" title={order.id}>
                        #{order.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{order.customerName || "—"}</p>
                      <p className="text-xs text-slate">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {order.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate">{order.itemCount}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3 text-slate">
                      <p>{paymentMethodLabel[order.paymentMethod]}</p>
                      <p className="text-xs">{paymentStatusLabel[order.paymentStatus]}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={orderStatusVariant[order.status]}>{orderStatusLabel[order.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm font-semibold text-royal hover:text-royal-600"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Order pages" className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={buildPageHref(filterParams, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <span className="px-2 text-sm text-slate">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildPageHref(filterParams, Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Next
          </Link>
        </nav>
      )}
    </div>
  );
}
