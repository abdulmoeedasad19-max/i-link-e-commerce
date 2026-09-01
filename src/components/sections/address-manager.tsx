"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import Button from "@/components/ui/button";
import AddressForm from "@/components/sections/address-form";
import AddressCard, { type AddressListItem } from "@/components/sections/address-card";

export default function AddressManager({ addresses }: { addresses: AddressListItem[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (addresses.length === 0 && !isAdding) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-light-gray bg-soft-gray px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
          <MapPin className="h-7 w-7" aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-navy">You don&apos;t have any saved addresses yet</h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate">
          Save an address to make checkout faster next time.
        </p>
        <Button variant="primary" size="md" className="mt-6" onClick={() => setIsAdding(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add New Address
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isAdding ? (
        <AddressForm mode="create" onSuccess={() => setIsAdding(false)} onCancel={() => setIsAdding(false)} />
      ) : (
        <div className="flex justify-end">
          <Button variant="primary" size="md" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add New Address
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((address) =>
          editingId === address.id ? (
            <AddressForm
              key={address.id}
              mode="edit"
              addressId={address.id}
              initialValues={address}
              isCurrentDefault={address.isDefault}
              onSuccess={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <AddressCard key={address.id} address={address} onEdit={() => setEditingId(address.id)} />
          ),
        )}
      </div>
    </div>
  );
}
