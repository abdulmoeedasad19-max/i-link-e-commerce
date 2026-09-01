import type { Metadata } from "next";
import Hero from "@/components/sections/hero";
import TrustBanner from "@/components/sections/trust-banner";
import BrandMarquee from "@/components/sections/brand-marquee";
import ShopByCategory from "@/components/sections/shop-by-category";
import SocialMedia from "@/components/sections/social-media";
import WhyILink from "@/components/sections/why-ilink";
import B2BSolutions from "@/components/sections/b2b-solutions";
import Testimonials from "@/components/sections/testimonials";
import Newsletter from "@/components/sections/newsletter";
import FAQ from "@/components/sections/faq";
import { getActiveBanners } from "@/lib/banners-repository";

export const metadata: Metadata = {
  title: "Buy Genuine Laptops, PCs & IT Solutions in Pakistan",
  description:
    "i.Link Systems & Solutions is Pakistan's trusted technology retailer for genuine laptops, desktop PCs, gaming rigs, networking, CCTV and enterprise IT procurement. Authorized reseller with official warranty and nationwide delivery.",
  alternates: {
    canonical: "/",
  },
};

// Homepage banners are admin-managed but change infrequently — an ISR
// interval keeps the page statically served while still picking up admin
// edits within a minute, instead of making the whole homepage dynamic.
export const revalidate = 60;

export default async function Home() {
  const banners = await getActiveBanners();

  return (
    <>
      <h1 className="sr-only">
        i.Link Systems &amp; Solutions — Genuine Laptops, Computers &amp; Enterprise IT
        Solutions in Pakistan
      </h1>
      <Hero banners={banners} />
      <TrustBanner />
      <BrandMarquee />
      <ShopByCategory />
      <SocialMedia />
      <WhyILink />
      <B2BSolutions />
      <Testimonials />
      <Newsletter />
      <FAQ />
    </>
  );
}
