import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyH2, PolicyP, PolicyList } from "@/components/sections/policy-page";

const canonicalPath = "/policies/warranty";

export const metadata: Metadata = {
  title: "Warranty Policy",
  description:
    "How manufacturer warranty coverage works on products purchased from i.Link Systems & Solutions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Warranty Policy",
    description: "How manufacturer warranty coverage works on products purchased from i.Link Systems & Solutions.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Warranty Policy",
    description: "How manufacturer warranty coverage works on products purchased from i.Link Systems & Solutions.",
  },
};

export default function WarrantyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Warranty Policy"
      description="How manufacturer warranty coverage works on products you buy from us."
      lastUpdated="August 20, 2026"
    >
      <PolicyP>
        i.Link Systems &amp; Solutions is an authorized reseller sourcing products directly from
        official distributors, never grey market. Products are sold with manufacturer warranty
        coverage honored locally in Pakistan through each brand&rsquo;s official service network.
      </PolicyP>

      <PolicyH2>Warranty Duration &amp; Coverage</PolicyH2>
      <PolicyP>
        Warranty duration and what it covers varies by product, brand and category — there is no
        single warranty period that applies to every item we sell. The applicable warranty period
        for your specific product is stated on the product listing at the time of purchase, and is
        also reflected in your order documentation. If you&rsquo;re unsure what applies to a product you
        already own, contact our support team with your order number and we&rsquo;ll confirm the details.
      </PolicyP>

      <PolicyH2>How Warranty Claims Work</PolicyH2>
      <PolicyP>
        Manufacturer warranty claims are handled through the brand&rsquo;s own official local service
        network. If you experience a fault with a product, contact our support team first — we can
        help you understand the right next step for your specific product and brand.
      </PolicyP>

      <PolicyH2>What This Policy Doesn&rsquo;t Cover</PolicyH2>
      <PolicyList>
        <li>Damage caused by misuse, accidents, or unauthorized repair attempts.</li>
        <li>Normal wear and tear.</li>
        <li>Products purchased outside of i.Link Systems &amp; Solutions.</li>
      </PolicyList>
      <PolicyP>
        This is separate from our{" "}
        <Link href="/returns" className="font-semibold text-royal hover:text-royal-600">
          Returns
        </Link>{" "}
        process, which covers unused products within 7 days of delivery — not manufacturer defects
        discovered after that window, which are handled under the manufacturer&rsquo;s warranty instead.
      </PolicyP>

      <PolicyH2>Contact Us</PolicyH2>
      <PolicyP>
        For a warranty question about a specific product or order, please{" "}
        <Link href="/support" className="font-semibold text-royal hover:text-royal-600">
          contact our support team
        </Link>
        .
      </PolicyP>
    </PolicyPage>
  );
}
