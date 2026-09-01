import type { ReviewStatus } from "@/generated/prisma/enums";

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const reviewStatusVariant: Record<ReviewStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  PENDING: "gold",
  APPROVED: "success",
  REJECTED: "error",
};
