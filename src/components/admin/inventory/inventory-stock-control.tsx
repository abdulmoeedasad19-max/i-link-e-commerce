"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { inputClass } from "@/components/ui/form-field";
import { updateProductStock, type UpdateProductStockState } from "@/app/admin/inventory/actions";

const initialState: UpdateProductStockState = {};

export default function InventoryStockControl({
  productId,
  stock,
  name,
}: {
  productId: string;
  stock: number;
  name: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentStock, setCurrentStock] = useState(stock);
  const [draftStock, setDraftStock] = useState(String(stock));
  const [state, formAction, isPending] = useActionState(updateProductStock, initialState);

  // Adjusted during render (React's documented pattern for "respond to a
  // value changing"), not in a useEffect — avoids an extra render pass and
  // this project's set-state-in-effect lint rule (see Phase 4.3.4).
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.success) {
      const parsedDraft = Number(draftStock);
      if (Number.isInteger(parsedDraft) && parsedDraft >= 0) {
        setCurrentStock(parsedDraft);
      }
      setIsEditing(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-navy">{currentStock}</span>
        <button
          type="button"
          onClick={() => {
            setDraftStock(String(currentStock));
            setIsEditing(true);
          }}
          aria-label={`Edit stock for ${name}`}
          title="Edit stock"
          className="rounded-lg p-1.5 text-slate transition-colors hover:bg-soft-gray hover:text-royal"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="expectedStock" value={currentStock} />
      <label htmlFor={`stock-${productId}`} className="sr-only">
        Stock quantity for {name}
      </label>
      <input
        id={`stock-${productId}`}
        type="number"
        name="stock"
        min={0}
        step={1}
        value={draftStock}
        onChange={(e) => setDraftStock(e.target.value)}
        disabled={isPending}
        aria-invalid={Boolean(state.error)}
        className={`${inputClass(Boolean(state.error))} w-20 py-1.5`}
      />
      <button
        type="submit"
        disabled={isPending}
        aria-label="Save stock"
        title="Save"
        className="rounded-lg p-1.5 text-success transition-colors hover:bg-success/10 disabled:opacity-50"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        disabled={isPending}
        aria-label="Cancel editing stock"
        title="Cancel"
        className="rounded-lg p-1.5 text-slate transition-colors hover:bg-soft-gray disabled:opacity-50"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      {state.error && (
        <p role="alert" className="w-full text-xs font-medium text-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
