"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { contactMessageStatusLabel, contactMessageStatusVariant } from "@/lib/contact-message-status";
import { ALLOWED_CONTACT_MESSAGE_TRANSITIONS } from "@/lib/admin/contact-message-transitions";
import { updateContactMessageStatus } from "@/app/admin/contact/actions";
import type { ContactMessageStatus } from "@/generated/prisma/enums";

export default function ContactMessageStatusControl({
  contactMessageId,
  status,
}: {
  contactMessageId: string;
  status: ContactMessageStatus;
}) {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [selected, setSelected] = useState<ContactMessageStatus>(status);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allowedNext = ALLOWED_CONTACT_MESSAGE_TRANSITIONS[currentStatus] ?? [];

  const handleSave = () => {
    if (selected === currentStatus) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateContactMessageStatus(contactMessageId, currentStatus, selected);
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
        <Badge variant={contactMessageStatusVariant[currentStatus]}>
          {contactMessageStatusLabel[currentStatus]}
        </Badge>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message-status-select" className="mb-1.5 block text-xs font-semibold text-slate">
          Change status to
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            id="contact-message-status-select"
            value={selected}
            onChange={(e) => {
              setSelected(e.target.value as ContactMessageStatus);
              setSuccess(false);
              setError(null);
            }}
            disabled={isPending}
            className="rounded-[10px] border border-light-gray bg-white px-3 py-2.5 text-sm text-dark-slate outline-none transition-colors focus:border-royal focus:ring-2 focus:ring-royal/15 disabled:opacity-50"
          >
            <option value={currentStatus}>{contactMessageStatusLabel[currentStatus]} (current)</option>
            {allowedNext.map((next) => (
              <option key={next} value={next}>
                {contactMessageStatusLabel[next]}
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
