import type { Metadata } from "next";
import { Mail } from "lucide-react";
import PolicyPage, { PolicyP } from "@/components/sections/policy-page";
import { siteConfig } from "@/lib/site-config";

const canonicalPath = "/careers";

export const metadata: Metadata = {
  title: "Careers",
  description: "Current career opportunities at i.Link Systems & Solutions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Careers",
    description: "Current career opportunities at i.Link Systems & Solutions.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Careers",
    description: "Current career opportunities at i.Link Systems & Solutions.",
  },
};

export default function CareersPage() {
  return (
    <PolicyPage eyebrow="Company" title="Careers" description="Join the team behind i.Link Systems & Solutions.">
      <PolicyP>
        We don&rsquo;t have specific open positions listed on the site at the moment. If you&rsquo;re
        interested in working with us, we&rsquo;d still like to hear from you — send your CV and a short
        note about what you&rsquo;re looking for, and we&rsquo;ll keep it on file for when a relevant opening
        comes up.
      </PolicyP>
      <a
        href={`mailto:${siteConfig.email}`}
        className="mt-6 inline-flex items-center gap-2.5 rounded-2xl border border-light-gray bg-white p-5 premium-shadow transition-colors hover:border-royal/30"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
          <Mail className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">Email us</p>
          <p className="mt-0.5 text-sm font-bold text-navy">{siteConfig.email}</p>
        </div>
      </a>
    </PolicyPage>
  );
}
