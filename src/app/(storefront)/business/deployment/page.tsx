import type { Metadata } from "next";
import { ArrowRight, Wrench } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";

const canonicalPath = "/business/deployment";

export const metadata: Metadata = {
  title: "Project Deployment",
  description: "On-site setup, configuration and rollout for IT infrastructure and CCTV projects.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Project Deployment",
    description: "On-site setup, configuration and rollout for IT infrastructure and CCTV projects.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Project Deployment",
    description: "On-site setup, configuration and rollout for IT infrastructure and CCTV projects.",
  },
};

export default function DeploymentPage() {
  return (
    <PolicyPage
      eyebrow="Business Solutions"
      title="Project Deployment"
      description="On-site setup, configuration and rollout by certified engineers."
    >
      <div className="flex items-start gap-3 rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-royal/10 text-royal">
          <Wrench className="h-5 w-5" aria-hidden="true" />
        </span>
        <PolicyP>
          Our certified technical team offers on-site installation, configuration and deployment for
          networking infrastructure and CCTV surveillance systems, for businesses of any size.
        </PolicyP>
      </div>

      <PolicyH2>How It Works</PolicyH2>
      <PolicyP>
        Tell us about your project scope, site and timeline through our quotation form, and our
        business team will follow up with a custom quotation covering the equipment and deployment
        work involved.
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
