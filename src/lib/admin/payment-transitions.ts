// Phase 4.4.3 payment-status transition policy — mirrors the exact
// structure of src/lib/admin/order-transitions.ts: shared between the
// server action (src/app/admin/orders/actions.ts, which enforces it) and
// the client payment-status control (which uses it only to decide what
// options to show; the server never trusts the client's idea of what's
// allowed).
//
// PaymentStatus is a fully independent state machine from OrderStatus —
// changing one never changes the other. Confirmed by inspection: nothing
// anywhere in the project reads or writes paymentStatus before this phase
// (it has stayed PENDING on every order since Phase 2 Step 13, with no
// gateway to move it). Policy, based on the actual meaning of each value:
//
//   PENDING  -> PAID, FAILED     Payment was collected (COD handed over,
//                                 bank transfer confirmed), or a payment
//                                 attempt didn't come through (COD refused
//                                 at the door, bank transfer never arrived).
//   PAID     -> REFUNDED         Money was given back after having actually
//                                 been received.
//   FAILED   -> PENDING, PAID    A failed attempt can be retried: back to
//                                 PENDING for a fresh attempt, or straight
//                                 to PAID if payment is confirmed to have
//                                 come through after all.
//   REFUNDED -> (terminal)       Once refunded, this is final bookkeeping —
//                                 the same terminal treatment already given
//                                 to OrderStatus's CANCELLED/DELIVERED.
//
// Deliberately NOT allowed, despite being enum-technically reachable:
//   PENDING -> REFUNDED   There is nothing to refund until something was
//                          actually paid — REFUNDED is only reachable from
//                          PAID.
//   PAID -> FAILED        Once marked paid, "failed" no longer describes
//                          reality; REFUNDED is the correct path if a PAID
//                          marking needs to be reversed.
//   REFUNDED -> anything  Terminal, matching the OrderStatus precedent.
import type { PaymentStatus } from "@/generated/prisma/enums";

export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: ["PENDING", "PAID"],
  REFUNDED: [],
};
