// Phase 4.4.4 — a dedicated, filtered roster of ADMIN-role accounts.
// Deliberately reuses the exact query, action, and detail-page machinery
// Phase 4.3.7 already built for Customers rather than duplicating any of
// it: getAdminCustomers() already supports a role filter, and role
// promotion/demotion (with its self-demotion and last-admin protections)
// already lives entirely on /admin/customers/[id] via CustomerRoleControl.
// This page adds no new query, no new action, and no new role-control
// component — only a fixed-filter list view and a link into the page that
// already does the mutation.
import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCustomers } from "@/lib/admin/customers";

export const metadata: Metadata = {
  title: "Admin Users",
};

type AdminUsersPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/admin-users?${qs}` : "/admin/admin-users";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  // Server-side filter, not a client-side hide of Customer rows — the
  // exact same getAdminCustomers() the Customers page uses, just with role
  // fixed to ADMIN. No role selector is shown since there's nothing to
  // select: this view is ADMIN-only by definition.
  const { customers: admins, totalCount, totalPages } = await getAdminCustomers({ search, role: "ADMIN", page });

  const filterParams = { q: search || undefined };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Admin Users</h1>
        <p className="mt-1 text-sm text-slate">
          {totalCount} administrator account{totalCount === 1 ? "" : "s"}. Role changes are made from a
          customer&rsquo;s own detail page.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="admin-user-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="admin-user-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, email or phone…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {search && (
              <Button href="/admin/admin-users" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {admins.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <ShieldCheck className="h-7 w-7" aria-hidden="true" />
            </span>
            {search ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No admin users match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your search.</p>
                <div className="mt-6">
                  <Button href="/admin/admin-users" variant="secondary" size="md">
                    Clear search
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No admin users</h3>
                <p className="mt-2 text-sm text-slate">
                  Promote a customer to Admin from the Customers page to see them here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Admin
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Admin Since
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {admins.map((admin) => (
                  <tr key={admin.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{admin.name || "—"}</p>
                      <p className="text-xs text-slate">{admin.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">{admin.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="royal">ADMIN</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {admin.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${admin.id}`}
                        className="text-sm font-semibold text-royal hover:text-royal-600"
                      >
                        Manage Role
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Admin user pages" className="mt-6 flex items-center justify-center gap-2">
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
