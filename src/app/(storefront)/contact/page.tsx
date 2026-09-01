import type { Metadata } from "next";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import FadeIn from "@/components/ui/fade-in";
import ContactForm from "@/components/sections/contact-form";
import { siteConfig, contactAddresses, getMapsUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with i.Link Systems & Solutions — call, email or visit us in Blue Area, Islamabad. Genuine laptops, PCs, networking and CCTV, with official warranty.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div>
      {/* Hero / introduction */}
      <section className="bg-gradient-to-br from-navy via-navy-800 to-royal-700 py-20 sm:py-24">
        <Container>
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-sky">
              <span className="h-1.5 w-1.5 rounded-full bg-sky" aria-hidden="true" />
              Get in Touch
            </span>
            <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Contact Us
            </h1>
            <p className="mt-5 text-balance leading-relaxed text-white/75 sm:text-lg">
              Questions about a product, an order, or a bulk procurement need? Reach us directly,
              or send a message below.
            </p>
          </FadeIn>
        </Container>
      </section>

      {/* Contact info + form */}
      <section aria-labelledby="contact-heading" className="bg-white py-20 sm:py-24">
        <Container>
          <h2 id="contact-heading" className="sr-only">
            Contact information and message form
          </h2>

          <div className="grid gap-10 lg:grid-cols-5 lg:gap-12">
            {/* Contact information */}
            <FadeIn className="lg:col-span-2">
              <div className="space-y-4">
                <a
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow transition-colors hover:border-royal/30"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                    <Phone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Phone</p>
                    <p className="mt-0.5 text-sm font-bold text-navy">{siteConfig.phone}</p>
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
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">Email</p>
                    <p className="mt-0.5 text-sm font-bold text-navy">{siteConfig.email}</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                      Business Hours
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-navy">{siteConfig.hours}</p>
                  </div>
                </div>

                {contactAddresses.map((address) => (
                  <div
                    key={address.label}
                    className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                        <MapPin className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                          {address.label}
                        </p>
                        <p className="mt-0.5 text-sm font-bold leading-relaxed text-navy">
                          {address.lines[0]}
                          <br />
                          {address.lines[1]}
                        </p>
                      </div>
                    </div>
                    <a
                      href={getMapsUrl(address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 pl-14 text-sm font-semibold text-royal hover:text-royal-600"
                    >
                      View on Google Maps
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                ))}

                <div className="rounded-2xl border border-light-gray bg-soft-gray p-5">
                  <p className="text-sm font-bold text-navy">Need a bulk or business quote?</p>
                  <p className="mt-1 text-sm text-slate">
                    For procurement and enterprise pricing, use our dedicated quotation form.
                  </p>
                  <Button href="/business/quotation" variant="secondary" size="sm" className="mt-3">
                    Request a Quotation
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </FadeIn>

            {/* Message form */}
            <FadeIn className="lg:col-span-3">
              <div className="rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
                <SectionHeading
                  title="Send Us a Message"
                  description="Fill out the form and we'll get back to you as soon as possible."
                  align="left"
                  className="mx-0 text-left"
                />
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>
            </FadeIn>
          </div>
        </Container>
      </section>
    </div>
  );
}
