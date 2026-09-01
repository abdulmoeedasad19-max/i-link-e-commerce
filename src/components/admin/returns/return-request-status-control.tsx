"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { inputClass } from "@/components/ui/form-field";
import { returnStatusLabel, returnStatusVariant } from "@/lib/return-status";
import { ALLOWED_RETURN_TRANSITIONS } from "@/lib/admin/return-transitions";
import { updateReturnRequestStatus } from "@/app/admin/returns/actions";
import type { ReturnStatus } from "@/generated/prisma/enums";

export default function ReturnRequestStatusControl({
  returnRequestId,
  status,
}: {
  returnRequestId: string;
  status: ReturnStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selected, setSelected] = useState<ReturnStatus>(status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_RETURN_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  const handleSave = () => {
    if (selected === currentStatus) return;
    if (selected === "REJECTED" && rejectionReason.trim().length === 0) {
      setError("Please explain why this request is being rejected.");
      return;
    }
    if (
      !window.confirm(
        `Change this return request's status from ${returnStatusLabel[currentStatus]} to ${returnStatusLabel[selected]}? ${
          selected === "APPROVED" ? "This does NOT trigger a refund — that remains a separate action." : ""
        }`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateReturnRequestStatus(
        returnRequestId,
        currentStatus,
        selected,
        selected === "REJECTED" ? rejectionReason : undefined,
      );
      if (result?.error) {
        setError(result.error);
      } else {
        setCurrentStatus(selected);
        setSuccess(true);
      }
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-navy">Current status:</span>
        <Badge variant={returnStatusVariant[currentStatus]}>{returnStatusLabel[currentStatus]}</Badge>
      </div>

      {isTerminal ? (
        <p className="mt-3 text-sm text-slate">This return request is closed and can no longer be changed.</p>
      ) : (
        <div className="mt-4">
          <label htmlFor="return-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
            Change status to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="return-status-select"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as ReturnStatus);
                setSuccess(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
            >
              <option value={currentStatus}>{returnStatusLabel[currentStatus]} (current)</option>
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {returnStatusLabel[next]}
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

          {selected === "REJECTED" && (
            <div className="mt-3">
              <label htmlFor="return-rejection-reason" className="mb-1.5 block text-xs font-semibold text-slate">
                Rejection reason (shown to the customer)
              </label>
              <textarea
                id="return-rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                disabled={isPending}
                rows={2}
                maxLength={500}
                className={inputClass(false)}
              />
            </div>
          )}

          {selected === "APPROVED" && (
            <p className="mt-2 text-xs text-slate">
              Approving does not refund the customer automatically. Use the order&rsquo;s own Refund action
              separately if appropriate.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Status updated.
        </p>
      )}
    </div>
  );
}
