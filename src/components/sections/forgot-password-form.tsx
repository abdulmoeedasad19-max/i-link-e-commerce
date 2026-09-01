"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Mail } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { requestPasswordReset, type ForgotPasswordState } from "@/app/(storefront)/forgot-password/actions";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [state, formAction, isPending] = useActionState(requestPasswordReset, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-navy">Check Your Email</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          If an account exists for that email, you&rsquo;ll receive password reset instructions
          shortly. The link will expire in 30 minutes.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-light-gray bg-soft-gray px-4 py-3.5">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-slate">
          Enter the email address on your account and we&rsquo;ll send you a link to reset your
          password.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {state.error}
        </div>
      )}

      <Field id="forgot-password-email" label="Email Address" required>
        <input
          id="forgot-password-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={inputClass(Boolean(state.error))}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Sending…" : "Send Reset Link"}
      </Button>

      <p className="text-center text-sm text-slate">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-royal hover:text-royal-600">
          Log in
        </Link>
      </p>
    </form>
  );
}
