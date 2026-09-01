// Phase 4.3.5 status-transition policy — shared between the server action
// (src/app/admin/orders/actions.ts, which enforces it) and the client
// status control (which uses it only to decide what options to show; the
// server never trusts the client's idea of what's allowed). A "use server"
// file may only export async functions, so this constant can't live in
// actions.ts itself without duplicating it — this is the one shared source.
//
// No admin transition policy existed anywhere in the project before this
// phase (only the customer's own PENDING-only self-cancellation rule in
// src/app/(storefront)/account/orders/[id]/actions.ts, untouched by this
// file). Policy:
//
//   PENDING   -> CONFIRMED, CANCELLED
//   CONFIRMED -> SHIPPED, CANCELLED
//   SHIPPED   -> DELIVERED               (no cancel once shipped — nothing
//                                          stops a shipment in transit and
//                                          there is no refund/return system
//                                          to fall back on)
//   DELIVERED -> (terminal)
//   CANCELLED -> (terminal)
import type { OrderStatus } from "@/generated/prisma/enums";

export const ALLOWED_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
