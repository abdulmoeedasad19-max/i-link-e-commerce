import {
  BadgeCheck,
  ShieldCheck,
  Truck,
  Briefcase,
  Headset,
  Lock,
  RotateCcw,
  Tag,
} from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import FadeIn from "@/components/ui/fade-in";

export const features = [
  {
    icon: BadgeCheck,
    title: "100% Genuine Products",
    description: "Every item is sourced directly from authorized distributors — no grey imports, ever.",
  },
  {
    icon: ShieldCheck,
    title: "Official Warranty",
    description: "Full manufacturer warranty coverage with local support on every purchase.",
  },
  {
    icon: Truck,
    title: "Fast Nationwide Delivery",
    description: "Reliable, tracked shipping to every major city and town across Pakistan.",
  },
  {
    icon: Briefcase,
    title: "Business Solutions",
    description: "Tailored procurement, deployment and IT infrastructure for organizations of any size.",
  },
  {
    icon: Headset,
    title: "Expert Technical Support",
    description: "Certified technicians available to help you choose, configure and maintain your systems.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Bank-grade encrypted checkout with multiple trusted payment options.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Straightforward return policy for eligible orders, backed by our customer promise.",
  },
  {
    icon: Tag,
    title: "Best Prices in Pakistan",
    description: "Competitive, transparent pricing with regular deals on top-tier technology.",
  },
];

export default function WhyILink() {
  return (
    <section aria-labelledby="why-heading" className="bg-navy py-20 sm:py-24">
      <Container>
        <SectionHeading
          headingId="why-heading"
          eyebrow="Why Choose Us"
          title="Why i.Link Systems & Solutions"
          description="Two decades of trust, built on genuine products and service that stands behind every sale."
          className="[&_h2]:text-white [&_p]:text-white/65"
        />

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={Math.min(i * 0.05, 0.3)}>
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
  );
}
