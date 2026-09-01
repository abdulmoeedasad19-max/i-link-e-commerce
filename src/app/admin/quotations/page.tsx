import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { quotationStatusLabel, quotationStatusVariant } from "@/lib/quotation-status";
import { getAdminQuotations, type AdminQuotationStatusFilter } from "@/lib/admin/quotations";

export const metadata: Metadata = {
  title: "Quotations",
};

type QuotationsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

const STATUS_OPTIONS: { value: AdminQuotationStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "RESPONDED", label: "Responded" },
  { value: "CLOSED", label: "Closed" },
];

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/quotations?${qs}` : "/admin/quotations";
}

export default async function AdminQuotationsPage({ searchParams }: QuotationsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminQuotationStatusFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { quotations, totalCount, totalPages } = await getAdminQuotations({ search, status, page });

  const hasFilters = Boolean(search || status !== "ALL");
  const filterParams = { q: search || undefined, status: status !== "ALL" ? status : undefined };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Quotations</h1>
        <p className="mt-1 text-sm text-slate">
          {totalCount} request{totalCount === 1 ? "" : "s"} submitted.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="quotation-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="quotation-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, company, email, phone, requirement…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="quotation-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="quotation-status-filter"
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
              <Button href="/admin/quotations" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <FileText className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No quotations match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/quotations" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No quotations yet</h3>
                <p className="mt-2 text-sm text-slate">
                  Requests submitted through the business quotation form will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Request #
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Requirement
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Qty
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
                {quotations.map((q) => (
                  <tr key={q.id}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-navy" title={q.id}>
                        #{q.id.slice(-8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{q.fullName}</p>
                      <p className="text-xs text-slate">
                        {q.companyName} &middot; {q.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {q.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate" title={q.requirement}>
                      {q.requirement}
                    </td>
                    <td className="px-4 py-3 text-slate">{q.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={quotationStatusVariant[q.status]}>{quotationStatusLabel[q.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/quotations/${q.id}`}
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
        <nav aria-label="Quotation pages" className="mt-6 flex items-center justify-center gap-2">
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
