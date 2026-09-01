"use client";

import { useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { updateProfile, type ProfileState } from "@/app/(storefront)/account/profile/actions";

const initialState: ProfileState = {};

export default function ProfileForm({
  initialName,
  initialPhone,
}: {
  initialName: string;
  initialPhone: string;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.success && (
        <div
          role="status"
          className="rounded-[10px] border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          Profile updated successfully.
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="profile-name" label="Full Name" required error={errors.name}>
          <input
            id="profile-name"
            name="name"
            type="text"
            required
            defaultValue={initialName}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
            className={inputClass(Boolean(errors.name))}
          />
        </Field>

        <Field id="profile-phone" label="Phone" required error={errors.phone}>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            required
            defaultValue={initialPhone}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "profile-phone-error" : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>
      </div>

      <Button type="submit" variant="primary" size="md" disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}
