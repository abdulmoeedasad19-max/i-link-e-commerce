"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { notifyWelcome } from "@/lib/email/notify";
import { consumeRateLimit, getClientIp, rateLimitMessage } from "@/lib/rate-limit";

// Phase 4.4.26 — conservative: signup is a meaningful action (creates a
// real account) already throttled somewhat by bcrypt's own cost, so this
// exists purely to cap scripted account-creation floods, not to bother a
// genuine visitor. IP-based — never a client-submitted identifier alone,
// since email is exactly what an attacker controls arbitrarily.
const SIGNUP_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 5 };

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name."),
    email: z.email("Please enter a valid email address."),
    phone: z.string().trim().min(1, "Phone number is required."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type SignupField = "name" | "email" | "phone" | "password" | "confirmPassword" | "form";

export type SignupState = {
  errors?: Partial<Record<SignupField, string>>;
};

export async function signup(_prevState: SignupState, formData: FormData): Promise<SignupState> {
  // Rate-limited first, before any validation/DB work — see rate-limit.ts.
  const ip = await getClientIp();
  const rateLimit = await consumeRateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return { errors: { form: rateLimitMessage(rateLimit.retryAfterMs) } };
  }

  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: SignupState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as SignupField] = issue.message;
      }
    }
    return { errors };
  }

  // Normalize before both the lookup and the insert, so "Foo@Bar.com" and
  // "foo@bar.com" are always treated as the same account.
  const email = parsed.data.email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: "An account with this email already exists." } };
  }

  let passwordHash: string;
  try {
    passwordHash = await hashPassword(parsed.data.password);
  } catch {
    // Never expose the underlying bcrypt error to the client.
    return { errors: { form: "Unable to create your account. Please try again." } };
  }

  try {
    await db.user.create({
      data: {
        name: parsed.data.name,
        email,
        phone: parsed.data.phone,
        passwordHash,
        // Explicit and hardcoded — role is never read from client input,
        // so a submitted `role` field (if any) can never grant ADMIN.
        role: "CUSTOMER",
      },
    });
  } catch (error) {
    // A race with a concurrent signup for the same email surfaces here as a
    // unique-constraint violation rather than at the findUnique check above.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { errors: { email: "An account with this email already exists." } };
    }
    // Never expose raw Prisma/SQL errors to the client.
    return { errors: { form: "Unable to create your account. Please try again." } };
  }

  // Downstream of the successful create above, never inside it — an email
  // provider outage must never affect account creation. Never throws (see
  // notify.ts), so no try/catch is needed here.
  notifyWelcome({ email, name: parsed.data.name });

  try {
    // Auth.js's own documented pattern: let signIn redirect on success (it
    // throws a NEXT_REDIRECT signal internally), and only intercept actual
    // authentication failures.
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        errors: { form: "Your account was created, but automatic sign-in failed. Please log in." },
      };
    }
    // Rethrow the redirect signal (and any genuinely unexpected error).
    throw error;
  }

  return {};
}
