// Phase 4.3.7 — admin-side customer reads. Mirrors the read/write split
// established in src/lib/admin/orders.ts, src/lib/admin/quotations.ts:
// plain server-only functions, never client-invokable, protected by the
// admin layout chain (the role-change mutation, in
// src/app/admin/customers/actions.ts, independently calls requireAdmin()).
//
// User has no status/isActive/disabled field — confirmed by reading the
// schema directly, not assumed. No such filter or management UI exists
// here as a result; inventing one was explicitly out of scope.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod, PaymentStatus, QuotationStatus, Role } from "@/generated/prisma/enums";

export const ADMIN_CUSTOMERS_PAGE_SIZE = 20;
// Detail-page history caps — avoids ever loading an unbounded number of a
// customer's orders/quotations; the real total is still shown via _count.
const CUSTOMER_ORDER_HISTORY_LIMIT = 20;
const CUSTOMER_QUOTATION_HISTORY_LIMIT = 20;

export type AdminCustomerListItem = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
  orderCount: number;
  quotationCount: number;
  addressCount: number;
};

const ADMIN_CUSTOMER_LIST_INCLUDE = {
  _count: { select: { orders: true, quotations: true, addresses: true } },
} satisfies Prisma.UserInclude;

type UserWithCounts = Prisma.UserGetPayload<{ include: typeof ADMIN_CUSTOMER_LIST_INCLUDE }>;

function toListItem(u: UserWithCounts): AdminCustomerListItem {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
    orderCount: u._count.orders,
    quotationCount: u._count.quotations,
    addressCount: u._count.addresses,
  };
}

export type AdminCustomerRoleFilter = "ALL" | Role;

export type AdminCustomerFilters = {
  search?: string;
  role?: AdminCustomerRoleFilter;
  page?: number;
};

export type AdminCustomerPage = {
  customers: AdminCustomerListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Total registered account count — backs the dashboard's Customers metric
 * card. A single lightweight count query, never a full customer load. */
export async function getAdminCustomerCount(): Promise<number> {
  return db.user.count();
}

export async function getAdminCustomers(filters: AdminCustomerFilters): Promise<AdminCustomerPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.UserWhereInput = {};
  if (filters.role && filters.role !== "ALL") where.role = filters.role;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.user.findMany({
      where,
      include: ADMIN_CUSTOMER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_CUSTOMERS_PAGE_SIZE,
      take: ADMIN_CUSTOMERS_PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return {
    customers: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_CUSTOMERS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_CUSTOMERS_PAGE_SIZE)),
  };
}

export type AdminCustomerAddress = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
};

export type AdminCustomerOrderSummary = {
  id: string;
  createdAt: Date;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
};

export type AdminCustomerQuotationSummary = {
  id: string;
  createdAt: Date;
  requirement: string;
  quantity: number;
  status: QuotationStatus;
};

export type AdminCustomerDetail = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  createdAt: Date;
  addresses: AdminCustomerAddress[];
  orders: AdminCustomerOrderSummary[];
  quotations: AdminCustomerQuotationSummary[];
  orderCount: number;
  quotationCount: number;
  addressCount: number;
};

export async function getAdminCustomerById(id: string): Promise<AdminCustomerDetail | null> {
  const user = await db.user.findUnique({
    where: { id },
    // Deliberately not selecting passwordHash, accounts, or sessions —
    // nothing security-sensitive ever leaves this function.
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: { orderBy: { createdAt: "desc" }, take: CUSTOMER_ORDER_HISTORY_LIMIT },
      quotations: { orderBy: { createdAt: "desc" }, take: CUSTOMER_QUOTATION_HISTORY_LIMIT },
      _count: { select: { orders: true, quotations: true, addresses: true } },
    },
  });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      province: a.province,
      postalCode: a.postalCode,
      phone: a.phone,
      isDefault: a.isDefault,
    })),
    orders: user.orders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      total: o.total.toNumber(),
      paymentMethod: o.paymentMethod,
      paymentStatus: o.paymentStatus,
      status: o.status,
    })),
    quotations: user.quotations.map((q) => ({
      id: q.id,
      createdAt: q.createdAt,
      requirement: q.requirement,
      quantity: q.quantity,
      status: q.status,
    })),
    orderCount: user._count.orders,
    quotationCount: user._count.quotations,
    addressCount: user._count.addresses,
  };
}
