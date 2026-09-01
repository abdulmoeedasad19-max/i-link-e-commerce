import type { Metadata } from "next";
import { CreditCard, Receipt, TrendingUp } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminReportSummary, getTopSellingProductsInRange, type DateRange } from "@/lib/admin/reports";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Reports",
};

const TOP_PRODUCTS_LIMIT = 5;

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
] as const;
type RangePreset = (typeof RANGE_OPTIONS)[number]["value"];

function isRangePreset(value: string | undefined): value is RangePreset {
  return RANGE_OPTIONS.some((opt) => opt.value === value);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

// "YYYY-MM-DD" from <input type="date"> — parsed as server-local calendar
// components, not via `new Date(string)` (which treats the bare string as
// UTC midnight and can shift the displayed day by one depending on the
// server's timezone offset from UTC).
function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Every preset shares the same end boundary (end of today) and differs
 * only in how far back `start` goes — deterministic, and never excludes an
 * order placed earlier today the way filtering on a moving "now" timestamp
 * could. Custom range parses its own start/end inputs; either half falling
 * back to a sensible default (start of today / end of today) rather than
 * silently producing an unbounded or reversed range.
 */
function resolveDateRange(preset: RangePreset, customStart: string | undefined, customEnd: string | undefined): DateRange {
  const now = new Date();
  const todayEnd = endOfDay(now);

  if (preset === "today") {
    return { start: startOfDay(now), end: todayEnd };
  }
  if (preset === "7d") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);
    return { start, end: todayEnd };
  }
  if (preset === "30d") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 29);
    return { start, end: todayEnd };
  }
  if (preset === "month") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0), end: todayEnd };
  }

  const parsedStart = parseDateInput(customStart);
  const parsedEnd = parseDateInput(customEnd);
  return {
    start: parsedStart ? startOfDay(parsedStart) : startOfDay(now),
    end: parsedEnd ? endOfDay(parsedEnd) : todayEnd,
  };
}

type ReportsPageProps = {
  searchParams: Promise<{ range?: string; start?: string; end?: string }>;
};

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const preset: RangePreset = isRangePreset(params.range) ? params.range : "30d";
  const range = resolveDateRange(preset, params.start, params.end);

  const [summary, topProducts] = await Promise.all([
    getAdminReportSummary(range),
    getTopSellingProductsInRange(range, TOP_PRODUCTS_LIMIT),
  ]);

  const metrics = [
    { label: "Revenue", icon: CreditCard, value: formatPrice(summary.revenue) },
    { label: "Orders", icon: Receipt, value: summary.orderCount.toLocaleString("en-US") },
    { label: "Average Order Value", icon: TrendingUp, value: formatPrice(summary.averageOrderValue) },
  ];

  const rangeLabel = `${range.start.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} – ${range.end.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Reports</h1>
        <p className="mt-1 text-sm text-slate">Read-only revenue and sales analytics for {rangeLabel}.</p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="report-range" className="mb-1.5 block text-xs font-semibold text-slate">
              Date Range
            </label>
            <select
              id="report-range"
              name="range"
              defaultValue={preset}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-start" className="mb-1.5 block text-xs font-semibold text-slate">
              Custom Start
            </label>
            <input
              id="report-start"
              type="date"
              name="start"
              defaultValue={params.start ?? toDateInputValue(range.start)}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            />
          </div>

          <div>
            <label htmlFor="report-end" className="mb-1.5 block text-xs font-semibold text-slate">
              Custom End
            </label>
            <input
              id="report-end"
              type="date"
              name="end"
              defaultValue={params.end ?? toDateInputValue(range.end)}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            />
          </div>

          <p className="basis-full text-xs text-slate">
            Custom Start/End are only used when Date Range is set to &ldquo;Custom Range&rdquo;.
          </p>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {preset !== "30d" && (
              <Button href="/admin/reports" variant="ghost" size="sm">
                Reset
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.label} hover={false} className="p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate">
              <metric.icon className="h-4 w-4" aria-hidden="true" />
              {metric.label}
            </div>
            <p className="mt-3 text-2xl font-bold text-navy">{metric.value}</p>
          </Card>
        ))}
      </div>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        <div className="p-5 pb-0 sm:p-6 sm:pb-0">
          <h2 className="text-base font-bold text-navy">Top Selling Products</h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <TrendingUp className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">No sales in this period.</h3>
            <p className="mt-2 text-sm text-slate">Try a wider date range.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3 sm:px-6">
                    Rank
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-right sm:pr-6">
                    Units Sold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {topProducts.map((product, index) => (
                  <tr key={product.productSlug}>
                    <td className="px-4 py-3 font-semibold text-navy sm:px-6">{index + 1}</td>
                    <td className="px-4 py-3 text-navy">{product.nameSnapshot}</td>
                    <td className="px-4 py-3 text-right font-semibold text-navy sm:pr-6">
                      {product.quantitySold.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
