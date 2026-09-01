import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCouponById } from "@/lib/admin/coupons";
import { couponStatusLabel, couponStatusVariant } from "@/lib/admin/coupon-status";
import { formatPrice } from "@/lib/utils";
import CouponActiveControl from "@/components/admin/discounts/coupon-active-control";

export const metadata: Metadata = {
  title: "Coupon Details",
};

function formatDiscount(discountType: "PERCENTAGE" | "FIXED_AMOUNT", discountValue: number): string {
  return discountType === "PERCENTAGE" ? `${discountValue}%` : formatPrice(discountValue);
}

function formatDate(date: Date | null, withTime = false): string {
  if (!date) return "No restriction";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export default async function AdminCouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-bold text-navy">{coupon.code}</h1>
          <p className="mt-1 text-sm text-slate">Created {formatDate(coupon.createdAt)}</p>
        </div>
        <Button href={`/admin/discounts/${coupon.id}/edit`} variant="secondary" size="sm">
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Discount</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Type</dt>
                <dd className="font-semibold text-navy">
                  {coupon.discountType === "PERCENTAGE" ? "Percentage" : "Fixed Amount"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Value</dt>
                <dd className="font-semibold text-navy">
                  {formatDiscount(coupon.discountType, coupon.discountValue)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Minimum Order Amount</dt>
                <dd className="font-semibold text-navy">
                  {coupon.minimumOrderAmount != null ? formatPrice(coupon.minimumOrderAmount) : "No minimum"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Maximum Discount Amount</dt>
                <dd className="font-semibold text-navy">
                  {coupon.maximumDiscountAmount != null ? formatPrice(coupon.maximumDiscountAmount) : "No cap"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Validity Window</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Start Date</dt>
                <dd className="font-semibold text-navy">{formatDate(coupon.startDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">End Date</dt>
                <dd className="font-semibold text-navy">{formatDate(coupon.endDate)}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Usage</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Usage Count</dt>
                <dd className="font-semibold text-navy">{coupon.usageCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Usage Limit</dt>
                <dd className="font-semibold text-navy">{coupon.usageLimit ?? "Unlimited"}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Record</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Created</dt>
                <dd className="font-semibold text-navy">{formatDate(coupon.createdAt, true)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Last Updated</dt>
                <dd className="font-semibold text-navy">{formatDate(coupon.updatedAt, true)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Computed Status</h2>
            <div className="mt-4">
              <Badge variant={couponStatusVariant[coupon.status]}>{couponStatusLabel[coupon.status]}</Badge>
            </div>
            <p className="mt-3 text-xs text-slate">
              Derived from the enabled setting plus dates and usage — never stored directly.
            </p>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Active Setting</h2>
            <div className="mt-4">
              <CouponActiveControl
                id={coupon.id}
                code={coupon.code}
                isActive={coupon.isActive}
                usageCount={coupon.usageCount}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
