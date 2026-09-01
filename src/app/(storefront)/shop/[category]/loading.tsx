import Container from "@/components/ui/container";
import Skeleton from "@/components/ui/skeleton";
import ProductCardSkeleton from "@/components/sections/product-card-skeleton";

export default function CategoryLoading() {
  return (
    <div className="py-20 sm:py-24" role="status" aria-label="Loading category">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>

        <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </div>
  );
}
