import type { Metadata } from "next";
import Link from "next/link";
import { History, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getAdminActivityLogs,
  getAdminActivityLogEntityTypes,
  type AdminActivityLogActionFilter,
} from "@/lib/admin/activity-log";
import type { ActivityAction } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Activity Log",
};

type ActivityLogPageProps = {
  searchParams: Promise<{ q?: string; action?: string; entityType?: string; page?: string }>;
};

const ACTION_OPTIONS: { value: AdminActivityLogActionFilter; label: string }[] = [
  { value: "ALL", label: "All actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "STATUS_CHANGE", label: "Status change" },
  { value: "ROLE_CHANGE", label: "Role change" },
];

const actionLabel: Record<ActivityAction, string> = {
  CREATE: "Create",
  UPDATE: "Update",
  DELETE: "Delete",
  STATUS_CHANGE: "Status change",
  ROLE_CHANGE: "Role change",
};

const actionVariant: Record<ActivityAction, "royal" | "navy" | "success" | "gold" | "error"> = {
  CREATE: "success",
  UPDATE: "royal",
  DELETE: "error",
  STATUS_CHANGE: "gold",
  ROLE_CHANGE: "navy",
};

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/activity-log?${qs}` : "/admin/activity-log";
}

export default async function AdminActivityLogPage({ searchParams }: ActivityLogPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const action = (params.action as AdminActivityLogActionFilter) || "ALL";
  const entityType = params.entityType?.trim() || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [{ logs, totalCount, totalPages }, entityTypes] = await Promise.all([
    getAdminActivityLogs({ search, action, entityType, page }),
    getAdminActivityLogEntityTypes(),
  ]);

  const hasFilters = Boolean(search || action !== "ALL" || entityType !== "ALL");
  const filterParams = {
    q: search || undefined,
    action: action !== "ALL" ? action : undefined,
    entityType: entityType !== "ALL" ? entityType : undefined,
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Activity Log</h1>
        <p className="mt-1 text-sm text-slate">
          A chronological record of admin actions — {totalCount} event{totalCount === 1 ? "" : "s"} recorded.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="log-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="log-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Description, entity id, admin…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="log-action-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Action
            </label>
            <select
              id="log-action-filter"
              name="action"
              defaultValue={action}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="log-entity-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Entity type
            </label>
            <select
              id="log-entity-filter"
              name="entityType"
              defaultValue={entityType}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              <option value="ALL">All entities</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {hasFilters && (
              <Button href="/admin/activity-log" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <History className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No activity matches your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/activity-log" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No activity yet</h3>
                <p className="mt-2 text-sm text-slate">Admin actions like creating, updating, or changing status will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Date/Time
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Admin
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Action
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Entity
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate">
                      {log.createdAt.toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{log.adminName || "—"}</p>
                      <p className="text-xs text-slate">{log.adminEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={actionVariant[log.action]}>{actionLabel[log.action]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{log.entityType}</p>
                      <p className="max-w-[160px] truncate text-xs text-slate" title={log.entityId}>
                        {log.entityId}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-dark-slate">{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Activity log pages" className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={buildPageHref(filterParams, Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <span className="px-2 text-sm text-slate">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildPageHref(filterParams, Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page >= totalPages ? "pointer-events-none opacity-40" : ""}`}
          >
            Next
          </Link>
        </nav>
      )}
    </div>
  );
}
