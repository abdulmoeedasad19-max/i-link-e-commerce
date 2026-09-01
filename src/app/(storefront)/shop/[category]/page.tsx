import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ProductCard from "@/components/sections/product-card";
import { getProductsByCategory } from "@/lib/products-repository";
import { getCategoryBySlug, getAllCategories } from "@/lib/categories-repository";
import { shopMegaMenu, footerLinks } from "@/lib/site-config";

type CategoryDisplay = {
  name: string;
  description: string;
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
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await resolveCategory(slug);

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `/shop/${slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await resolveCategory(slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategory(slug);

  return (
    <div className="py-20 sm:py-24">
      <Container>
        <SectionHeading as="h1" eyebrow="Shop" title={category.name} description={category.description} />

        {products.length > 0 ? (
          <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
