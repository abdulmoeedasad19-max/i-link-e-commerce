import type { Metadata } from "next";
import PolicyPage from "@/components/sections/policy-page";
import Accordion from "@/components/ui/accordion";
import { faqs, buildFaqJsonLd } from "@/lib/faq-data";
import { safeJsonLd } from "@/lib/utils";

const canonicalPath = "/faq";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about products, payment, delivery and returns at i.Link Systems & Solutions.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Frequently Asked Questions",
    description: "Answers to common questions about products, payment, delivery and returns.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Frequently Asked Questions",
    description: "Answers to common questions about products, payment, delivery and returns.",
  },
};

const faqJsonLd = buildFaqJsonLd(faqs);

export default function FaqPage() {
  return (
    <>
      {/* This page's own FAQPage JSON-LD, built from the same shared data
          the homepage FAQ section uses. It's scoped to this page only —
          the homepage renders its own single instance from the same
          source, so neither page ends up with duplicate JSON-LD. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <PolicyPage
        eyebrow="Frequently Asked Questions"
        title="Answers to Common Questions"
        description="Everything you need to know before buying — if you can't find your answer here, our support team is one message away."
      >
        <Accordion items={faqs} />
      </PolicyPage>
    </>
  );
}
