import Skeleton from "@/components/ui/skeleton";

function ListCardSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
      <Skeleton className={`h-4 ${titleWidth}`} />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardLoading() {
  return (
    <div role="status" aria-label="Loading dashboard">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="mt-3 h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <ListCardSkeleton titleWidth="w-28" />
        <ListCardSkeleton titleWidth="w-36" />
        <ListCardSkeleton titleWidth="w-20" />
      </div>
    </div>
  );
}
