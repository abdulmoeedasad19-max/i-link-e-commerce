import type { Metadata } from "next";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import QuotationForm from "@/components/sections/quotation-form";
import { getProductBySlug } from "@/lib/products-repository";

type QuotationPageProps = {
  searchParams: Promise<{ product?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Request a Quotation",
  description:
    "Request a custom quotation for bulk, corporate or enterprise IT procurement from i.Link Systems & Solutions.",
  robots: { index: false, follow: true },
};

export default async function QuotationPage({ searchParams }: QuotationPageProps) {
  const { product: productParam } = await searchParams;
  const slug = Array.isArray(productParam) ? productParam[0] : productParam;
  const product = slug ? await getProductBySlug(slug) : null;

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Business Solutions"
          title="Request a Quotation"
          description="Tell us what you need and our business team will follow up with a custom quotation — for a single bulk order or an ongoing procurement relationship."
          align="left"
          className="mx-0 text-left"
        />

        <div className="mt-10 max-w-2xl rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          <QuotationForm initialRequirement={product ? product.name : ""} />
        </div>
      </Container>
    </div>
  );
}
