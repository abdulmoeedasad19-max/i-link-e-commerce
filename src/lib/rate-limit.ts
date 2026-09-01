// Phase 4.4.26 — a small, generic, DB-backed rate limiter for public forms
// (signup, contact, newsletter, business quotation, review submission).
// Deliberately separate from src/lib/login-rate-limit.ts, which stays
// fully untouched: that module's failure-streak/lockout model is specific
// to brute-force login protection (only failed attempts count, a
// successful login clears the streak), not a general request-volume
// throttle. This module instead counts every attempt — successful or
// not — within a sliding time window, which is the right model for
// capping form-submission throughput. See prisma/schema.prisma's
// RateLimitAttempt model comment for why this is DB-backed rather than
// an in-memory counter (serverless Postgres, no shared in-memory store
// across instances/executions).
import "server-only";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMs: number };

/**
 * Checks and records one attempt against `key` within a sliding window.
 * Opportunistically deletes this key's own attempts older than the
 * window first, so the table never accumulates unbounded history for a
 * hot key — a cheap, self-cleaning side effect of the same indexed query,
 * not a separate maintenance job.
 *
 * Best-effort, matching LoginAttempt's own documented precedent: a tight
 * race between two simultaneous requests could under-count by one or two
 * — accepted for a request-volume throttle, not a hard security boundary
 * the way payment/inventory math elsewhere in this project must be.
 */
export async function consumeRateLimit(
  key: string,
  options: { windowMs: number; max: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = new Date(now - options.windowMs);

  await db.rateLimitAttempt.deleteMany({ where: { key, createdAt: { lt: windowStart } } });

  const count = await db.rateLimitAttempt.count({ where: { key, createdAt: { gte: windowStart } } });

  if (count >= options.max) {
    const oldest = await db.rateLimitAttempt.findFirst({
      where: { key, createdAt: { gte: windowStart } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    const retryAfterMs = oldest ? oldest.createdAt.getTime() + options.windowMs - now : options.windowMs;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  await db.rateLimitAttempt.create({ data: { key } });
  return { allowed: true };
}

/**
 * Best-effort client IP extraction from standard reverse-proxy headers.
 * Never the sole identity check anywhere it's used here — every caller
 * combines this with server-derived context (never a client-submitted
 * identifier alone), and callers that already have an authoritative
 * identity (e.g. review submission's session.user.id) use that instead
 * of IP entirely. Falls back to a constant, shared "unknown" bucket
 * (still rate-limited, just coarsely) rather than throwing when no proxy
 * header is present, e.g. in local development.
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/** Generic, safe-to-show-the-customer message — never reveals the exact
 * limit/window (nothing for an attacker to calibrate against). */
export function rateLimitMessage(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
