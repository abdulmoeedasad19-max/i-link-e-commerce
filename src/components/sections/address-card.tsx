"use client";

import { useActionState } from "react";
import { Pencil, Star, Trash2 } from "lucide-react";
import { deleteAddress, setDefaultAddress, type SimpleActionState } from "@/app/(storefront)/account/addresses/actions";
import type { AddressFormValues } from "@/components/sections/address-form";

const initialState: SimpleActionState = {};

export type AddressListItem = AddressFormValues & { id: string };

export default function AddressCard({
  address,
  onEdit,
}: {
  address: AddressListItem;
  onEdit: () => void;
}) {
  const [deleteState, deleteFormAction, isDeleting] = useActionState(deleteAddress, initialState);
  const [defaultState, defaultFormAction, isSettingDefault] = useActionState(
    setDefaultAddress,
    initialState,
  );

  return (
    <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-navy">{address.label}</h3>
            {address.isDefault && (
              <span className="inline-flex items-center gap-1 rounded-full bg-royal/10 px-2.5 py-0.5 text-xs font-semibold text-royal">
                <Star className="h-3 w-3" aria-hidden="true" />
                Default
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.province} {address.postalCode}
            <br />
            {address.phone}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-light-gray px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-royal/40 hover:text-royal"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </button>

          {!address.isDefault && (
            <form action={defaultFormAction}>
              <input type="hidden" name="addressId" value={address.id} />
              <button
                type="submit"
                disabled={isSettingDefault}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-light-gray px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-royal/40 hover:text-royal disabled:opacity-50"
              >
                {isSettingDefault ? "Setting…" : "Set as Default"}
              </button>
            </form>
          )}

          <form action={deleteFormAction}>
            <input type="hidden" name="addressId" value={address.id} />
            <button
              type="submit"
              disabled={isDeleting}
              onClick={(event) => {
                if (!window.confirm("Delete this address? This cannot be undone.")) {
                  event.preventDefault();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-light-gray px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:border-error/40 hover:bg-error/5 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </form>
        </div>
      </div>

      {(deleteState.error ?? defaultState.error) && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {deleteState.error ?? defaultState.error}
        </p>
      )}
    </div>
  );
}
