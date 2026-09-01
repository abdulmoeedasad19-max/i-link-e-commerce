import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminContactMessageById } from "@/lib/admin/contact-messages";
import ContactMessageStatusControl from "@/components/admin/contact/contact-message-status-control";

export const metadata: Metadata = {
  title: "Contact Message",
};

export default async function AdminContactMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const message = await getAdminContactMessageById(id);

  if (!message) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/contact"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Contact Messages
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-bold text-navy" title={message.id}>
          {message.subject}
        </h1>
        <p className="mt-1 text-sm text-slate">
          Submitted{" "}
          {message.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-2">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Sender</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Name</dt>
                <dd className="font-semibold text-navy">{message.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Email</dt>
                <dd className="font-semibold text-navy">{message.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate">Phone</dt>
                <dd className="font-semibold text-navy">{message.phone || "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Message</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Subject</dt>
                <dd className="mt-1 text-navy">{message.subject}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Message</dt>
                <dd className="mt-1 whitespace-pre-wrap text-navy">{message.message}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="space-y-6">
          <Card hover={false} className="p-5 sm:p-6">
            <h2 className="text-base font-bold text-navy">Status</h2>
            <div className="mt-4">
              <ContactMessageStatusControl contactMessageId={message.id} status={message.status} />
            </div>
            <p className="mt-4 text-xs text-slate">
              Last updated{" "}
              {message.updatedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
