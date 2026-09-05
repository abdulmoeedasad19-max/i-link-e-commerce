// Phase 4.3.3 — admin-side brand reads. Mirrors src/lib/admin/categories.ts.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const ADMIN_BRANDS_PAGE_SIZE = 20;

export type AdminBrandListItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  productCount: number;
};

const WITH_PRODUCT_COUNT = { _count: { select: { products: true } } } satisfies Prisma.BrandInclude;

export type AdminBrandPage = {
  brands: AdminBrandListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminBrands(params: { search?: string; page?: number }): Promise<AdminBrandPage> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const search = params.search?.trim();

  const where: Prisma.BrandWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] }
    : {};

  const [rows, totalCount] = await Promise.all([
    db.brand.findMany({
      where,
      include: WITH_PRODUCT_COUNT,
      orderBy: { name: "asc" },
      skip: (page - 1) * ADMIN_BRANDS_PAGE_SIZE,
      take: ADMIN_BRANDS_PAGE_SIZE,
    }),
    db.brand.count({ where }),
  ]);

  return {
    brands: rows.map((b) => ({ id: b.id, name: b.name, slug: b.slug, logoUrl: b.logoUrl, productCount: b._count.products })),
    totalCount,
    page,
    pageSize: ADMIN_BRANDS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_BRANDS_PAGE_SIZE)),
  };
}

export async function getAdminBrandById(id: string): Promise<AdminBrandListItem | null> {
  const row = await db.brand.findUnique({ where: { id }, include: WITH_PRODUCT_COUNT });
  if (!row) return null;
  return { 
    id: row.id, 
    name: row.name, 
    slug: row.slug, 
    logoUrl: row.logoUrl, 
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    productCount: row._count.products 
  };
}
