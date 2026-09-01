import type { OrderStatus } from "@/generated/prisma/client";

export const orderStatusVariant: Record<OrderStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  PENDING: "gold",
  CONFIRMED: "royal",
  SHIPPED: "navy",
  DELIVERED: "success",
  CANCELLED: "error",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};
