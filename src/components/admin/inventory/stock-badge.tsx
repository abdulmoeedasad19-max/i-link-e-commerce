import Badge from "@/components/ui/badge";
import type { StockClassification } from "@/lib/admin/inventory";

const STOCK_CONFIG: Record<StockClassification, { label: string; variant: "success" | "gold" | "error" }> = {
  IN_STOCK: { label: "In Stock", variant: "success" },
  LOW_STOCK: { label: "Low Stock", variant: "gold" },
  OUT_OF_STOCK: { label: "Out of Stock", variant: "error" },
};

export default function StockBadge({ classification }: { classification: StockClassification }) {
  const config = STOCK_CONFIG[classification];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
