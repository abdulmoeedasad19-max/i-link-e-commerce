// Phase 4.4.6 — admin reporting reads. Deliberately a new, separate module
// rather than adding date-range parameters to getAdminRevenueSummary() /
// getAdminOrderCount() / getTopSellingProducts() in src/lib/admin/orders.ts
// (Phase 4.4.2) — those already back the live dashboard and are proven
// correct as-is; this file reuses their exact query shape, parameterized by
// a date range, without touching anything the dashboard depends on.
import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export type DateRange = { start: Date; end: Date };

export type AdminReportSummary = {
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
};

/**
 * Revenue = SUM(Order.total) for status != CANCELLED, within [start, end].
 * Order.total is already the final, post-discount amount stored at
 * checkout (Phase 4.3.10) — never subtotal, never a reconstructed
 * discount. Order count uses the identical WHERE clause, so the two are
 * always consistent with each other. AOV is computed in Decimal space
 * (dividing the summed Decimal by the integer count) and converted to a
 * plain number only at the return boundary, matching this project's money
 * convention; 0 when there are no qualifying orders, never a division by
 * zero.
 */
export async function getAdminReportSummary(range: DateRange): Promise<AdminReportSummary> {
  const where: Prisma.OrderWhereInput = {
    status: { not: "CANCELLED" },
    createdAt: { gte: range.start, lte: range.end },
  };

  const [aggregate, orderCount] = await Promise.all([
    db.order.aggregate({ where, _sum: { total: true } }),
    db.order.count({ where }),
  ]);

  const revenueDecimal = aggregate._sum.total ?? new Prisma.Decimal(0);
  const averageOrderValue = orderCount > 0 ? revenueDecimal.dividedBy(orderCount).toNumber() : 0;

  return {
    revenue: revenueDecimal.toNumber(),
    orderCount,
    averageOrderValue,
  };
}

export type TopSellingProductInRange = {
  productSlug: string;
  nameSnapshot: string;
  quantitySold: number;
};

/**
 * Same two-query pattern as getTopSellingProducts() in orders.ts (a
 * groupBy aggregate, then one bounded name lookup) — no raw SQL, no
 * unbounded row scan — scoped additionally to the date range via the
 * order relation filter. CANCELLED orders' items are excluded: their
 * units were never actually sold.
 */
export async function getTopSellingProductsInRange(
  range: DateRange,
  limit: number,
): Promise<TopSellingProductInRange[]> {
  const grouped = await db.orderItem.groupBy({
    by: ["productSlug"],
    where: {
      order: {
        status: { not: "CANCELLED" },
        createdAt: { gte: range.start, lte: range.end },
      },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  // One representative row per slug for display — same principle already
  // applied in getTopSellingProducts(): names are stable across snapshots
  // of the same real-world product, so which exact row is picked doesn't
  // matter in practice.
  const slugs = grouped.map((g) => g.productSlug);
  const names = await db.orderItem.findMany({
    where: { productSlug: { in: slugs } },
    distinct: ["productSlug"],
    select: { productSlug: true, nameSnapshot: true },
  });
  const nameBySlug = new Map(names.map((n) => [n.productSlug, n.nameSnapshot]));

  return grouped.map((g) => ({
    productSlug: g.productSlug,
    nameSnapshot: nameBySlug.get(g.productSlug) ?? g.productSlug,
    quantitySold: g._sum.quantity ?? 0,
  }));
}
