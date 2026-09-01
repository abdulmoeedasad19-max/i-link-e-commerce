"use client";

// Master Phase — Production Security Hardening. Branded fallback for any
// unhandled runtime error within the admin section — see
// src/app/(storefront)/error.tsx for the customer-facing equivalent and
// the full rationale for never rendering `error.message` here.
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/button";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin] unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-error/10 text-error">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-2xl font-bold text-navy">Something Went Wrong</h1>
        <p className="mt-3 leading-relaxed text-slate">
          This admin page hit an unexpected error. Try again, or head back to the dashboard.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" variant="primary" size="lg" onClick={() => retry()}>
            Try Again
          </Button>
          <Button href="/admin" variant="secondary" size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
