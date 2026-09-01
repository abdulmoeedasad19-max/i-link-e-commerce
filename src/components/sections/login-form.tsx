"use client";

import { useActionState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { login, type LoginState } from "@/app/(storefront)/login/actions";

const initialState: LoginState = {};

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <Field id="login-email" label="Email" required error={errors.email}>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={inputClass(Boolean(errors.email))}
        />
      </Field>

      <Field id="login-password" label="Password" required error={errors.password}>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          className={inputClass(Boolean(errors.password))}
        />
        <div className="mt-2 text-right">
          <Link href="/forgot-password" className="text-sm font-semibold text-royal hover:text-royal-600">
            Forgot password?
          </Link>
        </div>
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Logging In…" : "Log In"}
      </Button>

      <p className="text-center text-sm text-slate">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-royal hover:text-royal-600">
          Sign up
        </Link>
      </p>
    </form>
  );
}
