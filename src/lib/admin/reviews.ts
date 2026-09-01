// Phase 4.4.5 — admin-side review reads. Mirrors the read/write split
// established in src/lib/admin/quotations.ts: plain server-only functions,
// never client-invokable, protected by the admin layout chain (mutations,
// in src/app/admin/reviews/actions.ts, independently call requireAdmin()).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ReviewStatus } from "@/generated/prisma/enums";

export const ADMIN_REVIEWS_PAGE_SIZE = 20;

export type AdminReviewListItem = {
  id: string;
  productName: string;
  productSlug: string;
  customerName: string | null;
  customerEmail: string;
  rating: number;
  title: string | null;
  status: ReviewStatus;
  verifiedPurchase: boolean;
  createdAt: Date;
};

const ADMIN_REVIEW_LIST_INCLUDE = {
  user: { select: { name: true, email: true } },
  product: { select: { name: true, slug: true } },
} satisfies Prisma.ReviewInclude;

type ReviewWithListRelations = Prisma.ReviewGetPayload<{ include: typeof ADMIN_REVIEW_LIST_INCLUDE }>;

function toListItem(r: ReviewWithListRelations): AdminReviewListItem {
  return {
    id: r.id,
    productName: r.product.name,
    productSlug: r.product.slug,
    customerName: r.user.name,
    customerEmail: r.user.email,
    rating: r.rating,
    title: r.title,
    status: r.status,
    verifiedPurchase: r.verifiedPurchase,
    createdAt: r.createdAt,
  };
}

export type AdminReviewStatusFilter = "ALL" | ReviewStatus;

export type AdminReviewFilters = {
  search?: string;
  status?: AdminReviewStatusFilter;
  page?: number;
};

export type AdminReviewPage = {
  reviews: AdminReviewListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminReviews(filters: AdminReviewFilters): Promise<AdminReviewPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ReviewWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { product: { name: { contains: search, mode: "insensitive" } } },
      { product: { slug: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.review.findMany({
      where,
      include: ADMIN_REVIEW_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_REVIEWS_PAGE_SIZE,
      take: ADMIN_REVIEWS_PAGE_SIZE,
    }),
    db.review.count({ where }),
  ]);

  return {
    reviews: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_REVIEWS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_REVIEWS_PAGE_SIZE)),
  };
}

export type AdminReviewDetail = AdminReviewListItem & { body: string };

export async function getAdminReviewById(id: string): Promise<AdminReviewDetail | null> {
  const r = await db.review.findUnique({ where: { id }, include: ADMIN_REVIEW_LIST_INCLUDE });
  if (!r) return null;
  return { ...toListItem(r), body: r.body };
}
