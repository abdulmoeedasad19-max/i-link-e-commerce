"use client";

// Master Phase — Production Security Hardening. Branded fallback for any
// unhandled runtime error within the storefront route group, replacing
// Next.js's default unstyled error screen. Deliberately never renders
// `error.message` or any other detail from the `error` object — Next.js
// already redacts server-thrown error messages in production, but an
// error thrown client-side is not redacted the same way, so this
// component treats every error identically and shows only a generic,
// branded message, matching this app's own established convention of
// never exposing raw error detail to a customer (see e.g. every Server
// Action's `catch` block).
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Container from "@/components/ui/container";
import Button from "@/components/ui/button";

export default function StorefrontError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // Client-side only (this user's own browser console) — never sent
    // anywhere, never rendered in the page itself.
    console.error("[storefront] unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center py-20 sm:py-24">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Something Went Wrong</h1>
          <p className="mt-3 leading-relaxed text-slate">
            We hit an unexpected error loading this page. Please try again, or head back to the
            homepage.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="primary" size="lg" onClick={() => retry()}>
              Try Again
            </Button>
            <Button href="/" variant="secondary" size="lg">
              Back to Home
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
