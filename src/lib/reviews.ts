// Phase 4.4.5 — storefront-facing review reads. Mirrors the exact
// ACTIVE-only contract already established by src/lib/products-repository.ts,
// except scoped to APPROVED reviews: this module is the only place the
// storefront reads reviews from, and it can never return a PENDING or
// REJECTED row. No caching, no denormalized rating fields on Product —
// every call computes fresh from the real Review rows.
import "server-only";
import { db } from "@/lib/db";

export type PublicReview = {
  id: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: Date;
};

export async function getApprovedReviewsForProduct(productSlug: string): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { status: "APPROVED", product: { slug: productSlug } },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    reviewerName: r.user.name || "Anonymous",
    rating: r.rating,
    title: r.title,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    createdAt: r.createdAt,
  }));
}

export type ProductRatingSummary = {
  averageRating: number | null;
  reviewCount: number;
};

export async function getProductRatingSummary(productSlug: string): Promise<ProductRatingSummary> {
  const result = await db.review.aggregate({
    where: { status: "APPROVED", product: { slug: productSlug } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: result._avg.rating,
    reviewCount: result._count.rating,
  };
}

/** Regardless of moderation status — an already-submitted PENDING or
 * REJECTED review still counts as "already reviewed" for the purpose of
 * deciding whether to show the submission form again. */
export async function hasUserReviewedProduct(userId: string, productSlug: string): Promise<boolean> {
  const existing = await db.review.findFirst({
    where: { userId, product: { slug: productSlug } },
    select: { id: true },
  });
  return existing !== null;
}
