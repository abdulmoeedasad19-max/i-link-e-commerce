import Image from "next/image";
import SectionHeading from "@/components/ui/section-heading";
import { getBrandsWithLogo } from "@/lib/brands-repository";

export default async function BrandMarquee() {
  // Phase 4.4.24 — sourced from the database (brands with a logo on
  // file), so a newly added brand with a logo appears here automatically.
  const brandLogos = await getBrandsWithLogo();

  return (
    <section aria-labelledby="reseller-heading" className="bg-white py-20 sm:py-24">
      <SectionHeading
        headingId="reseller-heading"
        eyebrow="Authorized Distribution"
        title="Authorized Reseller for World-Class Brands"
        description="We proudly supply genuine products sourced directly from authorized distributors and manufacturers — ensuring authentic products, official warranties, and trusted after-sales support across Pakistan."
        className="px-5"
      />

      <div className="relative mt-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-32"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-32"
          aria-hidden="true"
        />

        <ul
          className="flex w-max animate-marquee items-center gap-12 hover:[animation-play-state:paused] sm:gap-16 lg:gap-20"
          aria-label="Brands we are an authorized reseller for"
        >
          {brandLogos.map((brand) => (
            <li key={brand.id} className="shrink-0">
              <Image
                src={brand.logoUrl!}
                alt={`${brand.name} logo`}
                width={100}
                height={100}
                className="h-7 w-auto cursor-pointer object-contain opacity-75 transition-all duration-300 ease-out hover:scale-[1.08] hover:opacity-100 sm:h-8 lg:h-9"
              />
            </li>
          ))}
          {brandLogos.map((brand) => (
            <li key={`${brand.id}-dup`} className="shrink-0" aria-hidden="true">
              <Image
                src={brand.logoUrl!}
                alt=""
                width={100}
                height={100}
                className="h-7 w-auto cursor-pointer object-contain opacity-75 transition-all duration-300 ease-out hover:scale-[1.08] hover:opacity-100 sm:h-8 lg:h-9"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
