import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ProductCard from "@/components/sections/product-card";
import Pagination from "@/components/ui/pagination";
import { getProductsByBrand } from "@/lib/products-repository";
import { getBrandBySlug } from "@/lib/brands-repository";
import { siteConfig } from "@/lib/site-config";
import { safeJsonLd } from "@/lib/utils";

const BRAND_PAGE_SIZE = 24;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);

  if (!brand) {
    return { title: "Brand Not Found" };
  }

  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const parsedPage = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  const page = !isNaN(parsedPage) && parsedPage > 1 ? parsedPage : 1;

  const canonicalPath = page > 1 ? `/brands/${slug}?page=${page}` : `/brands/${slug}`;

  return {
    title: brand.seoTitle || `${brand.name} Laptops & Computers in Pakistan | i.Link Systems`,
    description: brand.seoDescription || `Shop ${brand.name} products in Pakistan at i.Link Systems. Explore available ${brand.name} laptops, computers and technology products.`,
    alternates: { canonical: canonicalPath },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  const pageParam = resolvedSearchParams.page;
  const parsedPage = typeof pageParam === "string" ? parseInt(pageParam, 10) : 1;
  const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const brand = await getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const { products, total } = await getProductsByBrand(brand.slug, page, BRAND_PAGE_SIZE);
  const totalPages = Math.ceil(total / BRAND_PAGE_SIZE);

  const canonicalPath = page > 1 ? `/brands/${slug}?page=${page}` : `/brands/${slug}`;
  const canonicalUrl = `${siteConfig.url}${canonicalPath}`;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteConfig.url}/` },
      { "@type": "ListItem", position: 2, name: "Brands", item: `${siteConfig.url}/brands` },
      { "@type": "ListItem", position: 3, name: brand.name, item: canonicalUrl },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: brand.seoTitle || brand.name,
    description: brand.seoDescription || brand.description || `Shop ${brand.name} Laptops & Computers in Pakistan`,
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
    <div className="pb-16 pt-8 sm:pb-24 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <Container>
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-slate">
          <Link href="/" className="hover:text-royal">Home</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/brands" className="hover:text-royal">Brands</Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span className="font-medium text-navy">{brand.name}</span>
        </nav>
        
        <div className="mb-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {brand.logoUrl && (
            <div className="flex h-16 w-32 items-center justify-center shrink-0">
              <Image 
                src={brand.logoUrl} 
                alt={`${brand.name} logo`} 
                width={100} 
                height={100} 
                className="h-full w-auto object-contain" 
              />
            </div>
          )}
          <div>
            <SectionHeading 
              as="h1" 
              eyebrow="Brand" 
              title={brand.name} 
              description={brand.description || `Shop ${brand.name} Laptops & Computers in Pakistan`} 
            />
          </div>
        </div>

        {products.length > 0 ? (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-navy">{brand.name} Products</h2>
              <span className="text-sm text-slate">{total} product{total === 1 ? "" : "s"}</span>
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>

            <Pagination 
              currentPage={page} 
              totalPages={totalPages} 
              baseHref={`/brands/${slug}`} 
            />
          </>
        ) : (
          <div className="mx-auto mt-12 flex max-w-md flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <PackageSearch className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">
              More {brand.name} coming soon
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              We&apos;re adding new products to this brand. In the meantime, contact our
              sales team for current availability and pricing.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}