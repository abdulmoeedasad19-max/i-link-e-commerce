import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyH2, PolicyP, PolicyList } from "@/components/sections/policy-page";

const canonicalPath = "/policies/terms";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that apply when you create an account, place an order or otherwise use the i.Link Systems & Solutions website.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Terms of Service",
    description: "The terms that apply when you use the i.Link Systems & Solutions website.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Terms of Service",
    description: "The terms that apply when you use the i.Link Systems & Solutions website.",
  },
};

export default function TermsOfServicePage() {
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Terms of Service"
      description="The terms that apply when you use this website and place an order."
      lastUpdated="August 20, 2026"
    >
      <PolicyP>
        These terms apply to your use of the i.Link Systems &amp; Solutions website and any order
        you place through it. By creating an account or placing an order, you agree to these terms.
      </PolicyP>

      <PolicyH2>Product Information &amp; Pricing</PolicyH2>
      <PolicyP>
        We aim to keep product descriptions, images and prices accurate and up to date. All prices
        are shown in Pakistani Rupees (PKR) and are subject to change without notice; the price
        shown at checkout, at the time you place your order, is the price that applies to that order.
      </PolicyP>

      <PolicyH2>Orders</PolicyH2>
      <PolicyP>
        Placing an order is an offer to purchase the selected products. We may contact you to
        confirm details before an order is processed. Order status (Pending, Confirmed, Shipped,
        Delivered or Cancelled) is visible at any time from My Account → Orders.
      </PolicyP>

      <PolicyH2>Payment</PolicyH2>
      <PolicyP>
        We currently accept Cash on Delivery (COD) and Easypaisa. For Easypaisa orders, payment is
        confirmed once you submit your transaction ID and our team verifies it against the order.
      </PolicyP>

      <PolicyH2>Cancellations</PolicyH2>
      <PolicyP>
        An order can be cancelled from My Account while it is still in Pending status. Once an order
        has been confirmed and moved forward in processing, it can no longer be cancelled through
        self-service — contact our support team if you have a time-sensitive concern about a
        confirmed order.
      </PolicyP>

      <PolicyH2>Delivery</PolicyH2>
      <PolicyP>
        We deliver nationwide across Pakistan. See our{" "}
        <Link href="/shipping" className="font-semibold text-royal hover:text-royal-600">
          Shipping Information
        </Link>{" "}
        page for typical delivery timing.
      </PolicyP>

      <PolicyH2>Returns &amp; Refunds</PolicyH2>
      <PolicyP>
        Return eligibility, how to request a return, and how refunds are handled are covered in our{" "}
        <Link href="/returns" className="font-semibold text-royal hover:text-royal-600">
          Returns
        </Link>{" "}
        and{" "}
        <Link href="/policies/refunds" className="font-semibold text-royal hover:text-royal-600">
          Refund Policy
        </Link>{" "}
        pages.
      </PolicyP>

      <PolicyH2>Your Account</PolicyH2>
      <PolicyList>
        <li>You&rsquo;re responsible for keeping your password confidential and for activity on your account.</li>
        <li>Please provide accurate information when creating an account or placing an order.</li>
        <li>Contact us immediately if you believe your account has been accessed without your permission.</li>
      </PolicyList>

      <PolicyH2>Acceptable Use</PolicyH2>
      <PolicyP>
        Please don&rsquo;t misuse the site — including attempting to place fraudulent orders, interfering
        with the site&rsquo;s normal operation, or submitting false or abusive reviews and messages.
      </PolicyP>

      <PolicyH2>Intellectual Property</PolicyH2>
      <PolicyP>
        Site content, including the i.Link name, logo and original text and imagery, belongs to
        i.Link Systems &amp; Solutions unless stated otherwise. Product names, brand names and logos
        shown on the site belong to their respective manufacturers and trademark owners.
      </PolicyP>

      <PolicyH2>Governing Law</PolicyH2>
      <PolicyP>
        i.Link Systems &amp; Solutions operates from Islamabad, Pakistan, and these terms are
        intended to be read consistently with the laws applicable in Pakistan.
      </PolicyP>

      <PolicyH2>Changes to These Terms</PolicyH2>
      <PolicyP>
        We may update these terms from time to time as the site changes. The date at the top of this
        page reflects the most recent update.
      </PolicyP>

      <PolicyH2>Contact Us</PolicyH2>
      <PolicyP>
        Questions about these terms? Please{" "}
        <Link href="/contact" className="font-semibold text-royal hover:text-royal-600">
          contact us
        </Link>
        .
      </PolicyP>
    </PolicyPage>
  );
}
