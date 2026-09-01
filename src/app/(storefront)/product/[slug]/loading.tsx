import Container from "@/components/ui/container";
import Skeleton from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="py-16 sm:py-20" role="status" aria-label="Loading product">
      <Container>
        <div className="mb-8 flex items-center gap-2">
          <Skeleton className="h-3.5 w-10" />
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-3.5 rounded-full" />
          <Skeleton className="h-3.5 w-32" />
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Matches ProductImageGallery's own aspect-[3/4] main image
              exactly — a mismatched skeleton shape would visibly jump
              the instant the real image replaces it. */}
          <Skeleton className="aspect-[3/4] w-full rounded-2xl" />

          <div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="mt-4 h-8 w-full max-w-sm" />
            <Skeleton className="mt-1.5 h-4 w-24" />
            <Skeleton className="mt-5 h-9 w-32" />
            <Skeleton className="mt-3 h-4 w-40" />
            <Skeleton className="mt-6 h-20 w-full rounded-xl" />
            <Skeleton className="mt-6 h-12 w-full rounded-[10px]" />
          </div>
        </div>

        <div className="mt-16">
          <div className="flex gap-8 border-b border-light-gray pb-3.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="mt-8 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Container>
    </div>
  );
}
