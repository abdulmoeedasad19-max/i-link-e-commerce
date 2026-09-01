import type { PaymentMethod, PaymentStatus } from "@/generated/prisma/client";

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  COD: "Cash on Delivery",
  BANK_TRANSFER: "Bank Transfer",
  EASYPAISA: "Easypaisa",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};
