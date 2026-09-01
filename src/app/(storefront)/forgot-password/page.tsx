import type { Metadata } from "next";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ForgotPasswordForm from "@/components/sections/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Account Security"
          title="Forgot Password"
          description="Enter your account email and we'll send you instructions to reset your password."
        />

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          <ForgotPasswordForm />
        </div>
      </Container>
    </div>
  );
}
