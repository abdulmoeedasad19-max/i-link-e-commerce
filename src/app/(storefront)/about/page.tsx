import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, Phone } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import FadeIn from "@/components/ui/fade-in";
import { sectors, services } from "@/components/sections/b2b-solutions";
import { features } from "@/components/sections/why-ilink";
import { siteConfig } from "@/lib/site-config";
import { getAllCategories } from "@/lib/categories-repository";
import { iconMap } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "i.Link Systems & Solutions is Pakistan's trusted technology retailer and authorized reseller of genuine laptops, desktop PCs, networking equipment, CCTV and IT accessories.",
  alternates: { canonical: "/about" },
};

// Editorial curation — deliberately a subset, not "every category" — kept
// as a static name list (Phase 4.4.24: this is presentation config, not
// catalog data) while the categories themselves now come from the
// database via getAllCategories().
const featuredCategoryNames = [
  "Laptops",
  "Gaming PCs",
  "All-in-One PCs",
  "Monitors",
  "Networking Products",
  "CCTV",
  "Storage",
  "Printers",
];

export default async function AboutPage() {
  const categories = await getAllCategories();
  const featuredCategories = categories.filter((c) => featuredCategoryNames.includes(c.name));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-800 to-royal-700 py-20 sm:py-28">
        <Container>
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
              About Us
            </span>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              About i.Link Systems &amp; Solutions
            </h1>
            <p className="mt-5 text-balance leading-relaxed text-white/75 sm:text-lg">
              Pakistan&apos;s trusted technology retailer for genuine computers, networking
              equipment and enterprise IT solutions since day one.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Who we are */}
      <section aria-labelledby="who-we-are-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="who-we-are-heading"
            eyebrow="Who We Are"
            title="An Authorized Reseller You Can Trust"
            description="i.Link Systems & Solutions is an authorized reseller of genuine laptops, desktop PCs, networking equipment, CCTV and IT accessories, serving consumers and enterprises across Pakistan."
            className="mx-auto max-w-3xl"
          />

          <FadeIn className="mx-auto mt-8 max-w-3xl text-center">
            <p className="leading-relaxed text-slate">
              Every product we sell is sourced directly from official distributors — never grey
              market — and ships in sealed manufacturer packaging with full warranty coverage
              honored locally in Pakistan. Whether you&apos;re a home user, a gamer, a business or
              a government department, we back every purchase with genuine hardware and real
              after-sales support.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Product categories */}
      <section aria-labelledby="categories-heading" className="bg-soft-gray py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="categories-heading"
            eyebrow="What We Offer"
            title="Our Product Range"
            description="From everyday computing to enterprise infrastructure, we carry genuine products across every major technology category."
          />

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {featuredCategories.map((category) => {
              const Icon = iconMap[category.icon];
              return (
                <Link
                  key={category.name}
                  href={category.href}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-light-gray bg-white p-6 text-center premium-shadow transition-all duration-300 hover:-translate-y-1 hover:border-royal/30"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal/10 text-royal transition-colors group-hover:bg-royal group-hover:text-white">
                    <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold text-navy">{category.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button href="/shop" variant="primary" size="lg">
              Explore Products
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Why choose i.Link */}
      <section aria-labelledby="why-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="why-heading"
            eyebrow="Why Choose Us"
            title="Why Choose i.Link"
            description="The principles behind every sale, from a single accessory to a full enterprise rollout."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={Math.min(i * 0.05, 0.3)}>
                <Card className="h-full">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal/10 text-royal">
                    <feature.icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-navy">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{feature.description}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Business & enterprise */}
      <section aria-labelledby="business-heading" className="bg-navy py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="business-heading"
            eyebrow="Business & Enterprise"
            title="Built for Organizations, Too"
            description="Beyond individual customers, we support corporate, government and education procurement at scale."
            className="[&_h2]:text-white [&_p]:text-white/65"
          />

          <FadeIn className="mt-10 flex flex-wrap justify-center gap-3">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5"
              >
                <sector.icon className="h-4.5 w-4.5 text-sky" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">{sector.name}</span>
              </div>
            ))}
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <FadeIn key={service.name} delay={Math.min(i * 0.06, 0.3)}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-sky/40 hover:bg-white/[0.07]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/15 text-sky">
                    <service.icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white">{service.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{service.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <Button href="/business/quotation" variant="light" size="lg">
              Request a Quotation
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </Button>
            <Button
              href="/business"
              variant="secondary"
              size="lg"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              Business Solutions
            </Button>
          </div>
        </Container>
      </section>

      {/* Get in touch */}
      <section aria-labelledby="contact-heading" className="bg-soft-gray py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="contact-heading"
            eyebrow="Get in Touch"
            title="Have a Question?"
            description="Reach out directly, or send us a message and we'll get back to you."
          />

          <FadeIn className="mx-auto mt-10 flex max-w-2xl flex-col items-center gap-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <a
                href={siteConfig.phoneHref}
                className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-royal"
              >
                <Phone className="h-4 w-4 text-royal" aria-hidden="true" />
                {siteConfig.phone}
              </a>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-royal"
              >
                <Mail className="h-4 w-4 text-royal" aria-hidden="true" />
                {siteConfig.email}
              </a>
              <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                <Clock className="h-4 w-4 text-royal" aria-hidden="true" />
                {siteConfig.hours}
              </span>
            </div>

            <Button href="/contact" variant="primary" size="lg">
              Contact Us
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </Button>
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
