import type { Metadata } from "next";
import Link from "next/link";
import { Undo2, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminReturnRequests, type AdminReturnStatusFilter } from "@/lib/admin/returns";
import { returnStatusLabel, returnStatusVariant } from "@/lib/return-status";

export const metadata: Metadata = {
  title: "Return Requests",
};

type ReturnsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

const STATUS_OPTIONS: { value: AdminReturnStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/returns?${qs}` : "/admin/returns";
}

export default async function AdminReturnsPage({ searchParams }: ReturnsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminReturnStatusFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { returnRequests, totalCount, totalPages } = await getAdminReturnRequests({ search, status, page });

  const hasFilters = Boolean(search || status !== "ALL");
  const filterParams = { q: search || undefined, status: status !== "ALL" ? status : undefined };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Return Requests</h1>
          <p className="mt-1 text-sm text-slate">
            {totalCount} request{totalCount === 1 ? "" : "s"}.
          </p>
        </div>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="return-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="return-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Order ID, customer name or email…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="return-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="return-status-filter"
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
              <Button href="/admin/returns" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {returnRequests.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Undo2 className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No return requests match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/returns" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No return requests yet</h3>
                <p className="mt-2 text-sm text-slate">Customer return/exchange requests will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Reason
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Requested
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
                {returnRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy" title={r.orderId}>
                      #{r.orderId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      <p className="font-semibold text-navy">{r.customerName || r.customerEmail}</p>
                      <p className="text-xs">{r.customerEmail}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-4 py-3 font-semibold text-navy">{formatPrice(r.orderTotal)}</td>
                    <td className="px-4 py-3 text-slate">
                      {r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={returnStatusVariant[r.status]}>{returnStatusLabel[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/returns/${r.id}`} className="text-sm font-semibold text-royal hover:text-royal-600">
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
        <nav aria-label="Return request pages" className="mt-6 flex items-center justify-center gap-2">
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
