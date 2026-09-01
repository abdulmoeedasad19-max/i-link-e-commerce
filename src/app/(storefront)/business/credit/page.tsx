import type { Metadata } from "next";
import { ArrowRight, Banknote } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";

const canonicalPath = "/business/credit";

export const metadata: Metadata = {
  title: "Net-30 Credit Terms",
  description: "Net-30 invoicing for qualified business accounts at i.Link Systems & Solutions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Net-30 Credit Terms",
    description: "Net-30 invoicing for qualified business accounts.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Net-30 Credit Terms",
    description: "Net-30 invoicing for qualified business accounts.",
  },
};

export default function CreditPage() {
  return (
    <PolicyPage
      eyebrow="Business Solutions"
      title="Net-30 Credit Terms"
      description="Net-30 invoicing is available to qualified business accounts."
    >
      <div className="flex items-start gap-3 rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
          <Banknote className="h-5 w-5" aria-hidden="true" />
        </span>
        <PolicyP>
          Qualified business, government and educational institution accounts can arrange Net-30
          invoicing for procurement orders, rather than paying at the time of order.
        </PolicyP>
      </div>

      <PolicyH2>How to Apply</PolicyH2>
      <PolicyP>
        Net-30 terms are arranged on a per-account basis. Tell us about your organization and
        procurement needs through our quotation form, and our business team will follow up to
        discuss whether Net-30 terms are a fit for your account.
      </PolicyP>

      <div className="mt-8">
        <Button href="/business/quotation" variant="primary" size="lg">
          Request a Quotation
          <ArrowRight className="h-4.5 w-4.5" aria-hidden="true" />
        </Button>
      </div>
    </PolicyPage>
  );
}
