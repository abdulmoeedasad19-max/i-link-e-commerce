// Phase 4.4.9 contact-message triage transition policy — mirrors the exact
// structure of review-transitions.ts: shared between the server action
// (src/app/admin/contact/actions.ts, which enforces it) and the client
// status control (which uses it only to decide what options to show; the
// server never trusts the client's idea of what's allowed).
//
// Authorized policy — deliberately NOT the "always terminal" pattern used
// by Order/Quotation/Coupon: a contact message's triage status is an
// ongoing inbox decision, not a one-way business transaction, so READ and
// RESOLVED are each reachable from the other (an admin can reopen a
// resolved message). Only NEW is never returned to once left — there is no
// "un-receive" action.
//
//   NEW      -> READ, RESOLVED
//   READ     -> RESOLVED
//   RESOLVED -> READ
//
// No same-state "transition" is ever valid (RESOLVED -> RESOLVED, etc.) —
// absent from every list below, so the action's allowed.includes() check
// rejects it the same way it rejects any other unlisted pair.
import type { ContactMessageStatus } from "@/generated/prisma/enums";

export const ALLOWED_CONTACT_MESSAGE_TRANSITIONS: Record<ContactMessageStatus, ContactMessageStatus[]> = {
  NEW: ["READ", "RESOLVED"],
  READ: ["RESOLVED"],
  RESOLVED: ["READ"],
};
