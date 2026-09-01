// Phase 4.3.6 status-transition policy — no prior policy to inherit, since
// this model (and its admin surface) didn't exist before this phase. A
// "use server" file may only export async functions, so this constant
// lives here rather than in src/app/admin/quotations/actions.ts, shared
// between that file (which enforces it) and the client status control
// (which uses it only to decide what options to show).
//
//   PENDING   -> REVIEWED, CLOSED   (a request can be closed directly —
//                                     e.g. spam/irrelevant — without a
//                                     forced review step)
//   REVIEWED  -> RESPONDED, CLOSED  (admin looked at it; either follows up
//                                     outside the system, or closes it)
//   RESPONDED -> CLOSED             (follow-up done; nothing further to do)
//   CLOSED    -> (terminal)
//
// No pricing, invoicing, or negotiation state is tracked or implied by any
// transition — none of that exists in this schema.
import type { QuotationStatus } from "@/generated/prisma/enums";

export const ALLOWED_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  PENDING: ["REVIEWED", "CLOSED"],
  REVIEWED: ["RESPONDED", "CLOSED"],
  RESPONDED: ["CLOSED"],
  CLOSED: [],
};
