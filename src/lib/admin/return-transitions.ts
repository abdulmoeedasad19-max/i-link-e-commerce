// Phase 4.4.18 status-transition policy — mirrors the exact structure of
// quotation-transitions.ts/order-transitions.ts/payment-transitions.ts:
// shared between the server action (src/app/admin/returns/actions.ts,
// which enforces it) and the client status control (which uses it only to
// decide what options to show; the server never trusts the client's idea
// of what's allowed).
//
//   PENDING  -> APPROVED, REJECTED
//   APPROVED -> (terminal)
//   REJECTED -> (terminal)
//
// Deliberately both terminal, unlike Review's APPROVED<->REJECTED
// reversibility: a return request is a one-time decision on a specific
// customer request, not an ongoing content-moderation state. Approval
// never refunds, never touches OrderStatus/PaymentStatus, and never
// triggers refundOrder — that remains a fully separate, manually-invoked
// admin action.
import type { ReturnStatus } from "@/generated/prisma/enums";

export const ALLOWED_RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};
