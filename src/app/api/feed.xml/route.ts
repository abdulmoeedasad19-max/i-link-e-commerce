import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { getAllProducts } from "@/lib/products-repository";

// 1-hour revalidation matches the sitemap architecture
export const revalidate = 3600;

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function GET() {
  try {
    const products = await getAllProducts();

    const itemsXml = products.map((product) => {
      // Basic info
      const id = escapeXml(product.id);
      const title = escapeXml(product.name);
      const description = escapeXml(product.description);
      const link = escapeXml(`${siteConfig.url}/product/${product.slug}`);

      // Images
      // `product.image` safely falls back to the primary image or category placeholder
      const primaryImageLink = product.image ? `\n      <g:image_link>${escapeXml(resolveImageUrl(product.image))}</g:image_link>` : "";

      const additionalImages = product.images
        .filter((img) => img.url !== product.image)
        .slice(0, 10) // Google Merchant allows up to 10 additional images
        .map((img) => `\n      <g:additional_image_link>${escapeXml(resolveImageUrl(img.url))}</g:additional_image_link>`)
        .join("");

      // Availability & Price
      const availability = product.stock > 0 ? "in_stock" : "out_of_stock";
      const price = `<g:price>${product.price.toFixed(2)} PKR</g:price>`;

      // Identifiers & Attributes
      const brand = product.brand ? `\n      <g:brand>${escapeXml(product.brand)}</g:brand>` : "";
      const productType = product.category ? `\n      <g:product_type>${escapeXml(product.category)}</g:product_type>` : "";
      
      // GTIN/MPN logic: If SKU exists, emit as MPN and set identifier_exists to yes.
      // If missing, explicitly tell Google it doesn't exist so it isn't penalized.
      const mpn = product.sku ? `\n      <g:mpn>${escapeXml(product.sku)}</g:mpn>` : "";
      const identifierExists = product.sku ? `\n      <g:identifier_exists>yes</g:identifier_exists>` : `\n      <g:identifier_exists>no</g:identifier_exists>`;

      return `    <item>
      <g:id>${id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>${primaryImageLink}${additionalImages}
      <g:availability>${availability}</g:availability>
      ${price}
      <g:condition>new</g:condition>${brand}${mpn}${identifierExists}${productType}
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(siteConfig.name)} - Product Feed</title>
    <link>${escapeXml(siteConfig.url)}</link>
    <description>Authorized reseller for genuine laptops, desktop PCs, networking, CCTV and enterprise IT in Pakistan.</description>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        // Enforce caching at the CDN/Edge level as well as Next.js
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to generate Google Merchant Center feed:", error);
    // Don't leak stack traces in the XML
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
