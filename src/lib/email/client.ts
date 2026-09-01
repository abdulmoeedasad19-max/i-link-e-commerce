// Phase 4.4.22 — the single place the Resend SDK and its API key are ever
// touched. Every other email module goes through send.ts, which goes
// through this file — nothing else in the app imports "resend" directly
// or reads RESEND_API_KEY. This file has no "use client" boundary risk:
// it's never imported by a Client Component, only by other server-only
// modules under src/lib/email/.
import "server-only";
import { Resend } from "resend";
import { siteConfig } from "@/lib/site-config";

let cached: Resend | null = null;

/**
 * Returns a Resend client, or null if RESEND_API_KEY isn't set. Callers
 * (send.ts) treat null as "email sending is disabled" and no-op safely —
 * this project runs correctly with no email provider configured at all.
 */
export function getEmailClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!cached) {
    cached = new Resend(apiKey);
  }
  return cached;
}

/**
 * The verified sender address. Resend requires the sending domain to be
 * DNS-verified (SPF/DKIM) before it will actually deliver from a real
 * address — until EMAIL_FROM_ADDRESS is set to a verified address, this
 * placeholder will cause Resend to reject the send (visible in the
 * server log via send.ts's error handling, never thrown at the caller).
 */
export const EMAIL_FROM = process.env.EMAIL_FROM_ADDRESS || `${siteConfig.name} <no-reply@ilinksystems.com>`;
