"use client";

import { useActionState } from "react";
import Card from "@/components/ui/card";
import { cancelOrder, type CancelOrderState } from "@/app/(storefront)/account/orders/[id]/actions";

const initialState: CancelOrderState = {};

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const [state, formAction, isPending] = useActionState(cancelOrder, initialState);

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <form action={formAction}>
        <input type="hidden" name="orderId" value={orderId} />
        {state.error && (
          <p role="alert" className="mb-3 text-xs font-medium text-error">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          onClick={(event) => {
            if (!window.confirm("Are you sure you want to cancel this order?")) {
              event.preventDefault();
            }
          }}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-error/30 px-5 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/5 disabled:opacity-50"
        >
          {isPending ? "Cancelling…" : "Cancel Order"}
        </button>
      </form>
    </Card>
  );
}
