import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { getAdminReviewById } from "@/lib/admin/reviews";
import { requireAdmin } from "@/lib/admin/require-admin";
import ReviewStatusControl from "@/components/admin/reviews/review-status-control";

export const metadata: Metadata = {
  title: "Review Details",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-lg font-semibold text-navy" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-light-gray">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const review = await getAdminReviewById(id);

  if (!review) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/reviews"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Reviews
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy">Review for {review.productName}</h1>
        <p className="mt-1 text-sm text-slate">
          Submitted{" "}
          {review.createdAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Product</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{review.productName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Slug</dt>
                <dd className="font-mono text-xs font-semibold text-navy">{review.productSlug}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Customer</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{review.customerName || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{review.customerEmail}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Verified Purchase</dt>
                <dd>
                  {review.verifiedPurchase ? (
                    <Badge variant="success">Verified</Badge>
                  ) : (
                    <span className="text-sm text-slate">Not verified</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Review</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Rating</dt>
                <dd className="mt-1">
                  <Stars rating={review.rating} />
                </dd>
              </div>
              {review.title && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Title</dt>
                  <dd className="mt-1 font-semibold text-navy">{review.title}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Body</dt>
                <dd className="mt-1 whitespace-pre-wrap text-navy">{review.body}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Moderation Status</h2>
            <div className="mt-4">
              <ReviewStatusControl reviewId={review.id} status={review.status} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
