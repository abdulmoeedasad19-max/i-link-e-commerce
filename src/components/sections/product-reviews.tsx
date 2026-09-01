import Link from "next/link";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { getApprovedReviewsForProduct, getProductRatingSummary, hasUserReviewedProduct } from "@/lib/reviews";
import ReviewForm from "@/components/sections/review-form";

function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <span className={`${size} font-semibold text-gold`} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
      <span className="text-light-gray">{"★".repeat(5 - Math.round(rating))}</span>
    </span>
  );
}

/**
 * Self-contained Server Component: resolves auth, fetches only APPROVED
 * reviews (see src/lib/reviews.ts — PENDING/REJECTED content is never
 * reachable from here), and decides whether to show the submission form,
 * an "already reviewed" notice, or a login prompt. ReviewForm itself stays
 * a dumb client component that never touches auth or the database.
 *
 * Deliberately no outer <section>/heading of its own — this now renders
 * directly inside the Reviews tab panel of ProductDetailTabs, which
 * already owns that framing (see product/[slug]/page.tsx).
 */
export default async function ProductReviews({ productSlug }: { productSlug: string }) {
  const [session, summary, reviews] = await Promise.all([
    auth(),
    getProductRatingSummary(productSlug),
    getApprovedReviewsForProduct(productSlug),
  ]);

  const alreadyReviewed = session?.user?.id
    ? await hasUserReviewedProduct(session.user.id, productSlug)
    : false;

  return (
    <div>
      <div className="flex items-center gap-3">
        {summary.reviewCount > 0 && summary.averageRating != null ? (
          <>
            <Stars rating={summary.averageRating} size="text-xl" />
            <span className="text-sm font-semibold text-navy">{summary.averageRating.toFixed(1)} out of 5</span>
            <span className="text-sm text-slate">
              ({summary.reviewCount} review{summary.reviewCount === 1 ? "" : "s"})
            </span>
          </>
        ) : (
          <span className="text-sm text-slate">No reviews yet.</span>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-light-gray py-12 text-center">
              <Star className="h-6 w-6 text-slate" aria-hidden="true" />
              <p className="mt-2 text-sm text-slate">Be the first to review this product.</p>
            </div>
          ) : (
            <ul className="space-y-5">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-light-gray bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars rating={review.rating} />
                    {review.verifiedPurchase && (
                      <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  {review.title && <p className="mt-2.5 font-semibold text-navy">{review.title}</p>}
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate">{review.body}</p>
                  <p className="mt-3 text-xs text-slate/70">
                    {review.reviewerName} &middot;{" "}
                    {review.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="order-1 lg:order-2">
          {!session?.user?.id ? (
            <div className="rounded-2xl border border-light-gray bg-soft-gray px-5 py-6 text-center text-sm text-navy">
              <Link href="/login" className="font-semibold text-royal hover:text-royal-600">
                Log in
              </Link>{" "}
              to write a review.
            </div>
          ) : alreadyReviewed ? (
            <div className="rounded-2xl border border-light-gray bg-soft-gray px-5 py-6 text-center text-sm text-navy">
              You&rsquo;ve already reviewed this product.
            </div>
          ) : (
            <ReviewForm productSlug={productSlug} />
          )}
        </div>
      </div>
    </div>
  );
}
