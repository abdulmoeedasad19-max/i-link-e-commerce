"use client";

import { useEffect, useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createAddress, updateAddress, type AddressState } from "@/app/(storefront)/account/addresses/actions";

const initialState: AddressState = {};

export type AddressFormValues = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
};

const emptyValues: AddressFormValues = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postalCode: "",
  phone: "",
  isDefault: false,
};

export default function AddressForm({
  mode,
  addressId,
  initialValues,
  isCurrentDefault = false,
  onSuccess,
  onCancel,
}: {
  mode: "create" | "edit";
  addressId?: string;
  initialValues?: AddressFormValues;
  isCurrentDefault?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const action = mode === "edit" ? updateAddress : createAddress;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};
  const values = initialValues ?? emptyValues;

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
    // Fire only when a fresh success arrives from the action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form
      action={formAction}
      className="space-y-5 rounded-2xl border border-light-gray bg-soft-gray/60 p-5 sm:p-6"
    >
      {mode === "edit" && addressId && <input type="hidden" name="addressId" value={addressId} />}

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="address-label" label="Label" required error={errors.label}>
          <input
            id="address-label"
            name="label"
            type="text"
            required
            placeholder="e.g. Home, Office"
            defaultValue={values.label}
            aria-invalid={Boolean(errors.label)}
            aria-describedby={errors.label ? "address-label-error" : undefined}
            className={inputClass(Boolean(errors.label))}
          />
        </Field>

        <Field id="address-phone" label="Phone" required error={errors.phone}>
          <input
            id="address-phone"
            name="phone"
            type="tel"
            required
            defaultValue={values.phone}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "address-phone-error" : undefined}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>
      </div>

      <Field id="address-line1" label="Address Line 1" required error={errors.line1}>
        <input
          id="address-line1"
          name="line1"
          type="text"
          required
          defaultValue={values.line1}
          autoComplete="address-line1"
          aria-invalid={Boolean(errors.line1)}
          aria-describedby={errors.line1 ? "address-line1-error" : undefined}
          className={inputClass(Boolean(errors.line1))}
        />
      </Field>

      <Field id="address-line2" label="Address Line 2 (optional)" error={errors.line2}>
        <input
          id="address-line2"
          name="line2"
          type="text"
          defaultValue={values.line2}
          autoComplete="address-line2"
          aria-invalid={Boolean(errors.line2)}
          aria-describedby={errors.line2 ? "address-line2-error" : undefined}
          className={inputClass(Boolean(errors.line2))}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="address-city" label="City" required error={errors.city}>
          <input
            id="address-city"
            name="city"
            type="text"
            required
            defaultValue={values.city}
            autoComplete="address-level2"
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "address-city-error" : undefined}
            className={inputClass(Boolean(errors.city))}
          />
        </Field>

        <Field id="address-province" label="Province" required error={errors.province}>
          <input
            id="address-province"
            name="province"
            type="text"
            required
            defaultValue={values.province}
            autoComplete="address-level1"
            aria-invalid={Boolean(errors.province)}
            aria-describedby={errors.province ? "address-province-error" : undefined}
            className={inputClass(Boolean(errors.province))}
          />
        </Field>

        <Field id="address-postal-code" label="Postal Code" required error={errors.postalCode}>
          <input
            id="address-postal-code"
            name="postalCode"
            type="text"
            required
            defaultValue={values.postalCode}
            autoComplete="postal-code"
            aria-invalid={Boolean(errors.postalCode)}
            aria-describedby={errors.postalCode ? "address-postal-code-error" : undefined}
            className={inputClass(Boolean(errors.postalCode))}
          />
        </Field>
      </div>

      {isCurrentDefault ? (
        <p className="text-sm font-medium text-slate">This is currently your default address.</p>
      ) : (
        <label className="flex items-center gap-2.5 text-sm font-semibold text-navy">
          <input
            type="checkbox"
            name="isDefault"
            defaultChecked={values.isDefault}
            className="h-4 w-4 rounded border-light-gray text-royal focus:ring-royal/30"
          />
          Set as default address
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Address"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
