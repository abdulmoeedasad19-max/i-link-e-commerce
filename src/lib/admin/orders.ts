// Phase 4.3.5 — admin-side order reads. Mirrors the read/write split
// established in src/lib/admin/products.ts, src/lib/admin/categories.ts,
// src/lib/admin/brands.ts: plain server-only functions, never
// client-invokable, protected by the admin layout chain rather than
// needing their own auth check (the mutation, in
// src/app/admin/orders/actions.ts, independently calls requireAdmin()).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export type AdminOrderListItem = {
  id: string;
  customerName: string | null;
  customerEmail: string;
  createdAt: Date;
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
};

const ADMIN_ORDER_LIST_INCLUDE = {
  user: { select: { name: true, email: true } },
  items: { select: { quantity: true } },
} satisfies Prisma.OrderInclude;

type OrderWithListRelations = Prisma.OrderGetPayload<{ include: typeof ADMIN_ORDER_LIST_INCLUDE }>;

function toListItem(o: OrderWithListRelations): AdminOrderListItem {
  return {
    id: o.id,
    customerName: o.user.name,
    customerEmail: o.user.email,
    createdAt: o.createdAt,
    // Same "sum of line-item quantities" definition already used by
    // src/app/(storefront)/account/orders/page.tsx — not a count of
    // distinct line items.
    itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
    total: o.total.toNumber(),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
  };
}

export type AdminOrderStatusFilter = "ALL" | OrderStatus;
export type AdminOrderPaymentStatusFilter = "ALL" | PaymentStatus;
export type AdminOrderPaymentMethodFilter = "ALL" | PaymentMethod;

export type AdminOrderFilters = {
  search?: string;
  status?: AdminOrderStatusFilter;
  paymentStatus?: AdminOrderPaymentStatusFilter;
  paymentMethod?: AdminOrderPaymentMethodFilter;
  page?: number;
};

export type AdminOrderPage = {
  orders: AdminOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminOrders(filters: AdminOrderFilters): Promise<AdminOrderPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.OrderWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") where.paymentStatus = filters.paymentStatus;
  if (filters.paymentMethod && filters.paymentMethod !== "ALL") where.paymentMethod = filters.paymentMethod;

  const search = filters.search?.trim();
  if (search) {
    // Order ids are cuids (lowercase); the list/detail UI displays a
    // shortened, uppercased tail of the id (see AdminOrderListItem
    // consumers) — `contains`/`insensitive` matches that pasted-back
    // fragment regardless of case, as well as a full id.
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.order.findMany({
      where,
      include: ADMIN_ORDER_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_ORDERS_PAGE_SIZE,
      take: ADMIN_ORDERS_PAGE_SIZE,
    }),
    db.order.count({ where }),
  ]);

  return {
    orders: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_ORDERS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_ORDERS_PAGE_SIZE)),
  };
}

/** Latest N orders, for the admin dashboard's "Recent Orders" card. Not a
 * distinct query shape — same list mapping, just unfiltered and capped. */
