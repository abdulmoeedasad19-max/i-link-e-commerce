import type { Metadata } from "next";
import Link from "next/link";
import { Percent, Plus, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCoupons, type AdminCouponStatusFilter } from "@/lib/admin/coupons";
import { couponStatusLabel, couponStatusVariant } from "@/lib/admin/coupon-status";
import { formatPrice } from "@/lib/utils";
import CouponRowActions from "@/components/admin/discounts/coupon-row-actions";

export const metadata: Metadata = {
  title: "Discounts / Coupons",
};

type DiscountsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

const STATUS_OPTIONS: { value: AdminCouponStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "EXPIRED", label: "Expired" },
  { value: "EXHAUSTED", label: "Exhausted" },
  { value: "DISABLED", label: "Disabled" },
];

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/discounts?${qs}` : "/admin/discounts";
}

function formatDiscount(discountType: "PERCENTAGE" | "FIXED_AMOUNT", discountValue: number): string {
  return discountType === "PERCENTAGE" ? `${discountValue}%` : formatPrice(discountValue);
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  if (!startDate && !endDate) return "No restriction";
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `From ${fmt(startDate)}`;
  return `Until ${fmt(endDate as Date)}`;
}

export default async function AdminDiscountsPage({ searchParams }: DiscountsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminCouponStatusFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { coupons, totalCount, totalPages } = await getAdminCoupons({ search, status, page });

  const hasFilters = Boolean(search || status !== "ALL");
  const filterParams = { q: search || undefined, status: status !== "ALL" ? status : undefined };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Discounts / Coupons</h1>
          <p className="mt-1 text-sm text-slate">
            {totalCount} coupon{totalCount === 1 ? "" : "s"}.
          </p>
        </div>
        <Button href="/admin/discounts/new" variant="primary" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Coupon
        </Button>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="coupon-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="coupon-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Coupon code…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="coupon-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="coupon-status-filter"
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

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {hasFilters && (
              <Button href="/admin/discounts" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {coupons.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Percent className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No coupons match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/discounts" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No coupons yet</h3>
                <p className="mt-2 text-sm text-slate">Create your first coupon to get started.</p>
                <div className="mt-6">
                  <Button href="/admin/discounts/new" variant="primary" size="md">
                    Add Coupon
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Code
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Discount
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Min. Order
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Max. Discount
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date Range
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Usage
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
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/discounts/${c.id}`}
                        className="font-mono text-xs font-semibold text-navy hover:text-royal"
                      >
                        {c.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">{formatDiscount(c.discountType, c.discountValue)}</td>
                    <td className="px-4 py-3 text-slate">
                      {c.minimumOrderAmount != null ? formatPrice(c.minimumOrderAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {c.maximumDiscountAmount != null ? formatPrice(c.maximumDiscountAmount) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate">{formatDateRange(c.startDate, c.endDate)}</td>
                    <td className="px-4 py-3 text-slate">
                      {c.usageCount} / {c.usageLimit ?? "Unlimited"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={couponStatusVariant[c.status]}>{couponStatusLabel[c.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CouponRowActions id={c.id} code={c.code} isActive={c.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Coupon pages" className="mt-6 flex items-center justify-center gap-2">
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
