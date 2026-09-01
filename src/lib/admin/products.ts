// Phase 4.3.2 — admin-side product reads.
//
// Deliberately separate from src/lib/products-repository.ts: that module's
// contract is customer-facing and ACTIVE-only (see its own docs), and this
// phase was explicitly told to preserve that contract rather than extend it.
// Admin needs to see every product regardless of status, plus
// search/filter/pagination shapes no storefront page needs — so this is its
// own module, not an addition to the repository.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ProductStatus } from "@/generated/prisma/enums";

export const ADMIN_PRODUCTS_PAGE_SIZE = 20;

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  image: string | null;
  categoryName: string;
  brandName: string | null;
  price: number;
  stock: number;
  status: ProductStatus;
  featured: boolean;
};

export type AdminProductImage = {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type AdminProductDetail = AdminProductListItem & {
  description: string;
  shortDescription: string | null;
  compareAtPrice: number | null;
  categoryId: string;
  brandId: string | null;
  images: AdminProductImage[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
};

/** Total catalog size across every status — backs the dashboard's Products
 * metric card. Mirrors getAdminCustomerCount()'s precedent (Phase 4.3.7):
 * dashboard metrics count the whole admin-owned dataset, the same way
 * /admin/products itself lists every status by default, not just what the
 * ACTIVE-only storefront repository shows. */
export async function getAdminProductCount(): Promise<number> {
  return db.product.count();
}

const ADMIN_LIST_INCLUDE = {
  category: true,
  brand: true,
  images: { where: { isPrimary: true }, take: 1 },
} satisfies Prisma.ProductInclude;

// Only used by getAdminProductById (the edit page, one product at a time),
// never by the list — the list's lightweight primary-only include stays
// untouched so paginated table rows don't each pull every image row.
const ADMIN_DETAIL_INCLUDE = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductWithAdminRelations = Prisma.ProductGetPayload<{ include: typeof ADMIN_LIST_INCLUDE }>;
type ProductWithAdminDetailRelations = Prisma.ProductGetPayload<{ include: typeof ADMIN_DETAIL_INCLUDE }>;

function toListItem(p: ProductWithAdminRelations): AdminProductListItem {
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
    status: p.status,
    featured: p.featured,
  };
}

function toDetail(p: ProductWithAdminDetailRelations): AdminProductDetail {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    image: p.images.find((img) => img.isPrimary)?.url ?? p.images[0]?.url ?? null,
    categoryName: p.category.name,
    brandName: p.brand?.name ?? null,
    price: p.price.toNumber(),
    stock: p.stock,
    status: p.status,
    featured: p.featured,
    description: p.description,
    shortDescription: p.shortDescription,
    compareAtPrice: p.compareAtPrice?.toNumber() ?? null,
    categoryId: p.categoryId,
    brandId: p.brandId,
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
    tags: p.tags,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

export type AdminProductStatusFilter = "ALL" | ProductStatus;
export type AdminProductStockFilter = "ALL" | "IN_STOCK" | "OUT_OF_STOCK";

export type AdminProductFilters = {
  search?: string;
  status?: AdminProductStatusFilter;
  categoryId?: string;
  brandId?: string;
  stock?: AdminProductStockFilter;
  page?: number;
};

export type AdminProductPage = {
  products: AdminProductListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminProducts(filters: AdminProductFilters): Promise<AdminProductPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ProductWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.stock === "IN_STOCK") where.stock = { gt: 0 };
  if (filters.stock === "OUT_OF_STOCK") where.stock = { lte: 0 };

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

  const [rows, totalCount] = await Promise.all([
    db.product.findMany({
      where,
      include: ADMIN_LIST_INCLUDE,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * ADMIN_PRODUCTS_PAGE_SIZE,
      take: ADMIN_PRODUCTS_PAGE_SIZE,
    }),
    db.product.count({ where }),
  ]);

  return {
    products: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_PRODUCTS_PAGE_SIZE)),
  };
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail | null> {
  const row = await db.product.findUnique({ where: { id }, include: ADMIN_DETAIL_INCLUDE });
  return row ? toDetail(row) : null;
}

export async function getAdminCategoryOptions(): Promise<{ id: string; name: string }[]> {
  return db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
}

export async function getAdminBrandOptions(): Promise<{ id: string; name: string }[]> {
  return db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

/** Lowercase, hyphenated, alphanumeric-only — used to auto-generate a slug
 * from the product name on create when the admin leaves the slug blank. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
