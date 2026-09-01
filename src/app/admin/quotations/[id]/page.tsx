import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminQuotationById } from "@/lib/admin/quotations";
import QuotationStatusControl from "@/components/admin/quotations/quotation-status-control";

export const metadata: Metadata = {
  title: "Quotation Details",
};

const PREFERRED_CONTACT_LABEL: Record<"EMAIL" | "PHONE", string> = {
  EMAIL: "Email",
  PHONE: "Phone",
};

export default async function AdminQuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const quotation = await getAdminQuotationById(id);

  if (!quotation) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/quotations"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Quotations
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy" title={quotation.id}>
          Request #{quotation.id.slice(-8).toUpperCase()}
        </h1>
        <p className="mt-1 text-sm text-slate">
          Submitted{" "}
          {quotation.createdAt.toLocaleDateString("en-US", {
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
                <dd className="font-semibold text-navy">{quotation.fullName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Company</dt>
                <dd className="font-semibold text-navy">{quotation.companyName}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{quotation.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold text-navy">{quotation.phone}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Preferred Contact</dt>
                <dd className="font-semibold text-navy">
                  {quotation.preferredContact ? PREFERRED_CONTACT_LABEL[quotation.preferredContact] : "No preference"}
                </dd>
              </div>
              {quotation.linkedAccountEmail && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate">Registered Account</dt>
                  <dd className="font-semibold text-navy">{quotation.linkedAccountEmail}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Request Details</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Product / Requirement</dt>
                <dd className="mt-1 text-navy">{quotation.requirement}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Quantity</dt>
                <dd className="mt-1 text-navy">{quotation.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap text-navy">{quotation.message}</dd>
              </div>
              {quotation.additionalRequirements && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate">
                    Additional Requirements
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-navy">{quotation.additionalRequirements}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Status</h2>
            <div className="mt-4">
              <QuotationStatusControl quotationId={quotation.id} status={quotation.status} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
