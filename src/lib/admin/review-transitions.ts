// Phase 4.4.5 review-moderation transition policy — mirrors the exact
// structure of order-transitions.ts / quotation-transitions.ts /
// payment-transitions.ts: shared between the server action
// (src/app/admin/reviews/actions.ts, which enforces it) and the client
// status control (which uses it only to decide what options to show; the
// server never trusts the client's idea of what's allowed).
//
// Authorized policy — deliberately NOT the "always terminal" pattern used
// by Order/Quotation/Coupon: a review's moderation status is an ongoing
// content decision, not a one-way business transaction, so APPROVED and
// REJECTED are each reachable from the other. Only PENDING is never
// returned to once left.
//
//   PENDING  -> APPROVED, REJECTED
//   APPROVED -> REJECTED
//   REJECTED -> APPROVED
//
// No same-state "transition" is ever valid (APPROVED -> APPROVED, etc.) —
// absent from every list below, so the action's allowed.includes() check
// rejects it the same way it rejects any other unlisted pair.
import type { ReviewStatus } from "@/generated/prisma/enums";

export const ALLOWED_REVIEW_TRANSITIONS: Record<ReviewStatus, ReviewStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["REJECTED"],
  REJECTED: ["APPROVED"],
};
