import type { ContactMessageStatus } from "@/generated/prisma/enums";

export const contactMessageStatusLabel: Record<ContactMessageStatus, string> = {
  NEW: "New",
  READ: "Read",
  RESOLVED: "Resolved",
};

export const contactMessageStatusVariant: Record<ContactMessageStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  NEW: "gold",
  READ: "royal",
  RESOLVED: "success",
};
