import type { Metadata } from "next";
import Link from "next/link";
import { Search as SearchIcon, Users } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCustomers, type AdminCustomerRoleFilter } from "@/lib/admin/customers";

export const metadata: Metadata = {
  title: "Customers",
};

type CustomersPageProps = {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
};

const ROLE_OPTIONS: { value: AdminCustomerRoleFilter; label: string }[] = [
  { value: "ALL", label: "All roles" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "ADMIN", label: "Admin" },
];

const ROLE_BADGE_VARIANT: Record<"CUSTOMER" | "ADMIN", "navy" | "royal"> = {
  CUSTOMER: "navy",
  ADMIN: "royal",
};

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/customers?${qs}` : "/admin/customers";
}

export default async function AdminCustomersPage({ searchParams }: CustomersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const role = (params.role as AdminCustomerRoleFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { customers, totalCount, totalPages } = await getAdminCustomers({ search, role, page });

  const hasFilters = Boolean(search || role !== "ALL");
  const filterParams = { q: search || undefined, role: role !== "ALL" ? role : undefined };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Customers</h1>
        <p className="mt-1 text-sm text-slate">
          {totalCount} account{totalCount === 1 ? "" : "s"} registered.
        </p>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <label htmlFor="customer-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="customer-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, email or phone…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customer-role-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Role
            </label>
            <select
              id="customer-role-filter"
              name="role"
              defaultValue={role}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {hasFilters && (
              <Button href="/admin/customers" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Users className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No customers match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/customers" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No customers yet</h3>
                <p className="mt-2 text-sm text-slate">Registered accounts will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Phone
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Joined
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Orders
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Quotations
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Addresses
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{customer.name || "—"}</p>
                      <p className="text-xs text-slate">{customer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate">{customer.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_BADGE_VARIANT[customer.role]}>{customer.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {customer.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate">{customer.orderCount}</td>
                    <td className="px-4 py-3 text-slate">{customer.quotationCount}</td>
                    <td className="px-4 py-3 text-slate">{customer.addressCount}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-sm font-semibold text-royal hover:text-royal-600"
                      >
                        View
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
        <nav aria-label="Customer pages" className="mt-6 flex items-center justify-center gap-2">
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
