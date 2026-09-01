"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProductBySlug } from "@/lib/products-repository";
import { Prisma } from "@/generated/prisma/client";
import { consumeRateLimit, rateLimitMessage } from "@/lib/rate-limit";

// Phase 4.4.26 — keyed by the authenticated userId (authoritative, not
// spoofable) rather than IP, since this action is already auth-gated
// below. The existing @@unique([productId, userId]) constraint already
// stops exact duplicate-product spam; this caps overall review-writing
// throughput per account.
const REVIEW_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 10 };

const reviewSchema = z.object({
  rating: z.coerce
    .number()
    .int("Rating must be a whole number.")
    .min(1, "Please select a rating.")
    .max(5, "Rating must be between 1 and 5."),
  title: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.string().trim().max(120, "Title is too long.").optional(),
  ),
  body: z.string().trim().min(1, "Please write a review.").max(2000, "Review is too long."),
});

type ReviewFormField = "rating" | "title" | "body" | "form";

export type SubmitReviewState = {
  errors?: Partial<Record<ReviewFormField, string>>;
  success?: boolean;
};

/**
 * Requires authentication — guest reviews are not allowed (see the Phase
 * 4.4.5 audit). productSlug arrives as a hidden form field, matching this
 * project's established convention (product-form.tsx, coupon-form.tsx) of
 * threading identity through the form rather than a bound argument.
 * userId, verifiedPurchase, and status are never accepted from the client
 * — all three are derived or computed entirely server-side below.
 */
export async function submitReview(_prevState: SubmitReviewState, formData: FormData): Promise<SubmitReviewState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { form: "You must be logged in to write a review." } };
  }
  const userId = session.user.id;

  const rateLimit = await consumeRateLimit(`review:${userId}`, REVIEW_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { errors: { form: rateLimitMessage(rateLimit.retryAfterMs) } };
  }

  const productSlug = String(formData.get("productSlug") ?? "");
  if (!productSlug) {
    return { errors: { form: "Missing product." } };
  }

  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    const errors: SubmitReviewState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as ReviewFormField] = issue.message;
      }
    }
    return { errors };
  }
  const data = parsed.data;

  // Resolve the product server-side — never trust a client-supplied
  // productId. Uses the exact same ACTIVE-only repository the product page
  // itself renders from, so a review can never be attached to a
  // draft/archived/nonexistent product.
  const product = await getProductBySlug(productSlug);
  if (!product) {
    return { errors: { form: "This product is no longer available." } };
  }

  // Friendly application-level pre-check — not the sole protection. The
  // database's @@unique([productId, userId]) constraint (caught below via
  // P2002) is the final, race-safe guarantee; this just avoids showing a
  // raw constraint error in the common, non-racing case.
  const existing = await db.review.findUnique({
    where: { productId_userId: { productId: product.id, userId } },
    select: { id: true },
  });
  if (existing) {
    return { errors: { form: "You've already reviewed this product." } };
  }

  // verifiedPurchase is computed entirely server-side from the customer's
  // real order history and stored once, at creation — never accepted from
  // the client, never recomputed later. CONFIRMED/SHIPPED/DELIVERED count
  // as evidence of purchase; PENDING (not yet confirmed) and CANCELLED
  // (voided) do not. PaymentStatus is deliberately not used as the
  // condition — this store has no gateway, so nothing ever moves
  // paymentStatus off PENDING regardless of whether COD/bank transfer
  // actually happened.
  const qualifyingOrder = await db.order.findFirst({
    where: {
      userId,
      status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] },
      items: { some: { productSlug: product.slug } },
    },
    select: { id: true },
  });

  try {
    await db.review.create({
      data: {
        productId: product.id,
        userId,
        rating: data.rating,
        title: data.title ?? null,
        body: data.body,
        status: "PENDING",
        verifiedPurchase: Boolean(qualifyingOrder),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { errors: { form: "You've already reviewed this product." } };
    }
    console.error("[product/actions] submitReview failed:", err);
    return { errors: { form: "Unable to submit your review. Please try again." } };
  }

  return { success: true };
}
