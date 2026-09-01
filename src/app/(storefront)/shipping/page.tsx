import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyH2, PolicyP, PolicyList } from "@/components/sections/policy-page";

const canonicalPath = "/shipping";

export const metadata: Metadata = {
  title: "Shipping Information",
  description:
    "Where and how i.Link Systems & Solutions delivers, and typical delivery timing across Pakistan.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Shipping Information",
    description: "Where and how we deliver, and typical delivery timing across Pakistan.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Shipping Information",
    description: "Where and how we deliver, and typical delivery timing across Pakistan.",
  },
};

export default function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Shipping Information"
      description="Where and how we deliver, and what to expect for timing."
    >
      <PolicyH2>Where We Deliver</PolicyH2>
      <PolicyP>
        We deliver nationwide, to major cities and towns across all four provinces of Pakistan, with
        tracked and insured shipping on every order.
      </PolicyP>

      <PolicyH2>Delivery Timing</PolicyH2>
      <PolicyList>
        <li>Major cities: typically 1–3 business days.</li>
        <li>Other cities and towns: typically 3–5 business days.</li>
      </PolicyList>
      <PolicyP>
        Timing can vary depending on your location, the product ordered, and courier conditions.
      </PolicyP>

      <PolicyH2>Shipping Cost</PolicyH2>
      <PolicyP>
        Your exact shipping cost is calculated and shown at checkout before you place your order, so
        you always know the final total in advance.
      </PolicyP>

      <PolicyH2>Order Status &amp; Tracking</PolicyH2>
      <PolicyP>
        You can check your order&rsquo;s current status at any time from My Account → Orders. See our{" "}
        <Link href="/track-order" className="font-semibold text-royal hover:text-royal-600">
          Track Your Order
        </Link>{" "}
        page for more.
      </PolicyP>

      <PolicyH2>Questions About Your Delivery</PolicyH2>
      <PolicyP>
        If you have a specific question about the delivery of an order, please{" "}
        <Link href="/support" className="font-semibold text-royal hover:text-royal-600">
          contact our support team
        </Link>{" "}
        with your order number.
      </PolicyP>
    </PolicyPage>
  );
}
