import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import ResetPasswordForm from "@/components/sections/reset-password-form";
import { checkResetTokenValid } from "./actions";
import { RESET_TOKEN_EXPIRY_MINUTES } from "@/lib/reset-token";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export const metadata: Metadata = {
  title: "Reset Your Password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const tokenParam = Array.isArray(params.token) ? params.token[0] : params.token;

  // Read-only — decides what to render only, never consumes the token.
  // See checkResetTokenValid's own doc comment: the actual submission
  // below independently re-validates and atomically consumes the token
  // regardless of what this check found.
  const tokenValid = Boolean(tokenParam) && (await checkResetTokenValid(tokenParam as string));

  return (
    <div className="py-20 sm:py-24">
      <Container>
        <SectionHeading
          as="h1"
          eyebrow="Account Security"
          title="Reset Your Password"
          description={tokenValid ? "Choose a new password for your account below." : undefined}
        />

        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-light-gray bg-white p-6 premium-shadow sm:p-8">
          {tokenValid ? (
            <ResetPasswordForm token={tokenParam as string} />
          ) : (
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10 text-error">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-navy">Invalid or Expired Link</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
                This password reset link is invalid, has already been used, or has expired. Reset
                links are only valid for {RESET_TOKEN_EXPIRY_MINUTES} minutes after they&rsquo;re
                requested.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-royal px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-royal-600"
              >
                Request a New Link
              </Link>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
