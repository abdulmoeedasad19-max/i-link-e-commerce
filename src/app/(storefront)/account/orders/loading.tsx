import Skeleton from "@/components/ui/skeleton";

function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-light-gray pt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-2 h-3 w-40" />
      <div className="mt-4 border-t border-light-gray pt-4">
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default function AccountOrdersLoading() {
  return (
    <div role="status" aria-label="Loading orders">
      <Skeleton className="h-7 w-32" />

      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
