"use server";

// Phase 4.4.28 — newsletter unsubscribe. Guest-only by design, matching
// subscribeToNewsletter's own convention exactly: no login required,
// since subscribing never required one either. Serves two entry points
// with the same underlying logic (see the page component): a manual
// "type your own email" form, and a token-verified link for a future
// automated email to reference — see src/lib/newsletter-unsubscribe.ts
// for why the token needs no database storage of its own.
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";
import { verifyUnsubscribeToken, normalizeEmail } from "@/lib/newsletter-unsubscribe";

// Phase 4.4.26-style conservative, IP-based limit, matching the sibling
// newsletter subscribe action's own window/max exactly.
const UNSUBSCRIBE_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };

const unsubscribeSchema = z.object({
  email: z.email("Enter a valid email address.").max(200, "Email is too long."),
  token: z.string().trim().optional(),
});

export type UnsubscribeState = {
  error?: string;
  success?: boolean;
};

export async function unsubscribe(_prevState: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`unsubscribe:${ip}`, UNSUBSCRIBE_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterMs) };
  }

  const parsed = unsubscribeSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  const email = normalizeEmail(parsed.data.email);

  // A supplied token is re-verified here, server-side, every time — never
  // trusted just because the form included one. The manual, no-token path
  // (typing your own address directly into the form below) needs no
  // token: submitting the form is itself the customer asserting their own
  // address, the same trust level subscribeToNewsletter already uses.
  if (parsed.data.token && !verifyUnsubscribeToken(email, parsed.data.token)) {
    return { error: "This unsubscribe link is invalid. Please use the form below instead." };
  }

  try {
    // deleteMany (not delete) — idempotent by construction: matches 0 or
    // 1 rows, never throws "not found," and the exact same generic
    // success message is returned regardless of which case it was. Same
    // anti-enumeration pattern subscribeToNewsletter's own P2002 handling
    // already uses — this action never reveals whether a given address
    // was ever actually subscribed.
    await db.newsletterSubscriber.deleteMany({ where: { email } });
  } catch (err) {
    console.error("[unsubscribe] failed:", err);
    return { error: "Unable to process your request. Please try again." };
  }

  return { success: true };
}
