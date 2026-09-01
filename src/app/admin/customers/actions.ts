"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logActivity } from "@/lib/admin/activity-log";
import { hashPassword } from "@/lib/password";
import type { Role } from "@/generated/prisma/enums";

const VALID_ROLES: readonly Role[] = ["CUSTOMER", "ADMIN"];

// See src/app/admin/orders/actions.ts for the full rationale.
class RaceLostError extends Error {}

export type UpdateCustomerRoleResult = { error?: string };

/**
 * Phase 4.3.7 — the only role mutation in the project. Replaces the
 * one-time promote-to-admin script (deleted after use in an earlier phase)
 * with a real, safe, reusable, server-authorized mechanism, exactly as
 * that phase's report flagged was missing.
 */
export async function updateCustomerRole(
  userId: string,
  expectedCurrentRole: Role,
  nextRole: Role,
): Promise<UpdateCustomerRoleResult> {
  const session = await requireAdmin();

  // Never cast an arbitrary client-supplied string to Role — only the two
  // real enum values are ever accepted, for both the target and expected
  // states.
  if (!VALID_ROLES.includes(nextRole) || !VALID_ROLES.includes(expectedCurrentRole)) {
    return { error: "Invalid role." };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own role. Ask another administrator to do this." };
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) {
    return { error: "This customer no longer exists." };
  }

  if (target.role !== expectedCurrentRole) {
    return {
      error: "This customer's role has changed since you loaded this page. Please refresh and try again.",
    };
  }

  if (expectedCurrentRole === nextRole) {
    return {};
  }

  // Last-admin protection: refuse to demote the only remaining ADMIN,
  // enforced server-side (never just a disabled button).
  if (expectedCurrentRole === "ADMIN" && nextRole === "CUSTOMER") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { error: "Cannot remove the last administrator account." };
    }
  }

  // Race-safe, mirroring the exact conditional-update pattern already
  // established for order/quotation status: the WHERE clause re-checks the
  // expected current role at the moment of the write. The audit log write
  // is inside the same transaction, so it can only be created alongside a
  // genuinely successful, race-winning role change.
  try {
    await db.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id: userId, role: expectedCurrentRole },
        data: { role: nextRole },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "ROLE_CHANGE",
        entityType: "USER",
        entityId: userId,
        description: `Changed customer role from ${expectedCurrentRole} to ${nextRole}`,
        metadata: { from: expectedCurrentRole, to: nextRole },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return {
        error: "This customer's role has changed since you loaded this page. Please refresh and try again.",
      };
    }
    console.error("[admin/customers] updateCustomerRole failed:", err);
    return { error: "Unable to update this customer's role. Please try again." };
  }

  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin");
  return {};
}

// Phase 4.4.17 — admin-assisted manual password recovery. Deliberately
// separate from Phase 4.4.16's self-service changePassword (which requires
// knowing the current password and is never logged): this is a trusted-
// admin override for a customer who genuinely can't sign in, matching the
// store's existing manual-everything philosophy (Easypaisa confirmation,
// refunds) — the admin sets a new password and communicates it to the
// customer through whatever channel they used to make contact (phone,
// WhatsApp, in person). No token, no email, no VerificationToken involved.
// Reuses hashPassword() and the same min-8-character policy already
// established by signup/changePassword — no new/conflicting policy.
const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetCustomerPasswordResult = { error?: string };

export async function resetCustomerPassword(
  userId: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ResetCustomerPasswordResult> {
  const session = await requireAdmin();

  // Mirrors updateCustomerRole's own self-action guard exactly — an admin
  // resetting their own password belongs to the existing self-service
  // changePassword flow (Phase 4.4.16), not this one.
  if (userId === session.user.id) {
    return { error: "You cannot reset your own password using this action." };
  }

  const parsed = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid password." };
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) {
    return { error: "This customer no longer exists." };
  }
  if (target.role !== "CUSTOMER") {
    return { error: "Only customer accounts can be reset using this action." };
  }

  let newPasswordHash: string;
  try {
    newPasswordHash = await hashPassword(parsed.data.newPassword);
  } catch {
    // Never expose the underlying bcrypt error to the client.
    return { error: "Unable to reset the customer's password. Please try again." };
  }

  try {
    // Race-safe, mirroring updateCustomerRole above: the WHERE clause
    // re-checks role === CUSTOMER at the moment of the write, not just at
    // the read above — if another admin promoted this account to ADMIN in
    // between, this matches zero rows instead of silently resetting an
    // administrator's password. The audit log write is inside the same
    // transaction, so it can only be created alongside a genuinely
    // successful, race-winning reset.
    await db.$transaction(async (tx) => {
      const result = await tx.user.updateMany({
        where: { id: userId, role: "CUSTOMER" },
        data: { passwordHash: newPasswordHash },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      // Description and metadata deliberately contain no password
      // material — not the new password, not its hash, not its length.
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "USER",
        entityId: userId,
        description: "Reset password for customer",
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return { error: "Only customer accounts can be reset using this action." };
    }
    console.error("[admin/customers] resetCustomerPassword failed:", err);
    return { error: "Unable to reset the customer's password. Please try again." };
  }

  revalidatePath(`/admin/customers/${userId}`);
  return {};
}
