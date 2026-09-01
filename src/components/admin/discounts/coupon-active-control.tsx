"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { toggleCouponActive, deleteCoupon } from "@/app/admin/discounts/actions";

export default function CouponActiveControl({
  id,
  code,
  isActive,
  usageCount,
}: {
  id: string;
  code: string;
  isActive: boolean;
  usageCount: number;
}) {
  const router = useRouter();
  const [currentIsActive, setCurrentIsActive] = useState(isActive);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleToggle = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await toggleCouponActive(id, currentIsActive);
      if (result?.error) {
        setError(result.error);
      } else {
        setCurrentIsActive((prev) => !prev);
        setSuccess(true);
      }
    });
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/admin/discounts");
      }
    });
  };

  return (
    <div>
      <p className="text-sm text-navy">
        Enabled: <span className="font-semibold">{currentIsActive ? "Yes" : "No"}</span>
      </p>
      <p className="mt-1 text-xs text-slate">
        This is the raw on/off setting only — it does not by itself mean the coupon is currently usable. See
        Computed Status above for whether it&rsquo;s actually active right now.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={handleToggle}>
          {isPending ? "Saving…" : currentIsActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
          className="text-error hover:bg-error/10"
        >
          Delete
        </Button>
      </div>

      {usageCount > 0 && (
        <p className="mt-2 text-xs text-slate">
          This coupon has recorded usage, so it can&rsquo;t be deleted — deactivate it instead.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-3 text-xs font-medium text-success">
          Updated.
        </p>
      )}
    </div>
  );
}
