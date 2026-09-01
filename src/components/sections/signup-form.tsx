"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { signup, type SignupState } from "@/app/(storefront)/signup/actions";

const initialState: SignupState = {};

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <Field id="signup-name" label="Full Name" required error={errors.name}>
        <input
          id="signup-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          className={inputClass(Boolean(errors.name))}
        />
      </Field>

      <Field id="signup-email" label="Email" required error={errors.email}>
        <input
          id="signup-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          className={inputClass(Boolean(errors.email))}
        />
      </Field>

      <Field id="signup-phone" label="Phone" required error={errors.phone}>
        <input
          id="signup-phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "signup-phone-error" : undefined}
          className={inputClass(Boolean(errors.phone))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="signup-password" label="Password" required error={errors.password}>
          <input
            id="signup-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            className={inputClass(Boolean(errors.password))}
          />
        </Field>

        <Field
          id="signup-confirmPassword"
          label="Confirm Password"
          required
          error={errors.confirmPassword}
        >
          <input
            id="signup-confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "signup-confirmPassword-error" : undefined}
            className={inputClass(Boolean(errors.confirmPassword))}
          />
        </Field>
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Creating Account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-slate">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-royal hover:text-royal-600">
          Log in
        </Link>
      </p>
    </form>
  );
}
