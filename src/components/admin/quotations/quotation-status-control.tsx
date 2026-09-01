"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { quotationStatusLabel, quotationStatusVariant } from "@/lib/quotation-status";
import { ALLOWED_QUOTATION_TRANSITIONS } from "@/lib/admin/quotation-transitions";
import { updateQuotationStatus } from "@/app/admin/quotations/actions";
import type { QuotationStatus } from "@/generated/prisma/enums";

export default function QuotationStatusControl({
  quotationId,
  status,
}: {
  quotationId: string;
  status: QuotationStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selected, setSelected] = useState<QuotationStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_QUOTATION_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  const handleSave = () => {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this quotation's status from ${quotationStatusLabel[currentStatus]} to ${quotationStatusLabel[selected]}?`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateQuotationStatus(quotationId, currentStatus, selected);
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
        <span className="text-sm font-semibold text-navy">Current status:</span>
        <Badge variant={quotationStatusVariant[currentStatus]}>{quotationStatusLabel[currentStatus]}</Badge>
      </div>

      {isTerminal ? (
        <p className="mt-3 text-sm text-slate">
          This quotation is closed and its status can no longer be changed.
        </p>
      ) : (
        <div className="mt-4">
          <label htmlFor="quotation-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
            Change status to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="quotation-status-select"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as QuotationStatus);
                setSuccess(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
            >
              <option value={currentStatus}>{quotationStatusLabel[currentStatus]} (current)</option>
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {quotationStatusLabel[next]}
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
