// Mirrors src/lib/quotation-status.ts's exact shape/location convention.
import type { ReturnStatus } from "@/generated/prisma/client";

export const returnStatusLabel: Record<ReturnStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const returnStatusVariant: Record<ReturnStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  PENDING: "gold",
  APPROVED: "success",
  REJECTED: "error",
};
