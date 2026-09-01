"use server";

// Phase 4.4.29 — public forgot-password request. Guest-only by design,
// matching signup/login's own conventions (email normalized to
// lowercase, same rate-limit shape as every other public form since
// Phase 4.4.26). The response is identical whether or not the account
// exists — see requestPasswordReset's final return — the same
// anti-enumeration principle Phase 4.4.28's newsletter unsubscribe and
// this project's own signup flow already apply.
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { generateResetToken, RESET_TOKEN_EXPIRY_MS } from "@/lib/reset-token";
import { notifyPasswordReset } from "@/lib/email/notify";

const FORGOT_PASSWORD_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address.").max(200, "Email is too long."),
});

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`forgot-password:${ip}`, FORGOT_PASSWORD_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterMs) };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  const email = parsed.data.email.toLowerCase();

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { name: true, passwordHash: true },
    });

    // No account, or an account with no password set (a future OAuth-only
    // case) — same "do nothing further" outcome either way. No token is
    // ever created for a nonexistent user.
    if (user && user.passwordHash) {
      const { raw, hash } = generateResetToken();
      const expires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      // Clearing this identifier's existing tokens before creating the new
      // one means only the most recently requested link ever works, and
      // it's also the only opportunistic cleanup this table gets for a
      // user who requests more than once — see the phase report for the
      // documented, accepted limitation on a token that's requested once
      // and then never used or retried.
      await db.$transaction([
        db.verificationToken.deleteMany({ where: { identifier: email } }),
        db.verificationToken.create({ data: { identifier: email, token: hash, expires } }),
      ]);

      // Fire-and-forget, same as every other notify* call in this project
      // — never awaited into the response, never throws (see notify.ts),
      // and the raw token is never logged anywhere from this point on.
      notifyPasswordReset({ email, name: user.name, token: raw });
    }
  } catch (err) {
    // A DB hiccup here must never change what the client sees, or it
    // becomes its own enumeration oracle (e.g. failures only ever
    // happening on the "user exists" branch). Logged server-side only.
    console.error("[forgot-password] requestPasswordReset failed:", err);
  }

  // Identical response regardless of whether the account existed, the
  // token was created, or the lookup itself failed.
  return { success: true };
}
