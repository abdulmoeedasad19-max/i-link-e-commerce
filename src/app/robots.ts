import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Cart and wishlist are per-visitor, client-rendered pages with no
      // generic indexable content — disallowed outright since they can't
      // carry their own noindex metadata (they're Client Components).
      // /search and /business/quotation are intentionally left crawlable
      // and rely on their own per-page `noindex` metadata instead, since
      // combining Disallow with noindex would stop crawlers from ever
      // seeing that directive.
      disallow: ["/cart", "/wishlist"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
