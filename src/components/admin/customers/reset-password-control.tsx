"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { resetCustomerPassword } from "@/app/admin/customers/actions";

/**
 * Admin-assisted manual password recovery (Phase 4.4.17) — a trusted-admin
 * override for a customer who can't sign in, matching the same "no
 * gateway, a human handles it" philosophy as Easypaisa confirmation and
 * refunds. The admin communicates the new password to the customer
 * directly (phone, WhatsApp, in person); nothing here emails or displays
 * it back after submission.
 */
export default function ResetPasswordControl({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = () => {
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (
      !window.confirm(
        "Reset this customer's password? Their current password will stop working immediately. You will need to tell them the new password yourself — it will not be shown again after this.",
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await resetCustomerPassword(userId, newPassword, confirmPassword);
      if (result?.error) {
        setError(result.error);
      } else {
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(true);
      }
    });
  };

  if (isSelf) {
    return <p className="text-sm text-slate">Use your own account&rsquo;s Change Password option instead.</p>;
  }

  return (
    <div>
      <p className="text-sm text-slate">
        Sets a new password for this customer immediately. You&rsquo;ll need to communicate it to them yourself —
        no email is sent, and the password is never shown again after this.
      </p>

      <div className="mt-4 space-y-4">
        <Field id="reset-password-new" label="New Password" required>
          <input
            id="reset-password-new"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isPending}
            minLength={8}
            autoComplete="new-password"
            className={inputClass(false)}
          />
        </Field>

        <Field id="reset-password-confirm" label="Confirm New Password" required>
          <input
            id="reset-password-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isPending}
            minLength={8}
            autoComplete="new-password"
            className={inputClass(false)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleReset}>
          {isPending ? "Resetting…" : "Reset Password"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Password reset. Tell the customer their new password directly.
        </p>
      )}
    </div>
  );
}
