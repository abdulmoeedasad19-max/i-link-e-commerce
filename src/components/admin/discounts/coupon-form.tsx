"use client";

import { useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createCoupon, updateCoupon, type CouponActionState } from "@/app/admin/discounts/actions";
import type { AdminCouponDetail } from "@/lib/admin/coupons";

const initialState: CouponActionState = {};

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default function CouponForm({
  mode,
  coupon,
}: {
  mode: "create" | "edit";
  coupon?: AdminCouponDetail;
}) {
  const action = mode === "edit" ? updateCoupon : createCoupon;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && coupon && <input type="hidden" name="id" value={coupon.id} />}

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Coupon Code</h2>
        <div className="mt-4">
          <Field id="coupon-code" label="Code" required error={errors.code}>
            <input
              id="coupon-code"
              name="code"
              type="text"
              required
              placeholder="e.g. SUMMER10"
              defaultValue={coupon?.code}
              aria-invalid={Boolean(errors.code)}
              className={`${inputClass(Boolean(errors.code))} uppercase`}
            />
          </Field>
          <p className="mt-1.5 text-xs text-slate">Codes are automatically converted to uppercase.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Discount</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="coupon-discount-type" label="Discount Type" required error={errors.discountType}>
            <select
              id="coupon-discount-type"
              name="discountType"
              required
              defaultValue={coupon?.discountType ?? "PERCENTAGE"}
              aria-invalid={Boolean(errors.discountType)}
              className={inputClass(Boolean(errors.discountType))}
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed Amount (PKR)</option>
            </select>
          </Field>

          <Field id="coupon-discount-value" label="Discount Value" required error={errors.discountValue}>
            <input
              id="coupon-discount-value"
              name="discountValue"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={coupon?.discountValue}
              aria-invalid={Boolean(errors.discountValue)}
              className={inputClass(Boolean(errors.discountValue))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate">
          For a percentage discount, this must be greater than 0 and no more than 100.
        </p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Order Constraints</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="coupon-min-order" label="Minimum Order Amount (PKR)" error={errors.minimumOrderAmount}>
            <input
              id="coupon-min-order"
              name="minimumOrderAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="No minimum"
              defaultValue={coupon?.minimumOrderAmount ?? undefined}
              aria-invalid={Boolean(errors.minimumOrderAmount)}
              className={inputClass(Boolean(errors.minimumOrderAmount))}
            />
          </Field>

          <Field id="coupon-max-discount" label="Maximum Discount Amount (PKR)" error={errors.maximumDiscountAmount}>
            <input
              id="coupon-max-discount"
              name="maximumDiscountAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="No cap"
              defaultValue={coupon?.maximumDiscountAmount ?? undefined}
              aria-invalid={Boolean(errors.maximumDiscountAmount)}
              className={inputClass(Boolean(errors.maximumDiscountAmount))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Validity Window</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="coupon-start-date" label="Start Date" error={errors.startDate}>
            <input
              id="coupon-start-date"
              name="startDate"
              type="date"
              defaultValue={toDateInputValue(coupon?.startDate ?? null)}
              aria-invalid={Boolean(errors.startDate)}
              className={inputClass(Boolean(errors.startDate))}
            />
          </Field>

          <Field id="coupon-end-date" label="End Date" error={errors.endDate}>
            <input
              id="coupon-end-date"
              name="endDate"
              type="date"
              defaultValue={toDateInputValue(coupon?.endDate ?? null)}
              aria-invalid={Boolean(errors.endDate)}
              className={inputClass(Boolean(errors.endDate))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate">Leave either field blank for no restriction on that side.</p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Usage</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="coupon-usage-limit" label="Usage Limit" error={errors.usageLimit}>
            <input
              id="coupon-usage-limit"
              name="usageLimit"
              type="number"
              min="1"
              step="1"
              placeholder="Unlimited"
              defaultValue={coupon?.usageLimit ?? undefined}
              aria-invalid={Boolean(errors.usageLimit)}
              className={inputClass(Boolean(errors.usageLimit))}
            />
          </Field>

          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={coupon?.isActive ?? true}
              className="h-4 w-4 rounded border-light-gray text-royal focus:ring-royal/30"
            />
            Enabled
          </label>
        </div>
        {mode === "edit" && coupon && (
          <p className="mt-2 text-xs text-slate">
            Used {coupon.usageCount} time{coupon.usageCount === 1 ? "" : "s"} so far. Usage count can&rsquo;t be
            edited here.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Coupon"}
        </Button>
        <Button href="/admin/discounts" variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
