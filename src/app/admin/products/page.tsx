import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Plus, Search as SearchIcon, Star } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import {
  getAdminBrandOptions,
  getAdminCategoryOptions,
  getAdminProducts,
  type AdminProductStatusFilter,
  type AdminProductStockFilter,
} from "@/lib/admin/products";
import ProductStatusBadge from "@/components/admin/products/product-status-badge";
import ProductRowActions from "@/components/admin/products/product-row-actions";

export const metadata: Metadata = {
  title: "Products",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    category?: string;
    brand?: string;
    stock?: string;
    page?: string;
  }>;
};

const STATUS_OPTIONS: { value: AdminProductStatusFilter; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

const STOCK_OPTIONS: { value: AdminProductStockFilter; label: string }[] = [
  { value: "ALL", label: "All stock" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
];

function buildPageHref(params: Record<string, string | undefined>, page: number): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) usp.set(key, value);
  }
  if (page > 1) usp.set("page", String(page));
  const qs = usp.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const status = (params.status as AdminProductStatusFilter) || "ALL";
  const categoryId = params.category || "";
  const brandId = params.brand || "";
  const stock = (params.stock as AdminProductStockFilter) || "ALL";
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [{ products, totalCount, totalPages }, categories, brands] = await Promise.all([
    getAdminProducts({ search, status, categoryId, brandId, stock, page }),
    getAdminCategoryOptions(),
    getAdminBrandOptions(),
  ]);

  const hasFilters = Boolean(search || (status && status !== "ALL") || categoryId || brandId || (stock && stock !== "ALL"));
  const filterParams = { q: search || undefined, status: status !== "ALL" ? status : undefined, category: categoryId || undefined, brand: brandId || undefined, stock: stock !== "ALL" ? stock : undefined };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Products</h1>
          <p className="mt-1 text-sm text-slate">
            {totalCount} product{totalCount === 1 ? "" : "s"} in the catalog.
          </p>
        </div>
        <Button href="/admin/products/new" variant="primary" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Product
        </Button>
      </div>

      <Card hover={false} className="mt-6 p-4 sm:p-5">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="product-search" className="mb-1.5 block text-xs font-semibold text-slate">
              Search
            </label>
            <div className="relative">
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
                aria-hidden="true"
              />
              <input
                id="product-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Name, SKU, slug, brand, category…"
                className="w-full rounded-[10px] border border-light-gray bg-white py-2.5 pl-9 pr-3 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-status-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Status
            </label>
            <select
              id="product-status-filter"
              name="status"
              defaultValue={status}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product-category-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Category
            </label>
            <select
              id="product-category-filter"
              name="category"
              defaultValue={categoryId}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product-brand-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Brand
            </label>
            <select
              id="product-brand-filter"
              name="brand"
              defaultValue={brandId}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="product-stock-filter" className="mb-1.5 block text-xs font-semibold text-slate">
              Stock
            </label>
            <select
              id="product-stock-filter"
              name="stock"
              defaultValue={stock}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15"
            >
              {STOCK_OPTIONS.map((opt) => (
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
              <Button href="/admin/products" variant="ghost" size="sm">
                Clear
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {products.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <PackageSearch className="h-7 w-7" aria-hidden="true" />
            </span>
            {hasFilters ? (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No products match your search.</h3>
                <p className="mt-2 text-sm text-slate">Try adjusting or clearing your filters.</p>
                <div className="mt-6">
                  <Button href="/admin/products" variant="secondary" size="md">
                    Clear filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-lg font-bold text-navy">No products found</h3>
                <p className="mt-2 text-sm text-slate">Get started by adding your first product.</p>
                <div className="mt-6">
                  <Button href="/admin/products/new" variant="primary" size="md">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add Product
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3">
                    SKU
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Brand
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Stock
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Featured
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          // Admin-entered image paths are arbitrary local strings,
                          // not vetted against next/image's remotePatterns — a
                          // plain <img> avoids a hard crash on an unexpected path.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.image}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-light-gray object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-light-gray text-slate">
                            <PackageSearch className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{product.name}</p>
                          <p className="truncate text-xs text-slate">{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{product.sku ?? "—"}</td>
                    <td className="px-4 py-3 text-slate">{product.categoryName}</td>
                    <td className="px-4 py-3 text-slate">{product.brandName ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3">
                      <span className={product.stock > 0 ? "text-success" : "font-semibold text-error"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ProductStatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      {product.featured ? (
                        <Star className="h-4 w-4 fill-gold text-gold" aria-label="Featured" />
                      ) : (
                        <span className="text-slate" aria-label="Not featured">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ProductRowActions id={product.id} name={product.name} status={product.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <nav aria-label="Product pages" className="mt-6 flex items-center justify-center gap-2">
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
