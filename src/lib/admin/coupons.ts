// Phase 4.3.9 (Stage A) — admin-side coupon reads. Mirrors the read/write
// split established in src/lib/admin/quotations.ts etc.: plain server-only
// functions, never client-invokable, protected by the admin layout chain
// (mutations, in src/app/admin/discounts/actions.ts, independently call
// requireAdmin()).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { DiscountType } from "@/generated/prisma/enums";
import { classifyCoupon, type CouponComputedStatus } from "@/lib/admin/coupon-status";

export const ADMIN_COUPONS_PAGE_SIZE = 20;
export const COUPON_CODE_MAX_LENGTH = 40;

/** Trim + uppercase — the single normalization rule applied everywhere a
 * code is written (create/update) or matched for uniqueness. Search doesn't
 * need it: Postgres `mode: "insensitive"` already handles case there. */
export function normalizeCouponCode(input: string): string {
  return input.trim().toUpperCase();
}

type CouponRow = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: Prisma.Decimal;
  minimumOrderAmount: Prisma.Decimal | null;
  maximumDiscountAmount: Prisma.Decimal | null;
  startDate: Date | null;
  endDate: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
};

export type AdminCouponListItem = {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderAmount: number | null;
  maximumDiscountAmount: number | null;
  startDate: Date | null;
  endDate: Date | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  status: CouponComputedStatus;
};

function toListItem(c: CouponRow): AdminCouponListItem {
  return {
    id: c.id,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue.toNumber(),
    minimumOrderAmount: c.minimumOrderAmount ? c.minimumOrderAmount.toNumber() : null,
    maximumDiscountAmount: c.maximumDiscountAmount ? c.maximumDiscountAmount.toNumber() : null,
    startDate: c.startDate,
    endDate: c.endDate,
    usageLimit: c.usageLimit,
    usageCount: c.usageCount,
    isActive: c.isActive,
    status: classifyCoupon(c),
  };
}

export type AdminCouponStatusFilter = "ALL" | CouponComputedStatus;

export type AdminCouponFilters = {
  search?: string;
  status?: AdminCouponStatusFilter;
  page?: number;
};

export type AdminCouponPage = {
  coupons: AdminCouponListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminCoupons(filters: AdminCouponFilters): Promise<AdminCouponPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const now = new Date();
  const where: Prisma.CouponWhereInput = {};

  const search = filters.search?.trim();
  if (search) {
    where.code = { contains: search, mode: "insensitive" };
  }

  // Every branch below is expressed with plain Prisma comparisons — no raw
  // SQL — which is possible only because of two invariants create/update
  // (src/app/admin/discounts/actions.ts) always enforce:
  //   1. endDate is never stored earlier than startDate, so "expired"
  //      (now > endDate) can never simultaneously be "scheduled"
  //      (now < startDate) — the two are mutually exclusive without an
  //      extra check.
  //   2. usageLimit is always null or a positive integer (0/negative are
  //      rejected), and nothing in Stage A ever increments usageCount away
  //      from 0 — checkout/cart integration is Stage B, not yet built. So
  //      `usageCount >= usageLimit` (a column-to-column comparison Prisma
  //      can't express without raw SQL) can never be true for any coupon
  //      that exists today: EXHAUSTED is mathematically unreachable until
  //      Stage B starts incrementing usageCount, so the filter below is
  //      correctly implemented as "no results" rather than reaching for
  //      raw SQL to compute something that can't currently occur.
  if (filters.status === "DISABLED") {
    where.isActive = false;
  } else if (filters.status === "EXHAUSTED") {
    where.id = "__unreachable_in_stage_a__";
  } else if (filters.status === "SCHEDULED") {
    where.isActive = true;
    where.startDate = { gt: now };
  } else if (filters.status === "EXPIRED") {
    where.isActive = true;
    where.endDate = { lt: now };
  } else if (filters.status === "ACTIVE") {
    where.isActive = true;
    where.AND = [
      { OR: [{ startDate: null }, { startDate: { lte: now } }] },
      { OR: [{ endDate: null }, { endDate: { gte: now } }] },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_COUPONS_PAGE_SIZE,
      take: ADMIN_COUPONS_PAGE_SIZE,
    }),
    db.coupon.count({ where }),
  ]);

  return {
    coupons: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_COUPONS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_COUPONS_PAGE_SIZE)),
  };
}

export type AdminCouponDetail = AdminCouponListItem & {
  createdAt: Date;
  updatedAt: Date;
};

export async function getAdminCouponById(id: string): Promise<AdminCouponDetail | null> {
  const c = await db.coupon.findUnique({ where: { id } });
  if (!c) return null;
  return { ...toListItem(c), createdAt: c.createdAt, updatedAt: c.updatedAt };
}
