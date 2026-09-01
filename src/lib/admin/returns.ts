// Phase 4.4.18 — admin-side return-request reads. Mirrors the read/write
// split established in src/lib/admin/quotations.ts: plain server-only
// functions, never client-invokable, protected by the admin layout chain
// (the mutation, in src/app/admin/returns/actions.ts, independently calls
// requireAdmin()).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, ReturnStatus } from "@/generated/prisma/enums";

export const ADMIN_RETURNS_PAGE_SIZE = 20;

export type AdminReturnRequestListItem = {
  id: string;
  createdAt: Date;
  status: ReturnStatus;
  reason: string;
  orderId: string;
  orderTotal: number;
  customerName: string | null;
  customerEmail: string;
};

const ADMIN_RETURN_LIST_INCLUDE = {
  order: { select: { id: true, total: true } },
  user: { select: { name: true, email: true } },
} satisfies Prisma.ReturnRequestInclude;

type ReturnRequestWithRelations = Prisma.ReturnRequestGetPayload<{ include: typeof ADMIN_RETURN_LIST_INCLUDE }>;

function toListItem(r: ReturnRequestWithRelations): AdminReturnRequestListItem {
  return {
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    reason: r.reason,
    orderId: r.order.id,
    orderTotal: r.order.total.toNumber(),
    customerName: r.user.name,
    customerEmail: r.user.email,
  };
}

export type AdminReturnStatusFilter = "ALL" | ReturnStatus;

export type AdminReturnFilters = {
  search?: string;
  status?: AdminReturnStatusFilter;
  page?: number;
};

export type AdminReturnPage = {
  returnRequests: AdminReturnRequestListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminReturnRequests(filters: AdminReturnFilters): Promise<AdminReturnPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ReturnRequestWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { orderId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.returnRequest.findMany({
      where,
      include: ADMIN_RETURN_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_RETURNS_PAGE_SIZE,
      take: ADMIN_RETURNS_PAGE_SIZE,
    }),
    db.returnRequest.count({ where }),
  ]);

  return {
    returnRequests: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_RETURNS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_RETURNS_PAGE_SIZE)),
  };
}

export type AdminReturnRequestDetail = {
  id: string;
  createdAt: Date;
  status: ReturnStatus;
  reason: string;
  rejectionReason: string | null;
  order: {
    id: string;
    createdAt: Date;
    total: number;
    status: OrderStatus;
    deliveredAt: Date | null;
  };
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
};

export async function getAdminReturnRequestById(id: string): Promise<AdminReturnRequestDetail | null> {
  const r = await db.returnRequest.findUnique({
    where: { id },
    include: {
      order: { select: { id: true, createdAt: true, total: true, status: true, deliveredAt: true } },
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!r) return null;

  return {
    id: r.id,
    createdAt: r.createdAt,
    status: r.status,
    reason: r.reason,
    rejectionReason: r.rejectionReason,
    order: {
      id: r.order.id,
      createdAt: r.order.createdAt,
      total: r.order.total.toNumber(),
      status: r.order.status,
      deliveredAt: r.order.deliveredAt,
    },
    customer: {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      phone: r.user.phone,
    },
  };
}
