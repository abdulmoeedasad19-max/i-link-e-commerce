import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import CouponForm from "@/components/admin/discounts/coupon-form";

export const metadata: Metadata = {
  title: "Add Coupon",
};

export default async function NewCouponPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Discounts
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Add Coupon</h1>

      <div className="mt-6 max-w-3xl">
        <CouponForm mode="create" />
      </div>
    </div>
  );
}
