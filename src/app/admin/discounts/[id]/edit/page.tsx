import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCouponById } from "@/lib/admin/coupons";
import CouponForm from "@/components/admin/discounts/coupon-form";

export const metadata: Metadata = {
  title: "Edit Coupon",
};

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const coupon = await getAdminCouponById(id);

  if (!coupon) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/discounts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Discounts
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Edit Coupon</h1>
      <p className="mt-1 text-sm text-slate">{coupon.code}</p>

      <div className="mt-6 max-w-3xl">
        <CouponForm mode="edit" coupon={coupon} />
      </div>
    </div>
  );
}
