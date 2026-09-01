import Skeleton from "@/components/ui/skeleton";

const COLUMN_WIDTHS = ["w-20", "w-28", "w-16", "w-10", "w-16", "w-20", "w-16", "w-14"];

export default function AdminOrdersLoading() {
  return (
    <div role="status" aria-label="Loading orders">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-light-gray bg-white p-4 premium-shadow sm:p-5">
        <div className="flex flex-wrap items-end gap-3">
          <Skeleton className="h-10 min-w-[240px] flex-1 rounded-[10px]" />
          <Skeleton className="h-10 w-40 rounded-[10px]" />
          <Skeleton className="h-10 w-40 rounded-[10px]" />
          <Skeleton className="h-10 w-40 rounded-[10px]" />
          <Skeleton className="h-10 w-20 rounded-[10px]" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-light-gray bg-white premium-shadow">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-light-gray">
                {COLUMN_WIDTHS.map((w, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className={`h-3 ${w}`} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-light-gray">
              {Array.from({ length: 8 }).map((_, row) => (
                <tr key={row}>
                  {COLUMN_WIDTHS.map((w, col) => (
                    <td key={col} className="px-4 py-3">
                      <Skeleton className={`h-4 ${w}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
