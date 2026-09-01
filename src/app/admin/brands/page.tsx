import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search as SearchIcon, Tags } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBrands } from "@/lib/admin/brands";
import BrandRowActions from "@/components/admin/brands/brand-row-actions";

export const metadata: Metadata = {
  title: "Brands",
};

type BrandsPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminBrandsPage({ searchParams }: BrandsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { brands, totalCount, totalPages } = await getAdminBrands({ search, page });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Brands</h1>
          <p className="mt-1 text-sm text-slate">
            {totalCount} brand{totalCount === 1 ? "" : "s"} in the catalog.
          </p>
        </div>
        <Button href="/admin/brands/new" variant="primary" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Brand
        </Button>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label htmlFor="brand-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="brand-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name or slug…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm">
              Apply
            </Button>
            {search && (
              <Button href="/admin/brands" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {brands.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Tags className="h-7 w-7" aria-hidden="true" />
            </span>
            {search ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No brands match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try a different search term.</p>
                <div className="mt-6">
                  <Button href="/admin/brands" variant="secondary" size="md">
                    Clear search
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No brands found</h3>
                <p className="mt-2 text-sm text-slate">Get started by adding your first brand.</p>
                <div className="mt-6">
                  <Button href="/admin/brands/new" variant="primary" size="md">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Brand
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Brand
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Products
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {brand.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.logoUrl}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-light-gray bg-soft-gray object-contain p-1.5"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-light-gray text-slate">
                            <Tags className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{brand.name}</p>
                          <p className="truncate text-xs text-slate">{brand.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">
                      {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">
                      <BrandRowActions id={brand.id} name={brand.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Brand pages" className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={`/admin/brands?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(Math.max(1, page - 1)) })}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <span className="px-2 text-sm text-slate">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/brands?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(Math.min(totalPages, page + 1)) })}`}
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
