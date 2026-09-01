"use client";

import { useActionState } from "react";
import Image from "next/image";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import {
  submitPaymentTransactionId,
  type SubmitPaymentTransactionIdState,
} from "@/app/(storefront)/account/orders/[id]/actions";
import { formatPrice } from "@/lib/utils";
import type { PaymentStatus } from "@/generated/prisma/enums";

const initialState: SubmitPaymentTransactionIdState = {};

export type EasypaisaSettingsInfo = {
  accountName: string | null;
  number: string | null;
  qrCode: string | null;
  instructions: string | null;
};

/**
 * Shown wherever a customer needs to see/act on an EASYPAISA order's
 * payment status: the checkout success page (right after the order is
 * created) and the account order detail page (any time afterward). Never
 * rendered for COD orders — see each call site's `paymentMethod ===
 * "EASYPAISA"` guard.
 */
export default function EasypaisaPaymentCard({
  orderId,
  total,
  paymentStatus,
  transactionId,
  settings,
}: {
  orderId: string;
  total: number;
  paymentStatus: PaymentStatus;
  transactionId: string | null;
  settings: EasypaisaSettingsInfo;
}) {
  const [state, formAction, isPending] = useActionState(submitPaymentTransactionId, initialState);

  if (paymentStatus === "PAID") {
    return (
      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="text-lg font-bold text-navy">Easypaisa Payment</h2>
        <p className="mt-3 text-sm font-semibold text-success">Payment confirmed.</p>
        {transactionId && (
          <p className="mt-1 text-xs text-slate">
            Transaction ID: <span className="font-mono">{transactionId}</span>
          </p>
        )}
      </Card>
    );
  }

  // The minimum an admin must configure before the customer can actually
  // be told where to send money. QR code and instructions are always
  // optional extras, shown only when present.
  const hasAccountDetails = Boolean(settings.accountName && settings.number);

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-navy">Pay with Easypaisa</h2>

      {hasAccountDetails ? (
        <>
          <p className="mt-3 text-sm text-slate">Send exactly</p>
          <p className="text-xl font-bold text-navy">{formatPrice(total)}</p>

          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate">Account Name</dt>
              <dd className="font-semibold text-navy">{settings.accountName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate">Number</dt>
              <dd className="font-semibold text-navy">{settings.number}</dd>
            </div>
          </dl>

          {settings.qrCode && (
            <div className="mt-4 flex justify-center">
              <Image
                src={settings.qrCode}
                alt="Easypaisa payment QR code"
                width={160}
                height={160}
                className="rounded-xl border border-light-gray object-contain"
              />
            </div>
          )}

          {settings.instructions && (
            <p className="mt-4 rounded-xl bg-soft-gray px-4 py-3 text-xs leading-relaxed text-slate">
              {settings.instructions}
            </p>
          )}

          <form action={formAction} className="mt-5 border-t border-light-gray pt-4">
            <label htmlFor={`transaction-id-${orderId}`} className="mb-1.5 block text-xs font-semibold text-slate">
              Transaction ID
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id={`transaction-id-${orderId}`}
                name="transactionId"
                type="text"
                required
                minLength={3}
                maxLength={100}
                defaultValue={transactionId ?? ""}
                placeholder="e.g. 8801234567890"
                className={`${inputClass(Boolean(state.error))} min-w-0 flex-1`}
              />
              <input type="hidden" name="orderId" value={orderId} />
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                {isPending ? "Submitting…" : transactionId ? "Update Transaction ID" : "Submit Transaction ID"}
              </Button>
            </div>
            {state.error && (
              <p role="alert" className="mt-2 text-xs font-medium text-error">
                {state.error}
              </p>
            )}
            {state.success && (
              <p role="status" className="mt-2 text-xs font-medium text-success">
                Transaction ID submitted. Your payment is pending verification.
              </p>
            )}
          </form>

          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gold">
            Payment status: Pending Verification
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm text-slate">
          Easypaisa payment details haven&rsquo;t been configured yet. Please contact us to complete your payment.
        </p>
      )}
    </Card>
  );
}
