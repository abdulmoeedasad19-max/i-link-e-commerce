"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { contactMessageStatusLabel } from "@/lib/contact-message-status";
import { ALLOWED_CONTACT_MESSAGE_TRANSITIONS } from "@/lib/admin/contact-message-transitions";
import { logActivity } from "@/lib/admin/activity-log";
import type { ContactMessageStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: readonly ContactMessageStatus[] = ["NEW", "READ", "RESOLVED"];

// See src/app/admin/orders/actions.ts for the full rationale — mirrors the
// same local-sentinel-error pattern for aborting the transaction on a lost
// race.
class RaceLostError extends Error {}

export type UpdateContactMessageStatusResult = { error?: string };

export async function updateContactMessageStatus(
  contactMessageId: string,
  currentStatus: ContactMessageStatus,
  nextStatus: ContactMessageStatus,
): Promise<UpdateContactMessageStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // three real enum values" — this rejects any forged/typo'd value before
  // it ever reaches a query.
  if (!VALID_STATUSES.includes(nextStatus)) {
    return { error: "Invalid status." };
  }
  if (!VALID_STATUSES.includes(currentStatus)) {
    return { error: "Invalid status." };
  }

  const contactMessage = await db.contactMessage.findUnique({
    where: { id: contactMessageId },
    select: { status: true },
  });
  if (!contactMessage) {
    return { error: "This message no longer exists." };
  }

  const allowed = ALLOWED_CONTACT_MESSAGE_TRANSITIONS[contactMessage.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      error: `This message can't be moved from ${contactMessageStatusLabel[contactMessage.status]} to ${contactMessageStatusLabel[nextStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring the exact conditional-update pattern already
    // established for order/quotation/review status: the WHERE clause
    // re-checks the expected current status at the moment of the write, not
    // just at the read above. Only `status` is ever written here.
    await db.$transaction(async (tx) => {
      const result = await tx.contactMessage.updateMany({
        where: { id: contactMessageId, status: contactMessage.status },
        data: { status: nextStatus },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "CONTACT_MESSAGE",
        entityId: contactMessageId,
        description: "Updated contact message status",
        metadata: { changedFields: ["status"] },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "This message's status has changed since you loaded this page. Please refresh and try again." };
    }
    throw err;
  }

  revalidatePath("/admin/contact");
  revalidatePath(`/admin/contact/${contactMessageId}`);
  return {};
}
