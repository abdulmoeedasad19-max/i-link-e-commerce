"use client";

// Master Phase — Production Security Hardening. Last-resort fallback,
// used only when an error occurs in the root layout itself (both
// src/app/(storefront)/layout.tsx and src/app/admin/layout.tsx are each
// their own independent root layout — see admin/layout.tsx's own
// comment on why). This replaces the entire document, so it renders its
// own <html>/<body> rather than relying on either layout, and stays
// deliberately minimal — no Header/Footer/AdminShell, no font loader, no
// design-system components that could themselves be implicated in
// whatever broke the root layout. Never renders `error.message` — see
// src/app/(storefront)/error.tsx for the full rationale.
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global] unhandled error:", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 text-dark-slate antialiased">
        <div className="flex max-w-md flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-navy">Something Went Wrong</h1>
          <p className="mt-3 leading-relaxed text-slate">
            We hit an unexpected error. Please try refreshing the page.
          </p>
          {/* A plain <a> is deliberate here, not an oversight: this
              component replaces the entire document because the root
              layout itself errored, so a full page navigation is the
              safest recovery path — next/link's client-side routing
              would re-enter the same potentially-broken React tree. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="mt-8 inline-flex items-center justify-center rounded-[10px] bg-royal px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-royal-600"
          >
            Back to Home
          </a>
        </div>
      </body>
    </html>
  );
}
