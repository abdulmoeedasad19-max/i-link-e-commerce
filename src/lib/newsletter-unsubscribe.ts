// Phase 4.4.28 — stateless, HMAC-signed unsubscribe tokens. No new schema
// field, no new secret to generate/manage: the signing key is derived
// from the existing AUTH_SECRET (already required for the app to run at
// all) via its own HMAC, so a leaked derived key can never be used to
// recover AUTH_SECRET itself, and this never touches Auth.js's own token
// handling in src/auth.ts.
//
// The token authorizes one specific email address only — the signature
// (not the email's mere presence) is what proves the link was actually
// issued by this server, so an attacker who guesses/knows someone else's
// email still cannot forge a valid token for it. Verification is a pure
// recomputation, not a database lookup, so a token never expires and
// never needs its own storage or cleanup — matching the "smallest
// production-safe solution" the phase called for.
import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

function signingKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // Matches this project's existing convention (see src/auth.ts /
    // .env's own documentation) — AUTH_SECRET is required for the app to
    // run at all, so this can only happen in a broken deployment, never
    // in normal operation. Never invented, never defaulted.
    throw new Error("AUTH_SECRET is not configured — cannot sign unsubscribe tokens.");
  }
  return createHmac("sha256", secret).update("newsletter-unsubscribe-v1").digest("hex");
}

/** Deterministic, URL-safe signature for a normalized (lowercased,
 * trimmed) email address. Callers must normalize the email the exact
 * same way before both generating and verifying — see normalizeEmail(). */
export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", signingKey()).update(email).digest("base64url");
}

/** Constant-time comparison — never a plain `===` on secret-derived
 * values, so a mismatched token can't be distinguished by timing. */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(token);
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
