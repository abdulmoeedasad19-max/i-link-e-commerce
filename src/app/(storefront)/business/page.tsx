import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import FadeIn from "@/components/ui/fade-in";
import { sectors, services } from "@/components/sections/b2b-solutions";
import { features } from "@/components/sections/why-ilink";
import { siteConfig, contactAddresses } from "@/lib/site-config";
import { getAllCategories } from "@/lib/categories-repository";
import { iconMap } from "@/lib/icon-map";

export const metadata: Metadata = {
  title: "Business & Corporate IT Solutions",
  description:
    "Corporate, government and education IT procurement from i.Link Systems & Solutions — bulk pricing, Net-30 credit, dedicated account managers and nationwide deployment.",
  alternates: { canonical: "/business" },
};

// Editorial curation — see about/page.tsx for the same pattern.
const enterpriseCategoryNames = [
  "Laptops",
  "All-in-One PCs",
  "Networking Products",
  "CCTV",
  "Storage",
];

const businessReasons = features.filter((f) =>
  ["Business Solutions", "Official Warranty", "Expert Technical Support", "Best Prices in Pakistan"].includes(
    f.title,
  ),
);

export default async function BusinessPage() {
  const categories = await getAllCategories();
  const enterpriseCategories = categories.filter((c) => enterpriseCategoryNames.includes(c.name));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-800 to-royal-700 py-20 sm:py-28">
        <Container>
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
              Enterprise Procurement
            </span>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Corporate & Government IT Solutions
            </h1>
            <p className="mt-5 text-balance leading-relaxed text-white/75 sm:text-lg">
              Custom IT solutions and procurement support for organizations that demand
              reliability, compliance and scale — backed by genuine products and official
              warranty across every purchase.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button href="/business/quotation" variant="light" size="lg">
                Request a Quotation
                <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
              </Button>
              <Button href="#contact" variant="secondary" size="lg" className="border-white/40 bg-transparent text-white hover:bg-white/10">
                Talk to Our Team
              </Button>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Sectors we serve */}
      <section aria-labelledby="sectors-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="sectors-heading"
            eyebrow="Who We Serve"
            title="Built for Every Sector"
            description="From public-sector tenders to fast-growing startups, our business team supports procurement across every kind of organization."
          />

          <FadeIn className="mt-10 flex flex-wrap justify-center gap-3">
            {sectors.map((sector) => (
              <div
                key={sector.name}
                className="flex items-center gap-2.5 rounded-full border border-light-gray bg-soft-gray px-5 py-2.5"
              >
                <sector.icon className="h-4.5 w-4.5 text-royal" aria-hidden="true" />
                <span className="text-sm font-semibold text-navy">{sector.name}</span>
              </div>
            ))}
          </FadeIn>
        </Container>
      </section>

      {/* Services */}
      <section aria-labelledby="services-heading" className="bg-soft-gray py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="services-heading"
            eyebrow="What We Offer"
            title="Enterprise Services"
            description="Everything your procurement team needs, in one place — from quotation to deployment."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <FadeIn key={service.name} delay={Math.min(i * 0.06, 0.3)}>
                <Card className="h-full">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal/10 text-royal">
                    <service.icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-navy">{service.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{service.description}</p>
                </Card>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Enterprise categories */}
      <section aria-labelledby="categories-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="categories-heading"
            eyebrow="Product Range"
            title="Equip Your Organization"
            description="A curated starting point for common enterprise purchases — browse the full catalog for everything else."
          />

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {enterpriseCategories.map((category) => {
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
            <Button href="/shop" variant="ghost" size="md">
              Browse Full Catalog
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </Container>
      </section>

      {/* Why work with us */}
      <section aria-labelledby="why-business-heading" className="bg-navy py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="why-business-heading"
            eyebrow="Why Choose Us"
            title="Why Businesses Work With i.Link"
            description="Two decades of trust, built on genuine products and service that stands behind every sale."
            className="[&_h2]:text-white [&_p]:text-white/65"
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {businessReasons.map((feature, i) => (
              <FadeIn key={feature.title} delay={Math.min(i * 0.06, 0.3)}>
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-colors duration-300 hover:border-sky/40 hover:bg-white/[0.07]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky/15 text-sky">
                    <feature.icon className="h-6 w-6" strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{feature.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
      </section>

      {/* Quotation CTA */}
      <section aria-labelledby="quote-cta-heading" className="bg-soft-gray py-20 sm:py-24">
        <Container>
          <FadeIn className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700">
            <div className="flex flex-col items-center gap-6 px-8 py-12 text-center sm:px-16">
              <h2 id="quote-cta-heading" className="max-w-xl text-balance text-2xl font-bold text-white sm:text-3xl">
                Planning a large-scale IT procurement or deployment?
              </h2>
              <p className="max-w-lg text-balance text-white/70">
                Our enterprise team will design a custom quotation tailored to your
                organization&apos;s budget, timeline and technical requirements.
              </p>
              <Button href="/business/quotation" variant="light" size="lg">
                Request a Quotation
                <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
              </Button>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* Contact / consultation */}
      <section id="contact" aria-labelledby="contact-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <SectionHeading
            headingId="contact-heading"
            eyebrow="Get in Touch"
            title="Prefer to Talk to Someone?"
            description="Our business team is available during business hours to discuss your procurement needs directly."
          />

          <FadeIn className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
            <a
              href={siteConfig.phoneHref}
              className="flex items-center gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow transition-colors hover:border-royal/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                <Phone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{siteConfig.phone}</p>
                <p className="text-xs text-slate">{siteConfig.hours}</p>
              </div>
            </a>

            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow transition-colors hover:border-royal/30"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{siteConfig.email}</p>
                <p className="text-xs text-slate">Business &amp; enterprise inquiries</p>
              </div>
            </a>

            {contactAddresses.map((address) => (
              <a
                key={address.label}
                href={address.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.full)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow transition-colors hover:border-royal/30"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-navy">{address.label}</p>
                  <p className="text-xs leading-relaxed text-slate">
                    {address.lines[0]}
                    <br />
                    {address.lines[1]}
                  </p>
                </div>
              </a>
            ))}
          </FadeIn>
        </Container>
      </section>
    </div>
  );
}
