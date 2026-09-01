"use client";

import { useActionState, useEffect, useState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { updateStoreSettings, type UpdateStoreSettingsState } from "@/app/admin/settings/actions";

const initialState: UpdateStoreSettingsState = {};

export type StoreSettingsFormValues = {
  storeName: string;
  phone: string;
  email: string;
  hours: string;
  shippingCost: number;
  easypaisaAccountName: string;
  easypaisaNumber: string;
  easypaisaQrCode: string;
  easypaisaInstructions: string;
};

export default function StoreSettingsForm({ settings }: { settings: StoreSettingsFormValues }) {
  const [state, formAction, isPending] = useActionState(updateStoreSettings, initialState);
  const errors = state.errors ?? {};

  // Transient success banner — mirrors the "stay on page, show inline
  // feedback" pattern already established by InventoryStockControl
  // (src/components/admin/inventory/inventory-stock-control.tsx), since a
  // settings save has no natural list page to redirect back to. Whether to
  // *show* the banner is decided during render (React's documented pattern
  // for "respond to a value changing," same as InventoryStockControl and
  // this project's set-state-in-effect lint rule) — the effect below only
  // subscribes to the resulting timer and calls setState from its callback,
  // never synchronously in the effect body itself.
  const [prevState, setPrevState] = useState(state);
  const [showSaved, setShowSaved] = useState(false);
  if (state !== prevState) {
    setPrevState(state);
    setShowSaved(Boolean(state.success));
  }

  useEffect(() => {
    if (!showSaved) return;
    const timer = setTimeout(() => setShowSaved(false), 4000);
    return () => clearTimeout(timer);
  }, [showSaved]);

  return (
    <form action={formAction} className="space-y-6">
      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      {showSaved && (
        <div
          role="status"
          className="rounded-[10px] border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          Settings saved.
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Store Information</h2>
        <div className="mt-4 space-y-4">
          <Field id="settings-store-name" label="Store Name" required error={errors.storeName}>
            <input
              id="settings-store-name"
              name="storeName"
              type="text"
              required
              defaultValue={settings.storeName}
              aria-invalid={Boolean(errors.storeName)}
              className={inputClass(Boolean(errors.storeName))}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="settings-phone" label="Phone" required error={errors.phone}>
              <input
                id="settings-phone"
                name="phone"
                type="text"
                required
                defaultValue={settings.phone}
                aria-invalid={Boolean(errors.phone)}
                className={inputClass(Boolean(errors.phone))}
              />
            </Field>

            <Field id="settings-email" label="Email" required error={errors.email}>
              <input
                id="settings-email"
                name="email"
                type="email"
                required
                defaultValue={settings.email}
                aria-invalid={Boolean(errors.email)}
                className={inputClass(Boolean(errors.email))}
              />
            </Field>
          </div>

          <Field id="settings-hours" label="Business Hours" required error={errors.hours}>
            <input
              id="settings-hours"
              name="hours"
              type="text"
              required
              placeholder="e.g. Mon – Sat, 10:00 AM – 8:00 PM"
              defaultValue={settings.hours}
              aria-invalid={Boolean(errors.hours)}
              className={inputClass(Boolean(errors.hours))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Shipping</h2>
        <div className="mt-4">
          <Field id="settings-shipping-cost" label="Shipping Cost (PKR)" required error={errors.shippingCost}>
            <input
              id="settings-shipping-cost"
              name="shippingCost"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={settings.shippingCost}
              aria-invalid={Boolean(errors.shippingCost)}
              className={inputClass(Boolean(errors.shippingCost))}
            />
          </Field>
          <p className="mt-1.5 text-xs text-slate">
            A flat shipping cost applied to every order, in PKR — the store&rsquo;s only currency. Set to 0 for
            free shipping.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Easypaisa Payment</h2>
        <p className="mt-1 text-xs text-slate">
          Configure the account customers manually send Easypaisa payments to at checkout. Leave any field blank to
          hide that part of the payment instructions.
        </p>
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="settings-easypaisa-account-name"
              label="Easypaisa Account Name"
              error={errors.easypaisaAccountName}
            >
              <input
                id="settings-easypaisa-account-name"
                name="easypaisaAccountName"
                type="text"
                placeholder="e.g. i.Link System & Solutions"
                defaultValue={settings.easypaisaAccountName}
                aria-invalid={Boolean(errors.easypaisaAccountName)}
                className={inputClass(Boolean(errors.easypaisaAccountName))}
              />
            </Field>

            <Field id="settings-easypaisa-number" label="Easypaisa Number" error={errors.easypaisaNumber}>
              <input
                id="settings-easypaisa-number"
                name="easypaisaNumber"
                type="text"
                placeholder="03XX-XXXXXXX"
                defaultValue={settings.easypaisaNumber}
                aria-invalid={Boolean(errors.easypaisaNumber)}
                className={inputClass(Boolean(errors.easypaisaNumber))}
              />
            </Field>
          </div>

          <Field id="settings-easypaisa-qr-code" label="Easypaisa QR Code" error={errors.easypaisaQrCode}>
            <input
              id="settings-easypaisa-qr-code"
              name="easypaisaQrCode"
              type="text"
              placeholder="/payments/easypaisa-qr.png"
              defaultValue={settings.easypaisaQrCode}
              aria-invalid={Boolean(errors.easypaisaQrCode)}
              className={inputClass(Boolean(errors.easypaisaQrCode))}
            />
          </Field>
          <p className="-mt-2 text-xs text-slate">
            A path or URL to an existing image, same convention as Category/Brand images — there is no upload here.
          </p>

          <Field
            id="settings-easypaisa-instructions"
            label="Payment Instructions"
            error={errors.easypaisaInstructions}
          >
            <textarea
              id="settings-easypaisa-instructions"
              name="easypaisaInstructions"
              rows={3}
              placeholder="Send the exact order amount to the Easypaisa account above, then enter your Easypaisa Transaction ID below."
              defaultValue={settings.easypaisaInstructions}
              aria-invalid={Boolean(errors.easypaisaInstructions)}
              className={inputClass(Boolean(errors.easypaisaInstructions))}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
