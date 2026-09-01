import {
  Landmark,
  Building2,
  GraduationCap,
  Rocket,
  Banknote,
  FileCheck2,
  Package,
  Users,
  BadgeCheck,
  Percent,
  Wrench,
  Settings2,
  ArrowRight,
} from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import FadeIn from "@/components/ui/fade-in";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

export const sectors = [
  { icon: Landmark, name: "Government & Public Sector" },
  { icon: Building2, name: "Corporate Enterprises" },
  { icon: GraduationCap, name: "Educational Institutions" },
  { icon: Rocket, name: "SMEs & Startups" },
  { icon: Banknote, name: "Banks & Financial Services" },
];

export const services = [
  { icon: FileCheck2, name: "Tender Services", description: "End-to-end support for public and private sector tenders." },
  { icon: Package, name: "Bulk Orders", description: "Volume procurement with priority fulfillment and logistics." },
  { icon: Users, name: "Dedicated Account Managers", description: "A single point of contact for every stage of your project." },
  { icon: BadgeCheck, name: "Genuine Products", description: "100% genuine products backed by official manufacturer warranty and trusted after-sales support." },
  { icon: Percent, name: "Volume Pricing", description: "Tiered discounts that scale with your organization's needs." },
  { icon: Wrench, name: "Project Deployment", description: "On-site setup, configuration and rollout by certified engineers." },
];

export default function B2BSolutions() {
  return (
    <section aria-labelledby="b2b-heading" className="bg-white py-20 sm:py-24">
      <Container>
        <SectionHeading
          headingId="b2b-heading"
          eyebrow="Enterprise Procurement"
          title="Corporate & Government Solutions"
          description="Custom IT solutions and procurement support for organizations that demand reliability, compliance and scale."
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

        <FadeIn className="mt-14 overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-navy-700">
          <div className="flex flex-col items-center gap-6 px-8 py-12 text-center sm:px-16">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky/15 text-sky">
              <Settings2 className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="max-w-xl text-balance text-2xl font-bold text-white sm:text-3xl">
              Planning a large-scale IT procurement or deployment?
            </h3>
            <p className="max-w-lg text-balance text-white/70">
              Our enterprise team will design a custom quotation tailored to your organization&apos;s
              budget, timeline and technical requirements.
            </p>
            <Button href="/business/quotation" variant="light" size="lg">
              Request a Quotation
              <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
            </Button>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
