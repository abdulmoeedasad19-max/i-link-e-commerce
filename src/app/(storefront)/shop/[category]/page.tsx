import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ProductCard from "@/components/sections/product-card";
import Pagination from "@/components/ui/pagination";
import { getProductsByCategory } from "@/lib/products-repository";
import { getCategoryBySlug, getAllCategories } from "@/lib/categories-repository";
import { shopMegaMenu, footerLinks, siteConfig } from "@/lib/site-config";
import { safeJsonLd } from "@/lib/utils";

const CATEGORY_PAGE_SIZE = 24;

type CategoryDisplay = {
  name: string;
  description: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

/**
 * Resolves a /shop/[category] slug to a display name + description.
 * Phase 4.4.24 — database-first: any real Category row resolves here
 * automatically, with zero static config needed, which is what lets an
 * admin-created category work on the storefront the moment it's saved.
 * Falls back to the static mega-menu/footer taxonomy only for slugs with
 * no Category row yet (e.g. "Desktop PCs", "Servers" — marketing-only
 * placeholders that intentionally show a "coming soon" empty state, per
 * the pre-existing, documented behavior this preserves exactly).
 */
async function resolveCategory(slug: string): Promise<CategoryDisplay | undefined> {
  const dbCategory = await getCategoryBySlug(slug);
  if (dbCategory) {
    return {
      name: dbCategory.name,
      description: dbCategory.description || `Browse our ${dbCategory.name.toLowerCase()} range.`,
      seoTitle: dbCategory.seoTitle,
      seoDescription: dbCategory.seoDescription,
    };
  }

  const href = `/shop/${slug}`;
  for (const group of shopMegaMenu) {
    if (group.href === href) {
      return { name: group.name, description: `Browse our ${group.name.toLowerCase()} range.` };
    }
    const item = group.items.find((i) => i.href === href);
    if (item) {
      return { name: item.name, description: `Browse our ${item.name.toLowerCase()} range.` };
    }
  }

  const footerItem = footerLinks.products.find((i) => i.href === href);
  if (footerItem) {
    return {
      name: footerItem.name,
      description: `Browse our ${footerItem.name.toLowerCase()} range.`,
    };
  }

  return undefined;
}

async function allKnownCategorySlugs(): Promise<string[]> {
  const slugs = new Set<string>();
  const add = (href: string) => {
    if (href.startsWith("/shop/")) slugs.add(href.replace(/^\/shop\//, ""));
  };

  const dbCategories = await getAllCategories();
  dbCategories.forEach((c) => slugs.add(c.slug));

  shopMegaMenu.forEach((group) => {
    add(group.href);
    group.items.forEach((item) => add(item.href));
  });
  footerLinks.products.forEach((item) => add(item.href));

  return Array.from(slugs);
}

export async function generateStaticParams() {
  const slugs = await allKnownCategorySlugs();
  return slugs.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await resolveCategory(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const parsedPage = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  const page = !isNaN(parsedPage) && parsedPage > 1 ? parsedPage : 1;

  const canonicalPath = page > 1 ? `/shop/${slug}?page=${page}` : `/shop/${slug}`;

  return {
    title: category.seoTitle || category.name,
    description: category.seoDescription || category.description,
    alternates: { canonical: canonicalPath },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category: slug } = await params;
  const category = await resolveCategory(slug);

  if (!category) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  let page = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  if (isNaN(page) || page < 1) page = 1;

  const { products, total } = await getProductsByCategory(slug, page, CATEGORY_PAGE_SIZE);
  
  // Safe bounds handling: If page is beyond available products, cap it at totalPages
  // Wait, if we cap it and query again, that's a second query. Or we just show empty results, 
  // but standard SEO practice for beyond-range is to 404 or just show empty. Let's just show empty 
  // or clamp during UI generation. We queried with `page`. If it returns 0 products but page > 1, 
  // it shows the empty state.
  const totalPages = Math.ceil(total / CATEGORY_PAGE_SIZE);

  const canonicalPath = page > 1 ? `/shop/${slug}?page=${page}` : `/shop/${slug}`;
  const canonicalUrl = `${siteConfig.url}${canonicalPath}`;
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.seoTitle || category.name,
    description: category.seoDescription || category.description,
    url: canonicalUrl,
    ...(products.length > 0 && {
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            name: product.name,
            url: `${siteConfig.url}/product/${product.slug}`,
            image: `${siteConfig.url}${product.image}`,
            ...(product.sku ? { sku: product.sku } : {}),
            ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
            offers: {
              "@type": "Offer",
              url: `${siteConfig.url}/product/${product.slug}`,
              priceCurrency: "PKR",
              price: String(product.price),
              availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              itemCondition: "https://schema.org/NewCondition",
            }
          }
        }))
      }
    })
  };

  return (
    <div className="py-20 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <Container>
        <SectionHeading as="h1" eyebrow="Shop" title={category.name} description={category.description} />

        {products.length > 0 ? (
          <>
            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
            
            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              baseHref={`/shop/${slug}`} 
            />
          </>
        ) : (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <PackageSearch className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">
              More {category.name.toLowerCase()} coming soon
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              We&apos;re adding new products to this category. In the meantime, contact our
              sales team for current availability and pricing.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
