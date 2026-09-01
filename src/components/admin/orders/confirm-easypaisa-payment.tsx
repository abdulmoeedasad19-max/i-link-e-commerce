"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import { confirmEasypaisaPayment } from "@/app/admin/orders/actions";

/**
 * Renders inline in the Payment Status card (src/app/admin/orders/[id]/
 * page.tsx) only for EASYPAISA orders — the transaction ID an admin
 * compares against their own Easypaisa account, plus the guided
 * confirmation action itself. Deliberately separate from the generic
 * PaymentStatusControl dropdown already on the same page: that control
 * stays untouched and still handles COD/other manual reconciliation and
 * FAILED/REFUNDED transitions.
 */
export default function ConfirmEasypaisaPayment({
  orderId,
  transactionId,
  isPaid,
}: {
  orderId: string;
  transactionId: string | null;
  isPaid: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (
      !window.confirm(
        "Confirm this Easypaisa payment? Only do this after manually verifying the transaction ID against the Easypaisa account. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await confirmEasypaisaPayment(orderId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="mt-4 border-t border-light-gray pt-4">
      <p className="text-xs font-semibold text-slate">Transaction ID</p>
      <p className="mt-1 text-sm font-semibold text-navy">
        {transactionId ? <span className="font-mono">{transactionId}</span> : "Transaction ID not submitted"}
      </p>

      {!isPaid && transactionId && (
        <div className="mt-3">
          <Button type="button" variant="primary" size="sm" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Confirming…" : "Confirm Payment"}
          </Button>
          <p className="mt-2 text-xs text-slate">
            Manually verify this transaction ID against the Easypaisa account before confirming.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
