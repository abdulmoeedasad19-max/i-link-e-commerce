import Skeleton from "@/components/ui/skeleton";

// Phase 4.4.27 — matches ProductCard's exact box structure (aspect-square
// image, then a p-4 sm:p-5 content block with badge/title/brand/price
// rows) so the real grid never jumps when its data arrives.
export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-light-gray bg-white premium-shadow">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2.5 p-4 sm:p-5">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
