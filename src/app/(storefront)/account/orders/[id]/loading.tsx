import Skeleton from "@/components/ui/skeleton";

export default function AccountOrderDetailLoading() {
  return (
    <div role="status" aria-label="Loading order details">
      <Skeleton className="h-4 w-32" />

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6 lg:col-span-2">
          <Skeleton className="h-5 w-16" />
          <div className="mt-4 space-y-4 divide-y divide-light-gray">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3.5 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
            <Skeleton className="h-5 w-36" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
