import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyH2, PolicyP, PolicyList } from "@/components/sections/policy-page";

const canonicalPath = "/policies/refunds";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "How refunds work at i.Link Systems & Solutions — the distinction between a return request, approval, and the actual refund.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Refund Policy",
    description: "How refunds work at i.Link Systems & Solutions.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Refund Policy",
    description: "How refunds work at i.Link Systems & Solutions.",
  },
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Refund Policy"
      description="How a refund fits into our return process, step by step."
      lastUpdated="August 20, 2026"
    >
      <PolicyP>
        This page explains how refunds work at i.Link Systems &amp; Solutions. It&rsquo;s important to
        understand that a refund is a separate, manual step from a return request being approved —
        the two are not the same thing.
      </PolicyP>

      <PolicyH2>The Three Steps</PolicyH2>
      <PolicyList>
        <li>
          <strong>1. Return request.</strong> If your order is Delivered and within 7 days of
          delivery, you can submit a return request from My Account → Orders, explaining your
          reason.
        </li>
        <li>
          <strong>2. Review and approval or rejection.</strong> Our team reviews the request and
          either approves or rejects it. Approving a request means it has been accepted for
          processing — approval on its own does not mean payment has already been refunded, and does
          not change your order&rsquo;s delivery status.
        </li>
        <li>
          <strong>3. Refund.</strong> Where a refund is due, it is recorded and processed by our team
          as a separate step after a return has been approved. Your order&rsquo;s Payment Status will show
          &ldquo;Refunded&rdquo; once this has happened, along with the date it occurred.
        </li>
      </PolicyList>

      <PolicyH2>What We Don&rsquo;t Currently Offer</PolicyH2>
      <PolicyP>To set accurate expectations, our current return process does not include:</PolicyP>
      <PolicyList>
        <li>Automatic or instant refunds triggered by approval.</li>
        <li>Product exchanges or replacement orders as part of the return process.</li>
        <li>Courier pickup or prepaid return shipping labels.</li>
      </PolicyList>
      <PolicyP>
        If you&rsquo;d prefer a different or replacement product after a return, the current path is to
        place a new order separately.
      </PolicyP>

      <PolicyH2>Checking Your Refund Status</PolicyH2>
      <PolicyP>
        You can check the status of your return request and your order&rsquo;s Payment Status at any time
        from{" "}
        <Link href="/account/orders" className="font-semibold text-royal hover:text-royal-600">
          My Account → Orders
        </Link>
        . For more on eligibility and how to submit a request, see our{" "}
        <Link href="/returns" className="font-semibold text-royal hover:text-royal-600">
          Returns
        </Link>{" "}
        page.
      </PolicyP>

      <PolicyH2>Contact Us</PolicyH2>
      <PolicyP>
        Questions about a specific refund? Please{" "}
        <Link href="/support" className="font-semibold text-royal hover:text-royal-600">
          contact our support team
        </Link>{" "}
        with your order number.
      </PolicyP>
    </PolicyPage>
  );
}
