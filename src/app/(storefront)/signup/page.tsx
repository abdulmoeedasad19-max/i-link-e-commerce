import type { Metadata } from "next";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import SignupForm from "@/components/sections/signup-form";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Create a customer account with i.Link Systems & Solutions.",
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Create an Account"
          title="Sign Up"
          description="Create a customer account to check out faster and track your orders."
          align="left"
          className="mx-0 max-w-md text-left"
        />

        <div className="mt-10 max-w-md rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          <SignupForm />
        </div>
      </Container>
    </div>
  );
}
