"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { quotationStatusLabel } from "@/lib/quotation-status";
import { ALLOWED_QUOTATION_TRANSITIONS } from "@/lib/admin/quotation-transitions";
import { logActivity } from "@/lib/admin/activity-log";
import type { QuotationStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: readonly QuotationStatus[] = ["PENDING", "REVIEWED", "RESPONDED", "CLOSED"];

// See src/app/admin/orders/actions.ts for the full rationale — mirrors the
// same local-sentinel-error pattern for aborting the transaction on a lost
// race.
class RaceLostError extends Error {}

export type UpdateQuotationStatusResult = { error?: string };

export async function updateQuotationStatus(
  quotationId: string,
  currentStatus: QuotationStatus,
  nextStatus: QuotationStatus,
): Promise<UpdateQuotationStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // four real enum values."
  if (!VALID_STATUSES.includes(nextStatus) || !VALID_STATUSES.includes(currentStatus)) {
    return { error: "Invalid quotation status." };
  }

  const quotation = await db.quotation.findUnique({ where: { id: quotationId }, select: { status: true } });
  if (!quotation) {
    return { error: "This quotation no longer exists." };
  }

  const allowed = ALLOWED_QUOTATION_TRANSITIONS[quotation.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      error: `This quotation can't be moved from ${quotationStatusLabel[quotation.status]} to ${quotationStatusLabel[nextStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring the exact pattern established in Phase 4.3.5's
    // updateOrderStatus: the WHERE clause re-checks the expected current
    // status at the moment of the write, not just at the read above.
    await db.$transaction(async (tx) => {
      const result = await tx.quotation.updateMany({
        where: { id: quotationId, status: quotation.status },
        data: { status: nextStatus },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "QUOTATION",
        entityId: quotationId,
        description: `Changed quotation status from ${quotationStatusLabel[quotation.status]} to ${quotationStatusLabel[nextStatus]}`,
        metadata: { from: quotation.status, to: nextStatus },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return {
        error: "This quotation's status has changed since you loaded this page. Please refresh and try again.",
      };
    }
    throw err;
  }

  revalidatePath("/admin/quotations");
  revalidatePath(`/admin/quotations/${quotationId}`);
  return {};
}
