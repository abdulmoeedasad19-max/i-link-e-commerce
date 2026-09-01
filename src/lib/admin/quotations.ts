// Phase 4.3.6 — admin-side quotation reads. Mirrors the read/write split
// established in src/lib/admin/orders.ts etc.: plain server-only
// functions, never client-invokable, protected by the admin layout chain
// (mutations, in src/app/admin/quotations/actions.ts, independently call
// requireAdmin()).
//
// Unlike Order, Quotation stores the requester's fullName/companyName/
// email/phone directly on its own row (userId is optional — the form has
// always been guest-friendly) — so no User join is needed for the core
// listing/detail display at all.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { PreferredContact, QuotationStatus } from "@/generated/prisma/enums";

export const ADMIN_QUOTATIONS_PAGE_SIZE = 20;

export type AdminQuotationListItem = {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  createdAt: Date;
  requirement: string;
  quantity: number;
  status: QuotationStatus;
};

function toListItem(q: {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  createdAt: Date;
  requirement: string;
  quantity: number;
  status: QuotationStatus;
}): AdminQuotationListItem {
  return {
    id: q.id,
    fullName: q.fullName,
    companyName: q.companyName,
    email: q.email,
    createdAt: q.createdAt,
    requirement: q.requirement,
    quantity: q.quantity,
    status: q.status,
  };
}

export type AdminQuotationStatusFilter = "ALL" | QuotationStatus;

export type AdminQuotationFilters = {
  search?: string;
  status?: AdminQuotationStatusFilter;
  page?: number;
};

export type AdminQuotationPage = {
  quotations: AdminQuotationListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminQuotations(filters: AdminQuotationFilters): Promise<AdminQuotationPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.QuotationWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { fullName: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { requirement: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_QUOTATIONS_PAGE_SIZE,
      take: ADMIN_QUOTATIONS_PAGE_SIZE,
    }),
    db.quotation.count({ where }),
  ]);

  return {
    quotations: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_QUOTATIONS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_QUOTATIONS_PAGE_SIZE)),
  };
}

/** Latest N quotations — no dashboard card currently exists for these (see
 * the final report), but kept for parity with getRecentAdminOrders() in
 * case one is added later without needing a new query shape. */
export async function getRecentAdminQuotations(limit: number): Promise<AdminQuotationListItem[]> {
  const rows = await db.quotation.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(toListItem);
}

export type AdminQuotationDetail = {
  id: string;
  createdAt: Date;
  status: QuotationStatus;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  requirement: string;
  quantity: number;
  preferredContact: PreferredContact | null;
  additionalRequirements: string | null;
  message: string;
  // Present only when the requester happened to be logged in at submission
  // time — never required, never joined for display beyond this flag.
  linkedAccountEmail: string | null;
};

export async function getAdminQuotationById(id: string): Promise<AdminQuotationDetail | null> {
  const q = await db.quotation.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!q) return null;

  return {
    id: q.id,
    createdAt: q.createdAt,
    status: q.status,
    fullName: q.fullName,
    companyName: q.companyName,
    email: q.email,
    phone: q.phone,
    requirement: q.requirement,
    quantity: q.quantity,
    preferredContact: q.preferredContact,
    additionalRequirements: q.additionalRequirements,
    message: q.message,
    linkedAccountEmail: q.user?.email ?? null,
  };
}
