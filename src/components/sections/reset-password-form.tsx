"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { resetPassword, type ResetPasswordState } from "@/app/(storefront)/reset-password/actions";

const initialState: ResetPasswordState = {};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPassword, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-navy">Password Reset</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate">
          Your password has been changed, and you&rsquo;ve been signed out of all other sessions
          for your security. You can now log in with your new password.
        </p>
        <div className="mt-6">
          <Button href="/login" variant="primary" size="md">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {state.error}
        </div>
      )}

      <Field id="reset-new-password" label="New Password" required>
        <input
          id="reset-new-password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass(Boolean(state.error))}
        />
      </Field>

      <Field id="reset-confirm-password" label="Confirm New Password" required>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass(Boolean(state.error))}
        />
      </Field>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Resetting…" : "Reset Password"}
      </Button>
    </form>
  );
}
