// Phase 4.4.22 — the only function anywhere in the app that actually calls
// out to the email provider. Every event-level notify function in
// notify.ts goes through this. Deliberately swallows every failure: a
// business mutation (order created, payment confirmed, return approved,
// ...) has already succeeded by the time this is called, and an email
// provider outage or misconfiguration must never surface as an error to
// the customer or roll back anything. See the "IMPORTANT TRANSACTION
// RULE" this module exists to satisfy — callers invoke this AFTER their
// own db.$transaction has already committed, never from inside one.
import "server-only";
import { getEmailClient, EMAIL_FROM } from "./client";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const client = getEmailClient();
  if (!client) {
    // No provider configured — this is the expected, supported state for
    // this project today, not an error. Nothing is logged as a failure.
    return;
  }

  try {
    const result = await client.emails.send({
      from: EMAIL_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (result.error) {
      // Resend returns provider errors as a value, not a thrown exception.
      // Logged server-side only — never the raw error object (which could
      // echo back the request), just its message, and never the API key.
      console.error(`[email] Resend rejected "${payload.subject}" to a customer:`, result.error.message);
    }
  } catch (err) {
    // Network failure, DNS failure, etc. Same rule: log and move on.
    console.error(`[email] Failed to send "${payload.subject}":`, err instanceof Error ? err.message : err);
  }
}
