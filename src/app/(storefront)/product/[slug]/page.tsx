import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Container from "@/components/ui/container";
import Badge from "@/components/ui/badge";
import ProductActions from "@/components/sections/product-actions";
import ProductReviews from "@/components/sections/product-reviews";
import ProductImageGallery from "@/components/sections/product-image-gallery";
import ProductDetailTabs from "@/components/sections/product-detail-tabs";
import RelatedProducts from "@/components/sections/related-products";
import { formatPrice, safeJsonLd } from "@/lib/utils";
import { getAllProducts, getProductBySlug, getProductRedirect } from "@/lib/products-repository";
import { getProductRatingSummary } from "@/lib/reviews";
import { siteConfig } from "@/lib/site-config";

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

const META_DESCRIPTION_MAX_LENGTH = 160;

/**
 * Only used as a fallback when no admin-entered seoDescription exists — the
 * full, untruncated `description` still renders on the page itself
 * (ProductDetailTabs below). Backs off to the nearest word boundary rather
 * than cutting mid-word, and drops a trailing dangling punctuation mark
 * left behind by the cut.
 */
function buildFallbackMetaDescription(description: string, maxLength = META_DESCRIPTION_MAX_LENGTH): string {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const atWordBoundary = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return atWordBoundary.replace(/[.,;:!?-]+$/, "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    const redirectSlug = await getProductRedirect(slug);
    if (redirectSlug) {
      permanentRedirect(`/product/${redirectSlug}`);
    }
    return { title: "Product Not Found" };
  }

  const canonicalPath = `/product/${product.slug}`;
  // Admin-entered overrides take priority; every existing product (with
  // neither set) falls back to exactly what this already generated
  // before — byte-for-byte unchanged metadata for the whole catalog
  // until an admin opts in.
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || buildFallbackMetaDescription(product.description);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonicalPath,
      images: [{ url: product.image, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    const redirectSlug = await getProductRedirect(slug);
    if (redirectSlug) {
      permanentRedirect(`/product/${redirectSlug}`);
    }
    notFound();
  }

  const inStock = product.stock > 0;
  const ratingSummary = await getProductRatingSummary(product.slug);

  const canonicalUrl = `${siteConfig.url}/product/${product.slug}`;
  const shopUrl = `${siteConfig.url}/shop`;
  const categoryUrl = `${siteConfig.url}/shop/${product.categorySlug}`;

  // Real product photography only — sorted primary-first, then by the
  // admin-assigned sortOrder. Falls back to the single resolved `image`
  // when no ProductImage rows exist, matching what the page itself renders.
  const sortedImages = [...product.images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const absoluteImages =
    sortedImages.length > 0
      ? sortedImages.map((img) => `${siteConfig.url}${img.url}`)
      : [`${siteConfig.url}${product.image}`];
  // Same data, now actually rendered by ProductImageGallery below — see
  // that component's own comment for why this wasn't true before.
  const galleryImages =
    sortedImages.length > 0
      ? sortedImages.map((img) => ({ url: img.url, altText: img.altText }))
      : [{ url: product.image, altText: product.name }];

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: absoluteImages,
    url: canonicalUrl,
    category: product.category,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    ...(product.tags.length > 0 ? { keywords: product.tags.join(", ") } : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: "PKR",
      price: String(product.price),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      // Every product sold here is new, genuine retail stock — never used
      // or refurbished — so this is a fixed fact of the catalog, not a
      // per-product admin field.
      itemCondition: "https://schema.org/NewCondition",
    },
    // Sourced from src/lib/reviews.ts, which scopes every read to
    // status: "APPROVED" — never PENDING or REJECTED — and this is the
    // exact same summary rendered in <ProductReviews>. Omitted entirely
    // when there are no approved reviews rather than asserting a rating.
    ...(ratingSummary.reviewCount > 0 && ratingSummary.averageRating != null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(ratingSummary.averageRating.toFixed(1)),
            reviewCount: ratingSummary.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: shopUrl },
      { "@type": "ListItem", position: 2, name: product.category, item: categoryUrl },
      { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <div className="py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <Container>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate">
          <Link href="/shop" className="hover:text-royal">
            Shop
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link href={`/shop/${product.categorySlug}`} className="hover:text-royal">
            {product.category}
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-navy">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <ProductImageGallery images={galleryImages} productName={product.name} inStock={inStock} />

          <div>
            <Badge variant="royal">{product.category}</Badge>
            <h1 className="mt-4 text-2xl font-bold text-navy sm:text-3xl">{product.name}</h1>
            <p className="mt-1.5 text-sm font-medium text-slate">Brand: {product.brand}</p>

            <div className="mt-5 flex flex-wrap items-baseline gap-2.5">
              <p className="text-3xl font-bold text-navy">{formatPrice(product.price)}</p>
              {product.compareAtPrice != null && product.compareAtPrice > product.price && (
                <>
                  <p className="text-lg font-medium text-slate line-through">
                    {formatPrice(product.compareAtPrice)}
                  </p>
                  <Badge variant="success">
                    {Math.round((1 - product.price / product.compareAtPrice) * 100)}% off
                  </Badge>
                </>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold">
              {inStock ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                  <span className="text-success">In Stock</span>
                  <span className="text-slate">({product.stock} available)</span>
                </>
              ) : (
                <span className="text-slate">Currently unavailable</span>
              )}
            </div>

            {product.shortDescription && (
              <div className="mt-6 rounded-xl border border-light-gray bg-soft-gray p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-navy">
                  Key Specifications
                </h2>
                {/* whitespace-pre-line preserves the admin's own line
                    breaks while still wrapping long lines normally — the
                    text itself is plain React-rendered content (always
                    escaped), never dangerouslySetInnerHTML. */}
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate">
                  {product.shortDescription}
                </p>
              </div>
            )}

            <ProductActions product={product} />

            {product.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-soft-gray px-2.5 py-1 text-xs font-medium text-slate"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-8 flex items-center gap-2.5 rounded-xl border border-light-gray bg-soft-gray px-4 py-3 text-sm text-navy">
              <ShieldCheck className="h-5 w-5 shrink-0 text-royal" aria-hidden="true" />
              Genuine product backed by official manufacturer warranty.
            </div>

            <Link
              href={`/business/quotation?product=${product.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-royal hover:text-royal-600"
            >
              Need this in bulk? Request a Quotation
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <ProductDetailTabs
          description={<p className="max-w-3xl leading-relaxed text-slate">{product.description}</p>}
          reviews={<ProductReviews productSlug={product.slug} />}
          reviewCount={ratingSummary.reviewCount}
        />

        <RelatedProducts 
          productId={product.id} 
          categoryId={product.categoryId} 
          brandId={product.brandId} 
        />
      </Container>
    </div>
  );
}
