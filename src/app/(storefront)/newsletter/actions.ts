"use server";

// Phase 4.4.11 — the homepage newsletter form (newsletter.tsx) previously
// had no backend at all: its submit handler only ever set local component
// state. This is the first time a subscription is actually persisted,
// mirroring src/app/(storefront)/contact/actions.ts's shape. Guest-only by
// design — subscribing has never required an account.
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

// Phase 4.4.26 — conservative, IP-based: guards against a script trying
// many different email addresses in quick succession. The existing
// unique-email constraint already prevents duplicate-address spam on its
// own; this caps overall submission volume.
const NEWSLETTER_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };

const newsletterSchema = z.object({
  email: z.email("Enter a valid email address.").max(200, "Email is too long."),
});

export type NewsletterState = {
  error?: string;
  success?: boolean;
};

function isPrismaKnownError(err: unknown): err is { code: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function subscribeToNewsletter(
  _prevState: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`newsletter:${ip}`, NEWSLETTER_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { error: rateLimitMessage(rateLimit.retryAfterMs) };
  }

  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }
  // Same normalization convention already used by login/signup — trimmed
  // by Zod, lowercased here — so the same address can never create two
  // rows that only differ by case.
  const email = parsed.data.email.toLowerCase();

  try {
    // status/createdAt are always database-controlled — never accepted
    // from the client, and not passed here.
    await db.newsletterSubscriber.create({ data: { email } });
  } catch (err) {
    if (isPrismaKnownError(err) && err.code === "P2002") {
      // Already subscribed. Treated as a successful, idempotent outcome —
      // never revealed as a distinct "already subscribed" state, which
      // would otherwise let this form be used to probe whether an address
      // is in the database. The unique constraint on email is what
      // actually prevents the duplicate row; this is just how that
      // specific failure is presented to the visitor.
      return { success: true };
    }
    // Never expose raw Prisma/SQL errors to the client.
    console.error("[newsletter] subscribeToNewsletter failed:", err);
    return { error: "Unable to subscribe. Please try again." };
  }

  return { success: true };
}