export async function getRecentAdminOrders(limit: number): Promise<AdminOrderListItem[]> {
  const rows = await db.order.findMany({
    include: ADMIN_ORDER_LIST_INCLUDE,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toListItem);
}

/** Total order count across every status — backs the dashboard's Orders
 * metric card. Mirrors getRecentAdminOrders() and the Orders list's own
 * default (unfiltered, every status) rather than inventing a narrower
 * definition. */
export async function getAdminOrderCount(): Promise<number> {
  return db.order.count();
}

/** Sum of Order.total (already the final, post-discount amount stored at
 * checkout — see Phase 4.3.10) for every order except CANCELLED, which is
 * the only OrderStatus value representing a voided sale. PENDING/
 * CONFIRMED/SHIPPED/DELIVERED all count: they're fulfillment-progress
 * states, not payment-validity states — PaymentStatus is a separate axis
 * that nothing in the app can transition away from PENDING yet, so it
 * can't be used as a revenue gate without producing a permanently-zero
 * figure. Decimal arithmetic throughout; converted to a plain number only
 * at this function's return boundary for display. */
export async function getAdminRevenueSummary(): Promise<number> {
  const result = await db.order.aggregate({
    where: { status: { not: "CANCELLED" } },
    _sum: { total: true },
  });
  return result._sum.total?.toNumber() ?? 0;
}

export type TopSellingProduct = {
  productSlug: string;
  nameSnapshot: string;
  quantitySold: number;
};

/** Top N products by units sold, from OrderItem's own snapshot fields —
 * OrderItem has no Product relation by design (see prisma/schema.prisma),
 * and this deliberately doesn't add one. CANCELLED orders are excluded,
 * matching getAdminRevenueSummary()'s exact rule: a cancelled order's
 * items were never actually sold. Two lightweight, fully Prisma-native
 * queries (a groupBy aggregate, then one bounded lookup for display
 * names) — no raw SQL, no unbounded row scan. */
export async function getTopSellingProducts(limit: number): Promise<TopSellingProduct[]> {
  const grouped = await db.orderItem.groupBy({
    by: ["productSlug"],
    where: { order: { status: { not: "CANCELLED" } } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  // One representative row per slug for display — names are effectively
  // stable across snapshots of the same real-world product, so which exact
  // row is picked doesn't matter in practice (same principle already
  // applied to productSlug display elsewhere: see
  // src/app/admin/orders/[id]/page.tsx's "historical only" comment).
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

export type AdminOrderItem = {
  id: string;
  productSlug: string;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrderShippingInfo = {
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
};

export type AdminOrderDetail = {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  // Manual Easypaisa verification (Phase 4.4.14) — transactionId is null
  // for every COD/BANK_TRANSFER order and for an EASYPAISA order before the
  // customer submits one. paidAt is set only by confirmEasypaisaPayment
  // below — the existing generic updatePaymentStatus transition (used for
  // COD/other manual reconciliation) is untouched and doesn't set it.
  transactionId: string | null;
  paidAt: Date | null;
  // Manual refund workflow (Phase 4.4.15) — both null until the dedicated
  // refundOrder admin action transitions a PAID order to REFUNDED.
  refundReason: string | null;
  refundedAt: Date | null;
  subtotal: number;
  total: number;
  // Historical coupon snapshot (Phase 4.3.10) — copied onto the order at
  // checkout, never re-derived from the live Coupon row. Both stay null on
  // an order that never had a coupon applied.
  discountCode: string | null;
  discountAmount: number | null;
  customer: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  // null covers both "this order predates the shipping snapshot and its
  // Address has since been deleted" and "somehow neither is available" —
  // the detail page renders a safe fallback message either way.
  shipping: AdminOrderShippingInfo | null;
  items: AdminOrderItem[];
};

export async function getAdminOrderById(id: string): Promise<AdminOrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      // passwordHash and every other credential/internal field are
      // deliberately excluded — only what order management needs.
      user: { select: { id: true, name: true, email: true, phone: true } },
      shippingAddress: true,
      items: true,
    },
  });
  if (!order) return null;

  // Same snapshot-first fallback already established in
  // src/app/(storefront)/account/orders/[id]/page.tsx: prefer the order's
  // own historical snapshot (immune to later Address edits/deletion);
  // fall back to the live relation only for orders that predate the
  // snapshot; null if neither is available.
  const shipping: AdminOrderShippingInfo | null = order.shippingLabel
    ? {
        label: order.shippingLabel,
        line1: order.shippingLine1 ?? "",
        line2: order.shippingLine2,
        city: order.shippingCity ?? "",
        province: order.shippingProvince ?? "",
        postalCode: order.shippingPostalCode ?? "",
        phone: order.shippingPhone ?? "",
      }
    : order.shippingAddress
      ? {
          label: order.shippingAddress.label,
          line1: order.shippingAddress.line1,
          line2: order.shippingAddress.line2,
          city: order.shippingAddress.city,
          province: order.shippingAddress.province,
          postalCode: order.shippingAddress.postalCode,
          phone: order.shippingAddress.phone,
        }
      : null;

  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    transactionId: order.transactionId,
    paidAt: order.paidAt,
    refundReason: order.refundReason,
    refundedAt: order.refundedAt,
    subtotal: order.subtotal.toNumber(),
    total: order.total.toNumber(),
    discountCode: order.discountCode,
    discountAmount: order.discountAmount ? order.discountAmount.toNumber() : null,
    customer: order.user,
    shipping,
    items: order.items.map((item) => ({
      id: item.id,
      productSlug: item.productSlug,
      nameSnapshot: item.nameSnapshot,
      priceSnapshot: item.priceSnapshot.toNumber(),
      quantity: item.quantity,
      // Decimal arithmetic for the line total (multiply before converting
      // to number) — never plain-float price * quantity.
      lineTotal: item.priceSnapshot.times(item.quantity).toNumber(),
    })),
  };
}
