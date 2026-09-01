import Badge from "@/components/ui/badge";
import type { ProductStatus } from "@/generated/prisma/enums";

const STATUS_CONFIG: Record<ProductStatus, { label: string; variant: "success" | "gold" | "error" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  DRAFT: { label: "Draft", variant: "gold" },
  ARCHIVED: { label: "Archived", variant: "error" },
};

export default function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
