"use client";

import { useActionState, useState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { submitReview, type SubmitReviewState } from "@/app/(storefront)/product/[slug]/actions";

const initialState: SubmitReviewState = {};

export default function ReviewForm({ productSlug }: { productSlug: string }) {
  const [state, formAction, isPending] = useActionState(submitReview, initialState);
  const errors = state.errors ?? {};
  const [rating, setRating] = useState(0);

  if (state.success) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-success/30 bg-success/5 px-5 py-4 text-sm font-medium text-success"
      >
        Thank you — your review has been submitted and will appear once it&rsquo;s approved.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-light-gray bg-white p-5 sm:p-6">
      <input type="hidden" name="productSlug" value={productSlug} />
      {/* userId, verifiedPurchase, and status are never part of this form —
          all three are derived or computed server-side in submitReview(). */}
      <input type="hidden" name="rating" value={rating || ""} />

      <h3 className="text-base font-bold text-navy">Write a Review</h3>

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <Field id="review-rating" label="Rating" required error={errors.rating}>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onClick={() => setRating(value)}
              className={`text-2xl leading-none transition-colors ${value <= rating ? "text-gold" : "text-light-gray hover:text-gold/60"}`}
            >
              ★
            </button>
          ))}
        </div>
      </Field>

      <Field id="review-title" label="Title (optional)" error={errors.title}>
        <input
          id="review-title"
          name="title"
          type="text"
          maxLength={120}
          aria-invalid={Boolean(errors.title)}
          className={inputClass(Boolean(errors.title))}
        />
      </Field>

      <Field id="review-body" label="Review" required error={errors.body}>
        <textarea
          id="review-body"
          name="body"
          required
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(errors.body)}
          className={inputClass(Boolean(errors.body))}
        />
      </Field>

      <Button type="submit" variant="primary" size="md" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit Review"}
      </Button>
    </form>
  );
}
