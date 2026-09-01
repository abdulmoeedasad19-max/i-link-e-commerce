"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { paymentStatusLabel } from "@/lib/payment";
import { ALLOWED_PAYMENT_TRANSITIONS } from "@/lib/admin/payment-transitions";
import { updatePaymentStatus } from "@/app/admin/orders/actions";
import type { PaymentStatus } from "@/generated/prisma/enums";

// Same badge-variant convention as order-status.ts, chosen independently
// for payment meaning rather than reusing orderStatusVariant's mapping.
const paymentStatusVariant: Record<PaymentStatus, "royal" | "navy" | "success" | "gold" | "error"> = {
  PENDING: "gold",
  PAID: "success",
  FAILED: "error",
  REFUNDED: "navy",
};

export default function PaymentStatusControl({
  orderId,
  paymentStatus,
}: {
  orderId: string;
  paymentStatus: PaymentStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(paymentStatus);
  const [selected, setSelected] = useState<PaymentStatus>(paymentStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_PAYMENT_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  const handleSave = () => {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this order's payment status from ${paymentStatusLabel[currentStatus]} to ${paymentStatusLabel[selected]}? This is a manual reconciliation action — no payment gateway is involved.`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updatePaymentStatus(orderId, currentStatus, selected);
      if (result?.error) {
        setError(result.error);
        setSelected(currentStatus);
      } else {
        setCurrentStatus(selected);
        setSuccess(true);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">Current payment status:</span>
        <Badge variant={paymentStatusVariant[currentStatus]}>{paymentStatusLabel[currentStatus]}</Badge>
      </div>

      {isTerminal ? (
        <p className="mt-3 text-sm text-slate">
          This payment is in a final state and its status can no longer be changed.
        </p>
      ) : (
        <div className="mt-4">
          <label htmlFor="payment-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
            Change payment status to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="payment-status-select"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as PaymentStatus);
                setSuccess(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
            >
              <option value={currentStatus}>{paymentStatusLabel[currentStatus]} (current)</option>
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {paymentStatusLabel[next]}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending || selected === currentStatus}
              onClick={handleSave}
            >
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-slate">
            Manual reconciliation only — no payment gateway is connected to this store.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Payment status updated.
        </p>
      )}
    </div>
  );
}
