import type { Metadata } from "next";
import Link from "next/link";
import { Star, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { reviewStatusLabel, reviewStatusVariant } from "@/lib/review-status";
import { getAdminReviews, type AdminReviewStatusFilter } from "@/lib/admin/reviews";

export const metadata: Metadata = {
  title: "Reviews",
};

type ReviewsPageProps = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

const STATUS_OPTIONS: { value: AdminReviewStatusFilter; label: string }[] = [
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
  return qs ? `/admin/reviews?${qs}` : "/admin/reviews";
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="font-semibold text-navy" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-light-gray">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewsPage({ searchParams }: ReviewsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminReviewStatusFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { reviews, totalCount, totalPages } = await getAdminReviews({ search, status, page });

  const hasFilters = Boolean(search || status !== "ALL");
  const filterParams = { q: search || undefined, status: status !== "ALL" ? status : undefined };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Reviews</h1>
        <p className="mt-1 text-sm text-slate">
          {totalCount} review{totalCount === 1 ? "" : "s"} submitted.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="review-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="review-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Title, body, customer, product…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="review-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="review-status-filter"
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
              <Button href="/admin/reviews" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Star className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No reviews match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/reviews" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No reviews yet</h3>
                <p className="mt-2 text-sm text-slate">Reviews submitted by customers will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Rating
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Title
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Verified
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Date
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
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-[180px] truncate px-4 py-3 font-medium text-navy" title={r.productName}>
                      {r.productName}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{r.customerName || "—"}</p>
                      <p className="text-xs text-slate">{r.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Stars rating={r.rating} />
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-slate" title={r.title ?? undefined}>
                      {r.title || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.verifiedPurchase ? (
                        <Badge variant="success">Verified</Badge>
                      ) : (
                        <span className="text-slate">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {r.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={reviewStatusVariant[r.status]}>{reviewStatusLabel[r.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/reviews/${r.id}`}
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
        <nav aria-label="Review pages" className="mt-6 flex items-center justify-center gap-2">
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
