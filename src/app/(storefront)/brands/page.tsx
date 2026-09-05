import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PolicyPage, { PolicyP } from "@/components/sections/policy-page";
import { getAllBrands, type RepositoryBrandWithLogo } from "@/lib/brands-repository";
import { brands as staticBrandNames } from "@/lib/site-config";

const canonicalPath = "/brands";

export const metadata: Metadata = {
  title: "Authorized Brands",
  description: "The brands i.Link Systems & Solutions is an authorized reseller for, sourced directly from official distributors.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Authorized Brands",
    description: "The brands i.Link Systems & Solutions is an authorized reseller for.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Authorized Brands",
    description: "The brands i.Link Systems & Solutions is an authorized reseller for.",
  },
};

export default async function BrandsPage() {
  // Phase 4.4.24 — the database Brand model is now authoritative here.
  // Three tiers, each reflecting a different level of evidence: brands we
  // actually carry with a logo on file, brands we actually carry without
  // one yet, and — preserved from Phase 4.4.21 — a static "also
  // available" list of names not yet backed by a catalog Brand row at
  // all. A brand's name is never shown in two tiers at once.
  const dbBrands = await getAllBrands();
  const withLogo = dbBrands.filter((b): b is RepositoryBrandWithLogo => Boolean(b.logoUrl));
  const withoutLogo = dbBrands.filter((b) => !b.logoUrl);
  const dbBrandNames = new Set(dbBrands.map((b) => b.name));
  const additionalBrands = staticBrandNames.filter((name) => !dbBrandNames.has(name));

  return (
    <PolicyPage
      eyebrow="Company"
      title="Authorized Brands"
      description="We're an authorized reseller, sourcing every product directly from official distributors and manufacturers — never grey market."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {withLogo.map((brand) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="flex h-24 items-center justify-center rounded-2xl border border-light-gray bg-white p-4 premium-shadow hover:border-royal/50 hover:shadow-md transition-all"
          >
            <Image
              src={brand.logoUrl}
              alt={`${brand.name} logo`}
              width={100}
              height={100}
              className="h-8 w-auto object-contain"
            />
          </Link>
        ))}
      </div>

      {withoutLogo.length > 0 && (
        <div className="mt-8">
          <p className="text-sm font-bold text-navy">Also in our catalog</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {withoutLogo.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="rounded-md border border-light-gray bg-white px-3 py-1.5 text-xs font-medium text-navy premium-shadow hover:text-royal hover:border-royal/50 transition-colors"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {additionalBrands.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-bold text-navy">Also available</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {additionalBrands.map((name) => (
              <span
                key={name}
                className="rounded-md border border-light-gray bg-soft-gray px-3 py-1.5 text-xs font-medium text-slate"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <PolicyP>
        Looking for a specific product from one of these brands? Browse our{" "}
        <Link href="/shop" className="font-semibold text-royal hover:text-royal-600">
          full catalog
        </Link>{" "}
        or{" "}
        <Link href="/contact" className="font-semibold text-royal hover:text-royal-600">
          contact us
        </Link>{" "}
        and we&rsquo;ll help you find it.
      </PolicyP>
    </PolicyPage>
  );
}
