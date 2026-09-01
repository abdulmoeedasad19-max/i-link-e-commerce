"use server";

// Phase 4.4.29 — public password reset, the consuming half of
// forgot-password/actions.ts's token-issuing flow. Guest-only, matching
// the rest of the auth flow: a valid, unexpired, unused token is the
// only thing that grants password-reset capability here, never a
// session.
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/reset-token";

const RESET_PASSWORD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

// 500 chars is far beyond any real token (a 32-byte base64url token is
// ~43 characters) — purely a defensive upper bound against an
// oversized-payload submission, mirroring the same cap added to
// src/app/(storefront)/unsubscribe/actions.ts's email field in Phase
// 4.4.28. A token this long can never match a real hash and is rejected
// the same generic way as any other invalid token.
const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "This reset link is invalid.").max(500, "This reset link is invalid."),
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

const INVALID_TOKEN_MESSAGE = "This reset link is invalid or has expired. Please request a new one.";

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`reset-password:${ip}`, RESET_PASSWORD_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterMs) };
  }

  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid password." };
  }

  const tokenHash = hashResetToken(parsed.data.token);

  // Hashed before the transaction opens — bcrypt's ~12-round cost has no
  // business holding a database transaction (and its row locks) open for
  // the ~100-300ms it takes.
  let newPasswordHash: string;
  try {
    newPasswordHash = await hashPassword(parsed.data.newPassword);
  } catch {
    return { error: "Unable to reset your password. Please try again." };
  }

  // Deliberately NOT wrapped in db.$transaction: an earlier version did,
  // but throwing inside an interactive transaction rolls back everything
  // in it — including a delete that had already genuinely happened,
  // which silently undid the "consume an expired token on attempted use"
  // cleanup this function is supposed to provide. tx.verificationToken
  // .delete() is already atomic and race-safe on its own (Postgres
  // serializes concurrent deletes of the same row via its unique
  // constraint: exactly one caller — whether racing at the same instant,
  // or replaying the same token seconds/minutes later — gets the real
  // row back; every other caller gets "record not found"), so no
  // transaction is needed for the single-use guarantee itself.
  const deletedRow = await db.verificationToken.delete({ where: { token: tokenHash } }).catch(() => null);
  if (!deletedRow) {
    return { error: INVALID_TOKEN_MESSAGE };
  }
  if (deletedRow.expires < new Date()) {
    // Expired, but now deleted regardless — the opportunistic cleanup
    // this phase's report documents: an expired token is gone the
    // moment anyone (including an attacker replaying an old link)
    // actually tries it, with no separate cleanup job required.
    return { error: INVALID_TOKEN_MESSAGE };
  }

  try {
    // User.updatedAt is `@updatedAt` (auto-bumped on any change to the
    // row) — the same security-stamp value src/auth.ts's jwt() callback
    // re-validates against the database on every authenticated request
    // (see Phase 4.4.26). Writing passwordHash here is therefore
    // sufficient, on its own, to invalidate every existing session for
    // this user — no separate invalidation step exists or is needed.
    const result = await db.user.updateMany({
      where: { email: deletedRow.identifier },
      data: { passwordHash: newPasswordHash },
    });
    if (result.count === 0) {
      // Defensive: the token's identifier no longer matches any user
      // row. Nothing in this project deletes User rows today, so this
      // should be unreachable, but a token must never silently succeed
      // against zero actual accounts. The token is already consumed
      // above either way, matching its single-use guarantee.
      return { error: INVALID_TOKEN_MESSAGE };
    }
  } catch (err) {
    // Never expose raw Prisma/SQL errors to the client, and never log the
    // token itself — only the generic failure context.
    console.error("[reset-password] resetPassword failed:", err);
    return { error: "Unable to reset your password. Please try again." };
  }

  return { success: true };
}

/**
 * Read-only validity check for the page component to decide what to
 * render (a pre-filled reset form vs. an "invalid or expired link"
 * notice) — never the security boundary itself, and never consumes the
 * token. Only resetPassword() above ever deletes a token, and only on an
 * actual submission.
 */
export async function checkResetTokenValid(token: string): Promise<boolean> {
  if (!token || token.length > 500) return false;
  const hash = hashResetToken(token);
  const row = await db.verificationToken.findUnique({ where: { token: hash }, select: { expires: true } });
  return Boolean(row && row.expires > new Date());
}
