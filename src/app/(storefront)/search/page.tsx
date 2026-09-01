import type { Metadata } from "next";
import { Search as SearchIcon, SearchX } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import ProductCard from "@/components/sections/product-card";
import { searchProducts } from "@/lib/products-repository";

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

function resolveQuery(q: string | string[] | undefined): string {
  return (Array.isArray(q) ? q[0] : q ?? "").trim();
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const query = resolveQuery((await searchParams).q);

  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: query
      ? `Products matching "${query}" at i.Link Systems & Solutions.`
      : "Search genuine laptops, PCs, networking gear, CCTV and more from i.Link Systems & Solutions.",
    // Internal search-result URLs shouldn't be indexed individually.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = resolveQuery((await searchParams).q);
  const results = query ? await searchProducts(query) : [];

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Search"
          title="Search Results"
          description={
            query
              ? `Search for: "${query}" — Found ${results.length} product${results.length === 1 ? "" : "s"}.`
              : undefined
          }
          align="left"
          className="mx-0 text-left"
        />

        <form action="/search" method="GET" role="search" className="mt-8 max-w-lg">
          <label htmlFor="search-page-input" className="sr-only">
            Search products
          </label>
          <div className="relative">
            <button
              type="submit"
              aria-label="Submit search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate hover:text-royal"
            >
              <SearchIcon className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
            <input
              id="search-page-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search products, brands, categories…"
              className="w-full rounded-full border border-light-gray bg-soft-gray py-3 pl-11 pr-4 text-sm text-dark-slate placeholder:text-slate/70 outline-none transition-colors focus:border-royal focus:bg-white focus:ring-2 focus:ring-royal/15"
            />
          </div>
        </form>

        {!query ? (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <SearchIcon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">
              Search for products, brands, or categories
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              Try a product name, a brand like &quot;Dell&quot; or &quot;ASUS&quot;, or a category
              like &quot;gaming&quot; or &quot;CCTV&quot;.
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">No products found</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              We couldn&apos;t find anything matching &quot;{query}&quot;. Try a different search
              term.
            </p>
            <div className="mt-6">
              <Button href="/shop" variant="primary" size="md">
                Browse All Products
              </Button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
