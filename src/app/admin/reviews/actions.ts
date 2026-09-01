"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { reviewStatusLabel } from "@/lib/review-status";
import { ALLOWED_REVIEW_TRANSITIONS } from "@/lib/admin/review-transitions";
import { logActivity } from "@/lib/admin/activity-log";
import type { ReviewStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: readonly ReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

// See src/app/admin/orders/actions.ts for the full rationale.
class RaceLostError extends Error {}

export type UpdateReviewStatusResult = { error?: string };

export async function updateReviewStatus(
  reviewId: string,
  currentReviewStatus: ReviewStatus,
  nextReviewStatus: ReviewStatus,
): Promise<UpdateReviewStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // three real enum values" — this rejects any forged/typo'd value before
  // it ever reaches a query.
  if (!VALID_STATUSES.includes(nextReviewStatus)) {
    return { error: "Invalid review status." };
  }
  if (!VALID_STATUSES.includes(currentReviewStatus)) {
    return { error: "Invalid review status." };
  }

  const review = await db.review.findUnique({ where: { id: reviewId }, select: { status: true } });
  if (!review) {
    return { error: "This review no longer exists." };
  }

  const allowed = ALLOWED_REVIEW_TRANSITIONS[review.status] ?? [];
  if (!allowed.includes(nextReviewStatus)) {
    return {
      error: `This review can't be moved from ${reviewStatusLabel[review.status]} to ${reviewStatusLabel[nextReviewStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring the exact conditional-update pattern already
    // established for order/quotation/payment status: the WHERE clause
    // re-checks the expected current status at the moment of the write, not
    // just at the read above. Only `status` is ever written here — rating,
    // title, body, verifiedPurchase, and every other field stay untouched.
    await db.$transaction(async (tx) => {
      const result = await tx.review.updateMany({
        where: { id: reviewId, status: review.status },
        data: { status: nextReviewStatus },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "REVIEW",
        entityId: reviewId,
        description:
          nextReviewStatus === "APPROVED"
            ? "Approved product review"
            : nextReviewStatus === "REJECTED"
              ? "Rejected product review"
              : `Changed review status from ${reviewStatusLabel[review.status]} to ${reviewStatusLabel[nextReviewStatus]}`,
        metadata: { from: review.status, to: nextReviewStatus },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This review's status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/reviews/${reviewId}`);
  return {};
}
