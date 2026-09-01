"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import { refundOrder } from "@/app/admin/orders/actions";

/**
 * Renders inline in the Payment Status card (src/app/admin/orders/[id]/
 * page.tsx) only when paymentStatus === PAID, for any payment method —
 * the business rule is "this order is PAID," not "this order used
 * Easypaisa." Deliberately separate from the generic PaymentStatusControl
 * dropdown already on the same page: that control stays untouched and can
 * still move PAID -> REFUNDED directly, without a captured reason. This
 * component is the guided path that requires one.
 */
export default function RefundOrder({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleRefund = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Refund reason must be at least 3 characters.");
      return;
    }
    if (
      !window.confirm(
        "Record this payment as manually refunded? This does not send money through any payment gateway — it only records that a refund has already happened outside this system. This cannot be undone.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await refundOrder(orderId, trimmed);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="mt-4 border-t border-light-gray pt-4">
      <p className="text-xs font-semibold text-slate">Record Manual Refund</p>
      <p className="mt-1 text-xs text-slate">
        This records that the payment has been refunded manually. No payment gateway transaction will be initiated.
      </p>

      <div className="mt-3">
        <label htmlFor={`refund-reason-${orderId}`} className="mb-1.5 block text-xs font-semibold text-slate">
          Refund Reason
        </label>
        <textarea
          id={`refund-reason-${orderId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={isPending}
          rows={2}
          maxLength={500}
          placeholder="e.g. Customer requested cancellation after payment."
          className={inputClass(Boolean(error))}
        />
      </div>

      <div className="mt-3">
        <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleRefund}>
          {isPending ? "Refunding…" : "Refund Payment"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
