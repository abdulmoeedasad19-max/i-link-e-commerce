import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import PolicyPage, { PolicyP } from "@/components/sections/policy-page";
import { contactAddresses, getMapsUrl, siteConfig } from "@/lib/site-config";

const canonicalPath = "/stores";

export const metadata: Metadata = {
  title: "Store Locations",
  description: "Visit i.Link Systems & Solutions in Blue Area, Islamabad.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Store Locations",
    description: "Visit i.Link Systems & Solutions in Blue Area, Islamabad.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Store Locations",
    description: "Visit i.Link Systems & Solutions in Blue Area, Islamabad.",
  },
};

export default function StoresPage() {
  return (
    <PolicyPage
      eyebrow="Company"
      title="Store Locations"
      description="Visit us in person, or reach us by phone during business hours."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {contactAddresses.map((address) => (
          <div key={address.label} className="rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{address.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate">
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
              className="mt-4 inline-flex items-center gap-1.5 pl-14 text-sm font-semibold text-royal hover:text-royal-600"
            >
              View on Google Maps
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-light-gray bg-soft-gray p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-royal" aria-hidden="true" />
          <a href={siteConfig.phoneHref} className="text-sm font-semibold text-navy hover:text-royal">
            {siteConfig.phone}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-royal" aria-hidden="true" />
          <span className="text-sm font-semibold text-navy">{siteConfig.hours}</span>
        </div>
      </div>

      <PolicyP>
        Prefer to shop online? Browse our full catalog and have your order delivered nationwide —
        see our{" "}
        <Link href="/shipping" className="font-semibold text-royal hover:text-royal-600">
          Shipping Information
        </Link>{" "}
        page for delivery details.
      </PolicyP>
    </PolicyPage>
  );
}
