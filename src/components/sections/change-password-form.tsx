"use client";

import { useActionState, useEffect, useRef } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { changePassword, type ChangePasswordState } from "@/app/(storefront)/account/profile/actions";

const initialState: ChangePasswordState = {};

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const errors = state.errors ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Password fields must never retain a stale value after a successful
  // change — clearing via the DOM form reset here, not by controlling each
  // input's value, so this stays a plain uncontrolled form like every other
  // form in this codebase.
  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.success && (
        <div
          role="status"
          className="rounded-[10px] border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          Password changed successfully.
        </div>
      )}
      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <Field id="change-password-current" label="Current Password" required error={errors.currentPassword}>
        <input
          id="change-password-current"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={Boolean(errors.currentPassword)}
          aria-describedby={errors.currentPassword ? "change-password-current-error" : undefined}
          className={inputClass(Boolean(errors.currentPassword))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="change-password-new" label="New Password" required error={errors.newPassword}>
          <input
            id="change-password-new"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={errors.newPassword ? "change-password-new-error" : undefined}
            className={inputClass(Boolean(errors.newPassword))}
          />
        </Field>

        <Field id="change-password-confirm" label="Confirm New Password" required error={errors.confirmPassword}>
          <input
            id="change-password-confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "change-password-confirm-error" : undefined}
            className={inputClass(Boolean(errors.confirmPassword))}
          />
        </Field>
      </div>

      <p className="text-xs text-slate">Your new password will replace your current password immediately. Must be at least 8 characters.</p>

      <Button type="submit" variant="primary" size="md" disabled={isPending}>
        {isPending ? "Changing…" : "Change Password"}
      </Button>
    </form>
  );
}
