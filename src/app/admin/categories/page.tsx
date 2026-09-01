import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, Plus, Search as SearchIcon } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCategories } from "@/lib/admin/categories";
import CategoryRowActions from "@/components/admin/categories/category-row-actions";

export const metadata: Metadata = {
  title: "Categories",
};

type CategoriesPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminCategoriesPage({ searchParams }: CategoriesPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const { categories, totalCount, totalPages } = await getAdminCategories({ search, page });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Categories</h1>
          <p className="mt-1 text-sm text-slate">
            {totalCount} categor{totalCount === 1 ? "y" : "ies"} in the catalog.
          </p>
        </div>
        <Button href="/admin/categories/new" variant="primary" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Category
        </Button>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1">
            <label htmlFor="category-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="category-search"
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
              <Button href="/admin/categories" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <LayoutGrid className="h-7 w-7" aria-hidden="true" />
            </span>
            {search ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No categories match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try a different search term.</p>
                <div className="mt-6">
                  <Button href="/admin/categories" variant="secondary" size="md">
                    Clear search
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No categories found</h3>
                <p className="mt-2 text-sm text-slate">Get started by adding your first category.</p>
                <div className="mt-6">
                  <Button href="/admin/categories/new" variant="primary" size="md">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Category
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Tier
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
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.image}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-light-gray object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-light-gray text-slate">
                            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{category.name}</p>
                          <p className="truncate text-xs text-slate">{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{category.tier}</td>
                    <td className="px-4 py-3 text-slate">
                      {category.productCount} product{category.productCount === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryRowActions id={category.id} name={category.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Category pages" className="mt-6 flex items-center justify-center gap-2">
          <Link
            href={`/admin/categories?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(Math.max(1, page - 1)) })}`}
            aria-disabled={page <= 1}
            className={`rounded-lg border border-light-gray px-3 py-2 text-sm font-medium text-navy transition-colors hover:bg-soft-gray ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </Link>
          <span className="px-2 text-sm text-slate">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/categories?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(Math.min(totalPages, page + 1)) })}`}
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
