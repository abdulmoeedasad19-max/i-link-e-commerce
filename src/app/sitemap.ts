import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getAllProducts } from "@/lib/products-repository";
import { getAllCategories } from "@/lib/categories-repository";
import { getAllBrands } from "@/lib/brands-repository";
import { getPublishedPostSlugs } from "@/lib/blog-repository";

// sitemap.js is cached by default (no Request-time API is used below), so
// without this a newly created/activated product would only appear in
// /sitemap.xml after the next deployment, not the next database write. One
// hour balances product-discovery freshness against database load — the
// same tradeoff src/app/(storefront)/page.tsx already makes with its own
// `revalidate = 60` for a much higher-traffic route.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/business`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.7 },
    // Phase 4.4.21 — public informational pages that repair previously
    // broken footer links. All are static, non-personalized content, so
    // they're safe to index and change infrequently.
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/returns`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/shipping`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/support`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/track-order`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/brands`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/stores`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/careers`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/business/tenders`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/business/credit`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/business/deployment`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/policies/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/policies/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/policies/warranty`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/policies/refunds`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Phase 4.4.24 — every real (database) category, automatically. The
  // broader mega-menu taxonomy still includes a handful of slugs with no
  // Category row yet (e.g. "Servers"), which correctly stay out of the
  // sitemap until an admin actually creates that category.
  const categoryRoutes: MetadataRoute.Sitemap = (await getAllCategories()).map((category) => ({
    url: `${base}${category.href}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productRoutes: MetadataRoute.Sitemap = (await getAllProducts()).map((product) => ({
    url: `${base}/product/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const brandRoutes: MetadataRoute.Sitemap = (await getAllBrands()).map((brand) => ({
    url: `${base}/brands/${brand.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = (await getPublishedPostSlugs()).map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  // Intentionally excluded: /cart, /wishlist, /login, /signup, /search,
  // /business/quotation — private, user-specific, or noindexed pages that
  // don't belong in a sitemap.
  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes, ...blogRoutes];
}
