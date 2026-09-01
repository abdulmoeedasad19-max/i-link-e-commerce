// Mirrors src/lib/order-status.ts's exact shape/location convention — a
// general-purpose label/variant utility, not admin-specific, even though
// the admin quotation UI is its only consumer today.
import type { QuotationStatus } from "@/generated/prisma/client";

export const quotationStatusLabel: Record<QuotationStatus, string> = {
  PENDING: "Pending",
  REVIEWED: "Reviewed",
  RESPONDED: "Responded",
  CLOSED: "Closed",
};

export const quotationStatusVariant: Record<QuotationStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  PENDING: "gold",
  REVIEWED: "royal",
  RESPONDED: "navy",
  CLOSED: "success",
};
