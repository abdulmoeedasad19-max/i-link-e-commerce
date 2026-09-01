import type { Metadata } from "next";
import { ArrowRight, FileCheck2 } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";

const canonicalPath = "/business/tenders";

export const metadata: Metadata = {
  title: "Tender Services",
  description: "Support for public and private sector IT procurement tenders from i.Link Systems & Solutions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Tender Services",
    description: "Support for public and private sector IT procurement tenders.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Tender Services",
    description: "Support for public and private sector IT procurement tenders.",
  },
};

export default function TendersPage() {
  return (
    <PolicyPage
      eyebrow="Business Solutions"
      title="Tender Services"
      description="Support for public and private sector IT procurement tenders."
    >
      <div className="flex items-start gap-3 rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
          <FileCheck2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <PolicyP>
          Our business team supports government, corporate and institutional tenders for IT
          equipment — genuine, warranty-backed laptops, desktops, networking gear, CCTV and
          accessories, sourced directly from authorized distributors.
        </PolicyP>
      </div>

      <PolicyH2>How It Works</PolicyH2>
      <PolicyP>
        Share your tender requirements and specifications through our quotation form, and our
        business team will follow up with a custom quotation tailored to the tender&rsquo;s scope,
        timeline and technical requirements.
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
