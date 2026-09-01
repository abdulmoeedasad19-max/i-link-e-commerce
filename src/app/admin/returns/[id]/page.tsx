import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminReturnRequestById } from "@/lib/admin/returns";
import { orderStatusLabel } from "@/lib/order-status";
import ReturnRequestStatusControl from "@/components/admin/returns/return-request-status-control";

export const metadata: Metadata = {
  title: "Return Request Details",
};

export default async function AdminReturnRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const returnRequest = await getAdminReturnRequestById(id);

  if (!returnRequest) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/returns"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Return Requests
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy" title={returnRequest.id}>
          Return Request #{returnRequest.id.slice(-8).toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-slate">
          Submitted{" "}
          {returnRequest.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Customer</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{returnRequest.customer.name || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{returnRequest.customer.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold text-navy">{returnRequest.customer.phone || "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Order</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Order</dt>
                <dd>
                  <Link
                    href={`/admin/orders/${returnRequest.order.id}`}
                    className="font-mono text-xs font-semibold text-royal hover:text-royal-600"
                  >
                    #{returnRequest.order.id.slice(-8).toUpperCase()}
                  </Link>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Order Status</dt>
                <dd className="font-semibold text-navy">{orderStatusLabel[returnRequest.order.status]}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Total</dt>
                <dd className="font-semibold text-navy">{formatPrice(returnRequest.order.total)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Delivered</dt>
                <dd className="font-semibold text-navy">
                  {returnRequest.order.deliveredAt
                    ? returnRequest.order.deliveredAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Request Details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Reason</dt>
                <dd className="mt-1 whitespace-pre-wrap text-navy">{returnRequest.reason}</dd>
              </div>
              {returnRequest.rejectionReason && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Rejection Reason</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-navy">{returnRequest.rejectionReason}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Status</h2>
            <p className="mt-1 text-xs text-slate">
              This is a request only. Approving does not refund the customer, change the order&rsquo;s fulfillment
              status, or affect inventory — use the order&rsquo;s own actions separately for those.
            </p>
            <div className="mt-4">
              <ReturnRequestStatusControl returnRequestId={returnRequest.id} status={returnRequest.status} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
