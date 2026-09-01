"use server";

// Phase 4.3.6 — the customer-facing quotation form (quotation-form.tsx)
// previously had no backend at all ("Frontend-only demo submission — no
// email/API/database call yet."). This is the first time a submission is
// actually persisted. Guest-friendly by design, matching the form's
// existing behavior exactly: it has never required authentication, so
// login is still never required here — a logged-in visitor's session id is
// attached only when available, purely for convenience.
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

// Phase 4.4.26 — conservative, IP-based: legitimate business inquiries
// are naturally infrequent, so a tighter limit than the other public
// forms is appropriate without risking a real bulk-procurement lead.
const QUOTATION_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 3 };

const quotationSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  companyName: z.string().trim().min(1, "Company name is required."),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Phone number is required."),
  requirement: z.string().trim().min(1, "Please tell us what you need."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .positive("Quantity must be a valid positive number."),
  preferredContact: z.enum(["email", "phone"]).optional(),
  additionalRequirements: z.string().trim().optional(),
  message: z.string().trim().min(1, "Please add a short message."),
});

type QuotationFormField = keyof z.infer<typeof quotationSchema> | "form";

export type QuotationState = {
  errors?: Partial<Record<QuotationFormField, string>>;
  success?: boolean;
};

export async function submitQuotation(
  _prevState: QuotationState,
  formData: FormData,
): Promise<QuotationState> {
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`quotation:${ip}`, QUOTATION_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { errors: { form: rateLimitMessage(rateLimit.retryAfterMs) } };
  }

  const parsed = quotationSchema.safeParse({
    fullName: formData.get("fullName"),
    companyName: formData.get("companyName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    requirement: formData.get("requirement"),
    quantity: formData.get("quantity"),
    preferredContact: formData.get("preferredContact") || undefined,
    additionalRequirements: formData.get("additionalRequirements") || undefined,
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const errors: QuotationState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as QuotationFormField] = issue.message;
      }
    }
    return { errors };
  }
  const data = parsed.data;

  const session = await auth();

  try {
    await db.quotation.create({
      data: {
        userId: session?.user?.id ?? null,
        fullName: data.fullName,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        requirement: data.requirement,
        quantity: data.quantity,
        preferredContact: data.preferredContact ? (data.preferredContact.toUpperCase() as "EMAIL" | "PHONE") : null,
        additionalRequirements: data.additionalRequirements || null,
        message: data.message,
      },
    });
  } catch (err) {
    // Never expose raw Prisma/SQL errors to the client.
    console.error("[business/quotation] submitQuotation failed:", err);
    return { errors: { form: "Unable to submit your request. Please try again." } };
  }

  return { success: true };
}
