"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import Container from "@/components/ui/container";
import Button from "@/components/ui/button";
import FadeIn from "@/components/ui/fade-in";
import { subscribeToNewsletter, type NewsletterState } from "@/app/(storefront)/newsletter/actions";

const initialState: NewsletterState = {};

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState(subscribeToNewsletter, initialState);

  return (
    <section aria-labelledby="newsletter-heading" className="bg-white py-16 sm:py-20">
      <Container>
        <FadeIn className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-800 to-royal-700 px-6 py-14 text-center sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto flex max-w-xl flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky/15 text-sky">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 id="newsletter-heading" className="mt-5 text-balance text-2xl font-bold text-white sm:text-3xl">
              Stay Updated with the Latest Technology Deals
            </h2>
            <p className="mt-3 text-balance text-white/70">
              Subscribe for exclusive offers, new arrivals and enterprise IT insights — no spam,{" "}
              <Link href="/unsubscribe" className="underline underline-offset-2 hover:text-white">
                unsubscribe anytime
              </Link>
              .
            </p>

            {state.success ? (
              <div className="mt-7 flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                You&apos;re subscribed! Watch your inbox for the latest deals.
              </div>
            ) : (
              <form action={formAction} className="mt-7 flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <div className="w-full flex-1 text-left">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(state.error)}
                    aria-describedby={state.error ? "newsletter-email-error" : undefined}
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/50 outline-none transition-colors focus:border-sky focus:ring-2 focus:ring-sky/30"
                  />
                  {state.error && (
                    <p id="newsletter-email-error" role="alert" className="mt-2 text-xs font-medium text-white/90">
                      {state.error}
                    </p>
                  )}
                </div>
                <Button type="submit" variant="light" size="md" className="shrink-0" disabled={isPending}>
                  {isPending ? "Subscribing…" : "Subscribe"}
                </Button>
              </form>
            )}
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
