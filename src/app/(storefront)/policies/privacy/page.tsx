import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage, { PolicyH2, PolicyP, PolicyList } from "@/components/sections/policy-page";
import { siteConfig } from "@/lib/site-config";

const canonicalPath = "/policies/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How i.Link Systems & Solutions collects, uses and protects your information when you create an account, place an order or contact us.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Privacy Policy",
    description: "How i.Link Systems & Solutions collects, uses and protects your information.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy",
    description: "How i.Link Systems & Solutions collects, uses and protects your information.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      eyebrow="Policies"
      title="Privacy Policy"
      description="How we collect, use and protect your information when you use this site."
      lastUpdated="August 20, 2026"
    >
      <PolicyP>
        This policy explains what information i.Link Systems &amp; Solutions (&ldquo;i.Link&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;)
        collects through this website and mobile-friendly storefront, and how that information is
        used. It covers only what this site and its account, ordering, review, contact and newsletter
        features actually do — it is not a generic template.
      </PolicyP>

      <PolicyH2>Information We Collect</PolicyH2>
      <PolicyP>We collect information you provide directly when you use the site, including:</PolicyP>
      <PolicyList>
        <li>
          <strong>Account information</strong> — your name, email address and password (stored as a
          secure hash, never in plain text) when you create an account.
        </li>
        <li>
          <strong>Order information</strong> — the products, quantities, prices and delivery address
          for each order you place, plus payment method and, for Easypaisa orders, the transaction ID
          you submit.
        </li>
        <li>
          <strong>Addresses</strong> — any shipping addresses you save to your account.
        </li>
        <li>
          <strong>Reviews</strong> — the rating, title and text you submit when reviewing a product.
        </li>
        <li>
          <strong>Contact and business inquiries</strong> — the name, email, phone and message you
          submit through our contact form or business quotation form.
        </li>
        <li>
          <strong>Newsletter</strong> — your email address, if you choose to subscribe.
        </li>
        <li>
          <strong>Cart and wishlist</strong> — the products you add, associated with your account or
          your current browser session.
        </li>
      </PolicyList>
      <PolicyP>
        We also use a session cookie to keep you signed in while you browse and shop, and we record
        sign-in attempts on your account to help detect and slow down abusive login activity.
      </PolicyP>

      <PolicyH2>How We Use Your Information</PolicyH2>
      <PolicyList>
        <li>To create and manage your account, and let you sign in securely.</li>
        <li>To process, fulfil and let you review the status and history of your orders.</li>
        <li>
          To review and respond to return requests submitted for eligible orders, and to record the
          outcome of that review.
        </li>
        <li>To respond to messages sent through our contact form and business quotation form.</li>
        <li>To moderate reviews before they are published, so the reviews shown are genuine.</li>
        <li>To send newsletter emails, only if you subscribe.</li>
        <li>To maintain the security of accounts and detect suspicious sign-in activity.</li>
      </PolicyList>

      <PolicyH2>Information Sharing</PolicyH2>
      <PolicyP>
        We do not sell your personal information. Your order and account information is used
        internally by i.Link to fulfil and support your order, and is not shared with third parties
        for marketing purposes.
      </PolicyP>

      <PolicyH2>Data Retention</PolicyH2>
      <PolicyP>
        We keep order records, including order and return history, for as long as needed for
        accounting, warranty and customer-support purposes. You can update your account details and
        addresses, or change your password, at any time from My Account.
      </PolicyP>

      <PolicyH2>Your Choices</PolicyH2>
      <PolicyList>
        <li>Update your name, email or password from your account profile.</li>
        <li>Add, edit or remove saved addresses from your account.</li>
        <li>
          Stop receiving newsletter emails at any time using our{" "}
          <Link href="/unsubscribe" className="font-semibold text-royal hover:text-royal-600">
            unsubscribe page
          </Link>
          , or by contacting us at{" "}
          <a href={`mailto:${siteConfig.email}`} className="font-semibold text-royal hover:text-royal-600">
            {siteConfig.email}
          </a>{" "}
          and we will remove your email address from our mailing list.
        </li>
      </PolicyList>

      <PolicyH2>Security</PolicyH2>
      <PolicyP>
        Passwords are never stored in plain text — they are hashed before being saved. Repeated
        failed sign-in attempts on an account are automatically rate-limited to help protect against
        unauthorized access.
      </PolicyP>

      <PolicyH2>Changes to This Policy</PolicyH2>
      <PolicyP>
        We may update this policy from time to time as the site changes. The date at the top of this
        page reflects the most recent update.
      </PolicyP>

      <PolicyH2>Contact Us</PolicyH2>
      <PolicyP>
        If you have any questions about this policy or how your information is handled, please{" "}
        <Link href="/contact" className="font-semibold text-royal hover:text-royal-600">
          contact us
        </Link>
        .
      </PolicyP>
    </PolicyPage>
  );
}
