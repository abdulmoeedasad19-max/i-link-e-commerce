"use server";

// Phase 4.4.9 — the customer-facing contact form (contact-form.tsx)
// previously had no backend at all ("Frontend-only demo submission — no
// email/API/database call yet."). This is the first time a submission is
// actually persisted, mirroring src/app/(storefront)/business/quotation/
// actions.ts exactly. Guest-friendly by design, matching the form's
// existing behavior: it has never required authentication, so login is
// never required here either.
import { z } from "zod";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

// Phase 4.4.26 — conservative, IP-based: this form has no auth, so a
// client-submitted identifier (e.g. the email field) is never trusted as
// the rate-limit key on its own.
const CONTACT_RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };

const contactSchema = z.object({
  name: z.string().trim().min(1, "Full name is required.").max(200, "Name is too long."),
  email: z.email("Enter a valid email address.").max(200, "Email is too long."),
  // Optional, matching the existing form's "Phone (optional)" label exactly
  // — unlike Quotation's phone field, which the quotation form requires.
  phone: z.string().trim().max(50, "Phone number is too long.").optional(),
  subject: z.string().trim().min(1, "Subject is required.").max(200, "Subject is too long."),
  message: z.string().trim().min(1, "Please add a message.").max(5000, "Message is too long."),
});

type ContactFormField = keyof z.infer<typeof contactSchema> | "form";

export type ContactState = {
  errors?: Partial<Record<ContactFormField, string>>;
  success?: boolean;
};

export async function submitContactMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`contact:${ip}`, CONTACT_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { errors: { form: rateLimitMessage(rateLimit.retryAfterMs) } };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const errors: ContactState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as ContactFormField] = issue.message;
      }
    }
    return { errors };
  }
  const data = parsed.data;

  try {
    // status/createdAt/updatedAt are always database-controlled (schema
    // defaults) — never accepted from the client, and not passed here.
    await db.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
      },
    });
  } catch (err) {
    // Never expose raw Prisma/SQL errors to the client.
    console.error("[contact] submitContactMessage failed:", err);
    return { errors: { form: "Unable to send your message. Please try again." } };
  }

  return { success: true };
}
