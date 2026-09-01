import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import LoginForm from "@/components/sections/login-form";
import { auth } from "@/auth";
import { isSafeCallbackUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your i.Link Systems & Solutions account.",
  robots: { index: false, follow: true },
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Server-side session check via Auth.js's own auth() — never trust
  // client-side session state for this decision.
  const session = await auth();
  if (session) {
    redirect("/account");
  }

  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const candidate = Array.isArray(rawCallbackUrl) ? rawCallbackUrl[0] : rawCallbackUrl;
  const callbackUrl = isSafeCallbackUrl(candidate) ? candidate : "/account";

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Welcome Back"
          title="Log In"
          description="Log in to your account to check out faster and track your orders."
          align="left"
          className="mx-0 max-w-md text-left"
        />

        <div className="mt-10 max-w-md rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </Container>
    </div>
  );
}
