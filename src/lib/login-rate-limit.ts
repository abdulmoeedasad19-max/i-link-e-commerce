// Phase 4.4.1 — brute-force protection for the Credentials login flow.
// Backed by the LoginAttempt table (see prisma/schema.prisma) rather than
// an in-memory counter: this deployment runs on serverless Postgres with
// no shared in-memory store across instances/executions, so only a
// DB-backed tracker enforces the limit consistently everywhere.
import "server-only";
import { db } from "@/lib/db";

// Kept as a single small config block rather than scattered magic numbers.
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
// A failure streak older than this is treated as stale and starts over,
// rather than accumulating forever from sparse, unrelated attempts.
const FAILURE_DECAY_MS = LOCKOUT_DURATION_MS;

export type LoginAttemptStatus = { locked: false } | { locked: true; retryAfterMs: number };

/** Read-only check — never mutates state. Call before attempting sign-in. */
export async function checkLoginAttemptStatus(email: string): Promise<LoginAttemptStatus> {
  const attempt = await db.loginAttempt.findUnique({ where: { email }, select: { lockedUntil: true } });
  if (!attempt?.lockedUntil) return { locked: false };

  const remainingMs = attempt.lockedUntil.getTime() - Date.now();
  if (remainingMs <= 0) return { locked: false };

  return { locked: true, retryAfterMs: remainingMs };
}

/**
 * Records one failed attempt for this email, locking it out once
 * MAX_FAILED_ATTEMPTS is reached within FAILURE_DECAY_MS. A tight race
 * between two simultaneous failed attempts could under-count by one — an
 * accepted, minor limitation for a best-effort throttle, not a hard
 * security boundary requiring atomic increments the way payment/inventory
 * math does elsewhere in this project.
 */
export async function recordFailedLoginAttempt(email: string): Promise<void> {
  const now = new Date();
  const existing = await db.loginAttempt.findUnique({
    where: { email },
    select: { failedCount: true, lastFailedAt: true },
  });

  const isFreshStreak =
    !existing?.lastFailedAt || now.getTime() - existing.lastFailedAt.getTime() > FAILURE_DECAY_MS;
  const nextFailedCount = isFreshStreak ? 1 : existing.failedCount + 1;
  const lockedUntil = nextFailedCount >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;

  await db.loginAttempt.upsert({
    where: { email },
    create: { email, failedCount: nextFailedCount, lastFailedAt: now, lockedUntil },
    update: { failedCount: nextFailedCount, lastFailedAt: now, lockedUntil },
  });
}

/** Called after a genuinely successful authentication — clears any history
 * for this email so a legitimate user is never penalized for past failures. */
export async function clearLoginAttempts(email: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { email } });
}
