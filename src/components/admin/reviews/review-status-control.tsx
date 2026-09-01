"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { reviewStatusLabel, reviewStatusVariant } from "@/lib/review-status";
import { ALLOWED_REVIEW_TRANSITIONS } from "@/lib/admin/review-transitions";
import { updateReviewStatus } from "@/app/admin/reviews/actions";
import type { ReviewStatus } from "@/generated/prisma/enums";

export default function ReviewStatusControl({ reviewId, status }: { reviewId: string; status: ReviewStatus }) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selected, setSelected] = useState<ReviewStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_REVIEW_TRANSITIONS[currentStatus] ?? [];
  const isTerminal = allowedNext.length === 0;

  const handleSave = () => {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this review's status from ${reviewStatusLabel[currentStatus]} to ${reviewStatusLabel[selected]}?`,
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateReviewStatus(reviewId, currentStatus, selected);
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
        <Badge variant={reviewStatusVariant[currentStatus]}>{reviewStatusLabel[currentStatus]}</Badge>
      </div>

      {isTerminal ? (
        <p className="mt-3 text-sm text-slate">This review&rsquo;s status can no longer be changed.</p>
      ) : (
        <div className="mt-4">
          <label htmlFor="review-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
            Change status to
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="review-status-select"
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value as ReviewStatus);
                setSuccess(false);
                setError(null);
              }}
              disabled={isPending}
              className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
            >
              <option value={currentStatus}>{reviewStatusLabel[currentStatus]} (current)</option>
              {allowedNext.map((next) => (
                <option key={next} value={next}>
                  {reviewStatusLabel[next]}
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
