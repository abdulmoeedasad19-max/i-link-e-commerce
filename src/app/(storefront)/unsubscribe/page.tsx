import type { Metadata } from "next";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import UnsubscribeForm from "@/components/sections/unsubscribe-form";
import { verifyUnsubscribeToken, normalizeEmail } from "@/lib/newsletter-unsubscribe";

type UnsubscribePageProps = {
  searchParams: Promise<{ email?: string | string[]; token?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Unsubscribe from Newsletter",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;
  const emailParam = Array.isArray(params.email) ? params.email[0] : params.email;
  const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;

  // Verified here purely to decide what to pre-fill/render — never the
  // security boundary itself. The Server Action re-verifies the token
  // independently on every submit regardless of what this page renders.
  const tokenValid = Boolean(
    emailParam && tokenParam && verifyUnsubscribeToken(normalizeEmail(emailParam), tokenParam),
  );

  return (
    <div className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Newsletter"
          title="Unsubscribe"
          description="We're sorry to see you go. You can remove your email from our newsletter list below."
        />

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          <UnsubscribeForm
            initialEmail={tokenValid ? emailParam : ""}
            token={tokenValid ? tokenParam : undefined}
          />
        </div>
      </Container>
    </div>
  );
}
