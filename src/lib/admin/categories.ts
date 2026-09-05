// Phase 4.3.3 — admin-side category reads. Mirrors the read/write split
// established in src/lib/admin/products.ts: plain server-only functions,
// never client-invokable, protected by the admin layout chain rather than
// needing their own auth check (mutations, in actions.ts, each call
// requireAdmin() independently instead).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { CategoryTier } from "@/generated/prisma/enums";

export const ADMIN_CATEGORIES_PAGE_SIZE = 20;

export type AdminCategoryListItem = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  tier: CategoryTier;
  productCount: number;
};

export type AdminCategoryDetail = AdminCategoryListItem & {
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const WITH_PRODUCT_COUNT = { _count: { select: { products: true } } } satisfies Prisma.CategoryInclude;

export type AdminCategoryPage = {
  categories: AdminCategoryListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminCategories(params: { search?: string; page?: number }): Promise<AdminCategoryPage> {
  const page = Math.max(1, Math.trunc(params.page ?? 1));
  const search = params.search?.trim();

  const where: Prisma.CategoryWhereInput = search
    ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { slug: { contains: search, mode: "insensitive" } }] }
    : {};

  const [rows, totalCount] = await Promise.all([
    db.category.findMany({
      where,
      include: WITH_PRODUCT_COUNT,
      orderBy: { sortOrder: "asc" },
      skip: (page - 1) * ADMIN_CATEGORIES_PAGE_SIZE,
      take: ADMIN_CATEGORIES_PAGE_SIZE,
    }),
    db.category.count({ where }),
  ]);

  return {
    categories: rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image: c.image,
      icon: c.icon,
      tier: c.tier,
      productCount: c._count.products,
    })),
    totalCount,
    page,
    pageSize: ADMIN_CATEGORIES_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_CATEGORIES_PAGE_SIZE)),
  };
}

export async function getAdminCategoryById(id: string): Promise<AdminCategoryDetail | null> {
  const row = await db.category.findUnique({ where: { id }, include: WITH_PRODUCT_COUNT });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    image: row.image,
    icon: row.icon,
    tier: row.tier,
    productCount: row._count.products,
  };
}
