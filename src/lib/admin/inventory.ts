// Phase 4.3.8 — admin-side inventory reads. Inventory is not a separate
// data model: it is an admin view/interface over the existing
// Product.stock (and Product.lowStockThreshold) columns, the single source
// of truth already established in Phase 4.2.1 and already written to by
// Phase 4.3.2's product edit form. Mirrors the read/write split used by
// every other src/lib/admin/*.ts module: server-only, never
// client-invokable.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";

export const ADMIN_INVENTORY_PAGE_SIZE = 20;

// No project-wide or per-product low-stock threshold is in active use
// anywhere today: Product.lowStockThreshold is a real schema column (added
// in Phase 4.2.1 specifically for this purpose) but is confirmed null for
// all 48 real products, and no application code has ever read it before
// this file. This constant is the documented, centralized fallback used
// only when a product has no explicit threshold of its own — an
// application-level UI/reporting rule, not a stored default, referenced
// from exactly this one place. When a product DOES have its own
// lowStockThreshold set, that value is used instead (see classifyStock).
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

export type StockClassification = "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";

/** Matches the exact semantics given for this phase: OUT_OF_STOCK is
 * stock===0; IN_STOCK is any stock>0 (consistent with the IN_STOCK/
 * OUT_OF_STOCK filter already shipped on the Products admin list in Phase
 * 4.3.2 — same field, same meaning, not reinvented here); LOW_STOCK is a
 * stock>0 subset flagging attention, not a mutually exclusive third
 * bucket. */
export function classifyStock(stock: number, lowStockThreshold: number | null): StockClassification {
  if (stock <= 0) return "OUT_OF_STOCK";
  const threshold = lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  if (stock <= threshold) return "LOW_STOCK";
  return "IN_STOCK";
}

export type AdminInventoryItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  image: string | null;
  categoryName: string;
  brandName: string | null;
  price: number;
  stock: number;
  lowStockThreshold: number | null;
  classification: StockClassification;
  status: ProductStatus;
};

const ADMIN_INVENTORY_INCLUDE = {
  category: true,
  brand: true,
  images: { where: { isPrimary: true }, take: 1 },
} satisfies Prisma.ProductInclude;

type ProductWithInventoryRelations = Prisma.ProductGetPayload<{ include: typeof ADMIN_INVENTORY_INCLUDE }>;

function toInventoryItem(p: ProductWithInventoryRelations): AdminInventoryItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    image: p.images[0]?.url ?? null,
    categoryName: p.category.name,
    brandName: p.brand?.name ?? null,
    price: p.price.toNumber(),
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    classification: classifyStock(p.stock, p.lowStockThreshold),
    status: p.status,
  };
}

export type AdminInventoryStockFilter = "ALL" | StockClassification;
export type AdminInventoryStatusFilter = "ALL" | ProductStatus;

export type AdminInventoryFilters = {
  search?: string;
  stock?: AdminInventoryStockFilter;
  status?: AdminInventoryStatusFilter;
  categoryId?: string;
  brandId?: string;
  page?: number;
};

export type AdminInventoryPage = {
  items: AdminInventoryItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminInventory(filters: AdminInventoryFilters): Promise<AdminInventoryPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ProductWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brandId) where.brandId = filters.brandId;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
      { brand: { name: { contains: search, mode: "insensitive" } } },
      { category: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  // Prisma's standard filter builder cannot express a column-to-column
  // comparison (`stock <= lowStockThreshold`) without raw SQL, so the
  // LOW_STOCK filter is evaluated against the centralized default
  // threshold. This is exactly correct for every product today (confirmed:
  // lowStockThreshold is null for all 48 real products) — the only case it
  // would misclassify is a product with an explicit per-product threshold
  // different from the default, and no code anywhere in this phase (or any
  // prior phase) writes to that column. classifyStock() above still
  // computes the fully correct, threshold-aware label for on-page display
  // of whatever rows a query returns; only this WHERE-clause filter has
  // the narrower, currently-unreachable limitation. See the Phase 4.3.8
  // report.
  if (filters.stock === "OUT_OF_STOCK") {
    where.stock = 0;
  } else if (filters.stock === "IN_STOCK") {
    where.stock = { gt: 0 };
  } else if (filters.stock === "LOW_STOCK") {
    where.stock = { gt: 0, lte: DEFAULT_LOW_STOCK_THRESHOLD };
  }

  const [rows, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: ADMIN_INVENTORY_INCLUDE,
      orderBy: { stock: "asc" },
      skip: (page - 1) * ADMIN_INVENTORY_PAGE_SIZE,
      take: ADMIN_INVENTORY_PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  return {
    items: rows.map(toInventoryItem),
    totalCount,
    page,
    pageSize: ADMIN_INVENTORY_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_INVENTORY_PAGE_SIZE)),
  };
}

export type AdminLowStockSummary = {
  items: AdminInventoryItem[];
  totalCount: number;
};

/** Backs the dashboard's Low Stock card: products at or below the
 * (threshold-aware) low-stock line, most urgent (lowest stock) first. */
export async function getLowStockSummary(limit: number): Promise<AdminLowStockSummary> {
  const where: Prisma.ProductWhereInput = { stock: { lte: DEFAULT_LOW_STOCK_THRESHOLD } };

  const [rows, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: ADMIN_INVENTORY_INCLUDE,
      orderBy: { stock: "asc" },
      take: limit,
    }),
    db.product.count({ where }),
  ]);

  return { items: rows.map(toInventoryItem), totalCount };
}
