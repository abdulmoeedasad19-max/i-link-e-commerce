import Container from "@/components/ui/container";
import Skeleton from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="py-16 sm:py-20" role="status" aria-label="Loading checkout">
      <Container>
        <Skeleton className="h-8 w-40" />

        <div className="mx-auto mt-10 max-w-2xl space-y-6">
          {/* Address selection */}
          <div className="rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
            <Skeleton className="h-4 w-32" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </div>

          {/* Order summary / line items */}
          <div className="rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
            <Skeleton className="h-4 w-28" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2 border-t border-light-gray pt-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3.5 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>

          {/* Payment method + submit */}
          <div className="rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
            <Skeleton className="h-4 w-36" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
            <Skeleton className="mt-6 h-12 w-full rounded-[10px]" />
          </div>
        </div>
      </Container>
    </div>
  );
}
