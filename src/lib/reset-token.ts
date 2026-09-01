// Phase 4.4.29 — password reset tokens. Deliberately different design
// from Phase 4.4.28's newsletter-unsubscribe tokens (stateless, HMAC-
// derived from AUTH_SECRET, never expire, never consumed): a reset token
// must be single-use and revocable, so it needs a database row to
// consume, and its own randomness — not a derivation from a shared
// secret — is what makes it unguessable. Only a SHA-256 hash of the raw
// token is ever stored (see VerificationToken.token in schema.prisma,
// reused as-is with zero schema change — see the phase report for why
// this existing Auth.js adapter model, otherwise unused by this project,
// is exactly the right shape already: identifier/token/expires). A
// database leak alone can never be used to reset an account, since the
// raw token can't be recovered from its hash.
import "server-only";
import { randomBytes, createHash } from "crypto";

const RAW_TOKEN_BYTES = 32; // 256 bits of entropy — infeasible to guess or brute-force.

export const RESET_TOKEN_EXPIRY_MINUTES = 30;
export const RESET_TOKEN_EXPIRY_MS = RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000;

export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(RAW_TOKEN_BYTES).toString("base64url");
  return { raw, hash: hashResetToken(raw) };
}

/** Callers must hash the exact same way on both write and lookup — this
 * is the only function that does so, used by both actions.ts files. */
export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
