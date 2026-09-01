import SectionHeading from "@/components/ui/section-heading";
import Container from "@/components/ui/container";
import FadeIn from "@/components/ui/fade-in";
import Accordion from "@/components/ui/accordion";
import { faqs, buildFaqJsonLd } from "@/lib/faq-data";
import { safeJsonLd } from "@/lib/utils";

const faqJsonLd = buildFaqJsonLd(faqs);

export default function FAQ() {
  return (
    <section aria-labelledby="faq-heading" className="bg-soft-gray py-20 sm:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
      />
      <Container>
        <SectionHeading
          headingId="faq-heading"
          eyebrow="Frequently Asked Questions"
          title="Answers to Common Questions"
          description="Everything you need to know before buying — if you can't find your answer here, our support team is one message away."
        />

        <FadeIn className="mx-auto mt-12 max-w-3xl">
          <Accordion items={faqs} />
        </FadeIn>
      </Container>
    </section>
  );
}
