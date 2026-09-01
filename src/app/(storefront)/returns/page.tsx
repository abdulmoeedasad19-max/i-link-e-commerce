import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText, Search } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";

const canonicalPath = "/returns";

export const metadata: Metadata = {
  title: "Returns",
  description:
    "How to request a return on an eligible order from i.Link Systems & Solutions — eligibility, the review process, and what happens next.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Returns",
    description: "How to request a return on an eligible order.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Returns",
    description: "How to request a return on an eligible order.",
  },
};

const steps = [
  {
    icon: CheckCircle2,
    title: "Check eligibility",
    description:
      "Your order must be marked Delivered, and it must be within 7 days of the delivery date.",
  },
  {
    icon: FileText,
    title: "Submit a request",
    description:
      'Go to My Account → Orders, open the order, and use "Request Return" to tell us your reason.',
  },
  {
    icon: Search,
    title: "We review it",
    description: "Our team reviews every request and approves or rejects it, with a note if rejected.",
  },
  {
    icon: Clock,
    title: "Refund, if applicable",
    description:
      "Approval means your request is accepted for processing. Any refund is handled separately — see our Refund Policy.",
  },
];

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Returns"
      description="Unused products in their original packaging can be requested for return within 7 days of delivery."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {steps.map((step, i) => (
          <div key={step.title} className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/10 text-royal">
              <step.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-bold text-navy">
              {i + 1}. {step.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">{step.description}</p>
          </div>
        ))}
      </div>

      <PolicyH2>Eligibility</PolicyH2>
      <PolicyP>
        Return requests can be submitted for orders that are marked Delivered, within 7 days of the
        delivery date, for unused products in their original packaging. This window and status are
        checked automatically when you view your order.
      </PolicyP>

      <PolicyH2>What Happens After You Submit a Request</PolicyH2>
      <PolicyP>
        Your request is reviewed by our team, who will approve or reject it. If rejected, we&rsquo;ll
        include a short note explaining why. Approval means the request has been accepted for
        processing — it does not by itself mean a refund has occurred, and it does not change your
        order&rsquo;s delivery status. Where a refund applies, it&rsquo;s recorded as a separate step; see our{" "}
        <Link href="/policies/refunds" className="font-semibold text-royal hover:text-royal-600">
          Refund Policy
        </Link>{" "}
        for details.
      </PolicyP>

      <PolicyH2>What&rsquo;s Not Currently Included</PolicyH2>
      <PolicyP>
        Our return process does not currently include product exchanges, replacement orders, or
        courier pickup / prepaid return labels. If you&rsquo;d like a different product after a return,
        the current path is to place a new order separately. For a manufacturer defect outside the
        7-day return window, see our{" "}
        <Link href="/policies/warranty" className="font-semibold text-royal hover:text-royal-600">
          Warranty Policy
        </Link>{" "}
        instead.
      </PolicyP>

      <div className="mt-10 flex flex-wrap items-center gap-4 rounded-2xl border border-light-gray bg-soft-gray p-6">
        <div className="flex-1">
          <p className="text-sm font-bold text-navy">Ready to request a return?</p>
          <p className="mt-1 text-sm text-slate">
            Open the eligible order from your account to submit a request.
          </p>
        </div>
        <Button href="/account/orders" variant="primary" size="md">
          Go to My Orders
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </PolicyPage>
  );
}
