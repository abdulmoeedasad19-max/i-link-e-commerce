import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, Phone } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

const canonicalPath = "/support";

export const metadata: Metadata = {
  title: "Technical Support",
  description: "Get help from i.Link Systems & Solutions — orders, returns, warranty and product questions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Technical Support",
    description: "Get help with orders, returns, warranty and product questions.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Technical Support",
    description: "Get help with orders, returns, warranty and product questions.",
  },
};

const pathways = [
  { title: "Order or delivery question", href: "/account/orders", cta: "View My Orders" },
  { title: "Start a return", href: "/returns", cta: "Returns" },
  { title: "Warranty question", href: "/policies/warranty", cta: "Warranty Policy" },
  { title: "Bulk or business order", href: "/business/quotation", cta: "Request a Quotation" },
];

export default function SupportPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Technical Support"
      description="Reach our team directly, or jump straight to the help page you need."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="flex items-center gap-3 rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:col-span-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">Business Hours</p>
            <p className="mt-0.5 text-sm font-bold text-navy">{siteConfig.hours}</p>
          </div>
        </div>
      </div>

      <PolicyH2>Where to Go</PolicyH2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {pathways.map((item) => (
          <Button
            key={item.href}
            href={item.href}
            variant="secondary"
            size="md"
            className="w-full justify-between"
          >
            {item.title}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Button>
        ))}
      </div>

      <PolicyP>
        For anything else, or if you&rsquo;re not sure where to start, use our{" "}
        <Link href="/contact" className="font-semibold text-royal hover:text-royal-600">
          contact form
        </Link>{" "}
        and we&rsquo;ll point you in the right direction.
      </PolicyP>
    </PolicyPage>
  );
}
