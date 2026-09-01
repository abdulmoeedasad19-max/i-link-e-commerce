"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logActivity } from "@/lib/admin/activity-log";
import { returnStatusLabel } from "@/lib/return-status";
import { ALLOWED_RETURN_TRANSITIONS } from "@/lib/admin/return-transitions";
import { notifyReturnApproved, notifyReturnRejected } from "@/lib/email/notify";
import type { ReturnStatus } from "@/generated/prisma/enums";

const VALID_STATUSES: readonly ReturnStatus[] = ["PENDING", "APPROVED", "REJECTED"];

// See src/app/admin/orders/actions.ts for the full rationale.
class RaceLostError extends Error {}

const rejectionReasonSchema = z.string().trim().max(500, "Rejection reason is too long.");

export type UpdateReturnRequestStatusResult = { error?: string };

/**
 * Phase 4.4.18 — the single admin transition action, mirroring
 * updateQuotationStatus's exact shape. Approval/rejection never touches
 * Order/OrderStatus/PaymentStatus and never calls refundOrder — a
 * decision to actually refund remains a fully separate, manually invoked
 * admin action using the existing Phase 4.4.15 workflow.
 */
export async function updateReturnRequestStatus(
  returnRequestId: string,
  currentStatus: ReturnStatus,
  nextStatus: ReturnStatus,
  rejectionReason?: string,
): Promise<UpdateReturnRequestStatusResult> {
  const session = await requireAdmin();

  // Never trust a client-supplied status string beyond "is it one of the
  // three real enum values."
  if (!VALID_STATUSES.includes(nextStatus) || !VALID_STATUSES.includes(currentStatus)) {
    return { error: "Invalid return request status." };
  }

  let parsedRejectionReason = "";
  if (nextStatus === "REJECTED") {
    const parsed = rejectionReasonSchema.safeParse(rejectionReason ?? "");
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Please enter a valid rejection reason." };
    }
    parsedRejectionReason = parsed.data;
  }

  const returnRequest = await db.returnRequest.findUnique({
    where: { id: returnRequestId },
    select: { status: true },
  });
  if (!returnRequest) {
    return { error: "This return request no longer exists." };
  }

  const allowed = ALLOWED_RETURN_TRANSITIONS[returnRequest.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return {
      error: `This return request can't be moved from ${returnStatusLabel[returnRequest.status]} to ${returnStatusLabel[nextStatus]}.`,
    };
  }

  try {
    // Race-safe, mirroring updateQuotationStatus exactly: the WHERE clause
    // re-checks the expected current status at the moment of the write,
    // not just at the read above.
    await db.$transaction(async (tx) => {
      const result = await tx.returnRequest.updateMany({
        where: { id: returnRequestId, status: returnRequest.status },
        data: {
          status: nextStatus,
          rejectionReason: nextStatus === "REJECTED" ? parsedRejectionReason || null : null,
        },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "STATUS_CHANGE",
        entityType: "RETURN_REQUEST",
        entityId: returnRequestId,
        description: nextStatus === "APPROVED" ? "Approved return request" : "Rejected return request",
        metadata: { from: returnRequest.status, to: nextStatus },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return {
        error: "This return request's status has changed since you loaded this page. Please refresh and try again.",
      };
    }
    console.error("[admin/returns] updateReturnRequestStatus failed:", err);
    return { error: "Unable to update this return request. Please try again." };
  }

  // Downstream of the committed, race-won transaction above — a losing
  // request (RaceLostError, caught above) never reaches this line, so no
  // email is ever sent for a transition that didn't actually happen.
  if (nextStatus === "APPROVED") {
    notifyReturnApproved(returnRequestId);
  } else if (nextStatus === "REJECTED") {
    notifyReturnRejected(returnRequestId);
  }

  revalidatePath("/admin/returns");
  revalidatePath(`/admin/returns/${returnRequestId}`);
  return {};
}
