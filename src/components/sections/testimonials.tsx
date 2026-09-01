"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "Ahmad Raza",
    title: "Freelance Software Engineer",
    org: "Lahore",
    quote:
      "Bought a Dell workstation for my development work — genuine product, sealed box, and the warranty card checked out with Dell directly. Delivery to Lahore took just two days.",
    rating: 5,
  },
  {
    name: "Sana Fatima",
    title: "IT Procurement Manager",
    org: "Meezan Textiles",
    quote:
      "We ordered 40 business laptops in bulk for our new office. The account manager handled everything from quotation to deployment — genuinely felt like an enterprise partner, not just a vendor.",
    rating: 5,
  },
  {
    name: "Bilal Chaudhry",
    title: "Owner",
    org: "PixelForge Studio",
    quote:
      "Built a full gaming and rendering rig here. The team helped me pick the right GPU for my budget and the after-sales support has been excellent whenever I've had questions.",
    rating: 5,
  },
  {
    name: "Dr. Ayesha Khan",
    title: "Administrator",
    org: "Al-Noor Institute",
    quote:
      "We procure our lab computers and networking equipment through i.Link every year. Reliable pricing, proper invoicing for our accounts department, and things simply arrive on time.",
    rating: 5,
  },
  {
    name: "Usman Tariq",
    title: "Branch Operations Lead",
    org: "Askari Commercial Bank",
    quote:
      "Their CCTV and networking team deployed a full surveillance upgrade across three of our branches with minimal disruption. Professional from planning through to installation.",
    rating: 5,
  },
  {
    name: "Hira Malik",
    title: "University Student",
    org: "NUST, Islamabad",
    quote:
      "First time buying a laptop online for this much money and I was nervous — but everything about the process felt trustworthy, from the packaging to the warranty registration.",
    rating: 5,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section aria-labelledby="testimonials-heading" className="bg-soft-gray py-20 sm:py-24">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            headingId="testimonials-heading"
            eyebrow="Customer Stories"
            title="Loved by 250,000+ Customers"
            description="Trusted by students, freelancers, startups, enterprises and government organizations across Pakistan."
            align="left"
            className="mx-0 text-left sm:max-w-lg"
          />
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-light-gray bg-white text-navy transition-colors hover:border-royal hover:text-royal"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-light-gray bg-white text-navy transition-colors hover:border-royal hover:text-royal"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mt-10 overflow-hidden" ref={emblaRef}>
          <div className="-ml-5 flex">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="min-w-0 shrink-0 grow-0 basis-full pl-5 sm:basis-1/2 lg:basis-1/3"
              >
                <div className="flex h-full flex-col rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
                  <Quote className="h-7 w-7 text-royal/30" aria-hidden="true" />
                  <div className="mt-3 flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-dark-slate">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                      {initials(t.name)}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-navy">{t.name}</p>
                      <p className="text-xs text-slate">
                        {t.title} · {t.org}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2 sm:hidden">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selectedIndex ? "w-6 bg-royal" : "w-1.5 bg-light-gray",
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
