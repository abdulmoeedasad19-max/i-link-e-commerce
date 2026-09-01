"use client";

import { useActionState } from "react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import { submitReturnRequest, type SubmitReturnRequestState } from "@/app/(storefront)/account/orders/[id]/actions";
import { returnStatusLabel, returnStatusVariant } from "@/lib/return-status";
import type { ReturnStatus } from "@/generated/prisma/enums";

const initialState: SubmitReturnRequestState = {};

export type LatestReturnRequest = {
  status: ReturnStatus;
  reason: string;
  rejectionReason: string | null;
  createdAt: string;
};

/**
 * Shown on the account order detail page only when relevant — either the
 * order is currently eligible for a new request, or a past request exists
 * to show the status of. This is a REQUEST only: approval never means a
 * refund has happened (see the explicit note in the APPROVED branch
 * below), and this component never touches order/payment state itself.
 */
export default function ReturnRequestSection({
  orderId,
  canSubmit,
  latestRequest,
}: {
  orderId: string;
  canSubmit: boolean;
  latestRequest: LatestReturnRequest | null;
}) {
  const [state, formAction, isPending] = useActionState(submitReturnRequest, initialState);

  const showForm = canSubmit && !state.success;

  return (
    <Card hover={false} className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-navy">Return Request</h2>
      <p className="mt-1 text-xs text-slate">
        Returns are available within 7 days of delivery for eligible unused products in original
        packaging. Defective items are covered under manufacturer warranty — see our Warranty Policy.
      </p>

      {latestRequest && (
        <div className="mt-4 rounded-xl border border-light-gray p-3.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy">Request status:</span>
            <Badge variant={returnStatusVariant[latestRequest.status]}>{returnStatusLabel[latestRequest.status]}</Badge>
          </div>
          <p className="mt-2 text-xs text-slate">
            Reason: <span className="text-dark-slate">{latestRequest.reason}</span>
          </p>
          {latestRequest.status === "APPROVED" && (
            <p className="mt-2 text-xs font-medium text-success">
              Your return request has been approved. Refund processing (if applicable) is handled separately.
            </p>
          )}
          {latestRequest.status === "REJECTED" && latestRequest.rejectionReason && (
            <p className="mt-2 text-xs text-slate">
              Admin note: <span className="text-dark-slate">{latestRequest.rejectionReason}</span>
            </p>
          )}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="mt-4 rounded-[10px] border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success"
        >
          Return request submitted. It&rsquo;s pending review.
        </div>
      )}

      {showForm && (
        <form action={formAction} className="mt-4 space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <label htmlFor="return-request-reason" className="mb-1.5 block text-xs font-semibold text-slate">
              Reason for return
            </label>
            <textarea
              id="return-request-reason"
              name="reason"
              rows={3}
              required
              minLength={3}
              maxLength={1000}
              placeholder="e.g. Wrong size, changed my mind, item arrived defective…"
              className={inputClass(Boolean(state.error))}
            />
          </div>
          {state.error && (
            <p role="alert" className="text-xs font-medium text-error">
              {state.error}
            </p>
          )}
          <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
            {isPending ? "Submitting…" : "Request Return"}
          </Button>
        </form>
      )}
    </Card>
  );
}
