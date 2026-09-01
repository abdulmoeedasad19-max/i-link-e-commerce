"use server";

import { z } from "zod";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { isSafeCallbackUrl } from "@/lib/utils";
import { checkLoginAttemptStatus } from "@/lib/login-rate-limit";

const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginField = "email" | "password" | "form";

export type LoginState = {
  errors?: Partial<Record<LoginField, string>>;
};

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: LoginState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as LoginField] = issue.message;
      }
    }
    return { errors };
  }

  // Normalize the same way signup does, so case differences at login never
  // cause a false "account not found".
  const email = parsed.data.email.toLowerCase();

  // Phase 4.4.1 — best-effort friendly messaging only. The actual
  // enforcement is inside authorize() (src/auth.ts), which is reachable by
  // any caller and can't be bypassed by skipping this action; this
  // pre-check exists purely so a throttled visitor sees a specific message
  // instead of the generic "Invalid email or password." below.
  const attemptStatus = await checkLoginAttemptStatus(email);
  if (attemptStatus.locked) {
    const minutes = Math.max(1, Math.ceil(attemptStatus.retryAfterMs / 60_000));
    return {
      errors: { form: `Too many failed login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    };
  }

  const requestedCallback = formData.get("callbackUrl");
  const redirectTo = isSafeCallbackUrl(requestedCallback) ? requestedCallback : "/account";

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Identical message whether the email doesn't exist or the password
      // is wrong — the shared authorize() in src/auth.ts already returns
      // null for both cases, so this is the only outcome we can see here.
      return { errors: { form: "Invalid email or password." } };
    }
    // Rethrow the redirect signal (and any genuinely unexpected error).
    throw error;
  }

  return {};
}
