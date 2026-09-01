"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth, unstable_update } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter a valid name."),
  // Deliberately broad and not country-specific: digits, spaces, and the
  // common +/-/() separators, 7-20 characters.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Please enter a valid phone number."),
});

type ProfileField = "name" | "phone" | "form";

export type ProfileState = {
  errors?: Partial<Record<ProfileField, string>>;
  success?: boolean;
};

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    // Belt-and-suspenders: this action is only ever reachable from a page
    // already gated by proxy.ts + the page's own auth() check, but never
    // trust that alone — reject outright if there's no session.
    return { errors: { form: "You must be logged in to update your profile." } };
  }

  const raw = {
    name: formData.get("name"),
    phone: formData.get("phone"),
  };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: ProfileState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as ProfileField] = issue.message;
      }
    }
    return { errors };
  }

  try {
    // Scoped exclusively to the authenticated session's own id — never a
    // client-supplied id. Only `name`/`phone` are ever written here: even
    // if a forged request included `role`, `email`, `id`, `passwordHash`,
    // `emailVerified`, `createdAt`, or `updatedAt` in its form data, none
    // of those fields are read from `formData` anywhere in this action, so
    // they can never reach this Prisma call.
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
      },
    });
  } catch {
    // Never expose raw Prisma/SQL errors to the client.
    return { errors: { form: "Unable to update your profile. Please try again." } };
  }

  // `name` is mirrored on the JWT session (it's what the dashboard's
  // welcome message reads), so it needs an explicit session refresh or it
  // would keep showing the old value until the next login. `phone` is not
  // part of the session at all — the profile page re-reads it fresh from
  // the database on every request, so no session update is needed for it.
  //
  // `unstable_update()` is Auth.js v5's own documented mechanism for
  // refreshing a JWT session's contents from server-side code without
  // requiring the user to sign in again — not a custom session system.
  await unstable_update({ user: { name: parsed.data.name } });

  revalidatePath("/account/profile");
  revalidatePath("/account");

  return { success: true };
}

// Phase 4.4.16 — self-service password change for an already-authenticated
// customer. Deliberately a separate action/schema from updateProfile above:
// different concern, different validation (current-password verification),
// different success semantics. Reuses signup's own password-strength rule
// (min 8 characters — see src/app/(storefront)/signup/actions.ts) so signup
// and password change never enforce conflicting policies. Not a forgotten-
// password flow: there is no token, no email, and the target account is
// always the authenticated session's own — never a client-supplied id.
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type ChangePasswordField = "currentPassword" | "newPassword" | "confirmPassword" | "form";

export type ChangePasswordState = {
  errors?: Partial<Record<ChangePasswordField, string>>;
  success?: boolean;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { form: "You must be logged in to change your password." } };
  }

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: ChangePasswordState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field as ChangePasswordField] = issue.message;
      }
    }
    return { errors };
  }

  // Scoped exclusively to the authenticated session's own id — never a
  // client-supplied id. passwordHash is only ever read here, right before
  // verifying it, never returned to the client.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user || !user.passwordHash) {
    // Same generic failure whether the account somehow no longer exists or
    // has no password set (e.g. a future OAuth-only account) — never reveal
    // which case it was, mirroring auth.ts's own authorize() precedent.
    return { errors: { form: "Unable to change your password. Please try again." } };
  }

  const isCurrentPasswordValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    return { errors: { currentPassword: "Current password is incorrect." } };
  }

  let newPasswordHash: string;
  try {
    newPasswordHash = await hashPassword(parsed.data.newPassword);
  } catch {
    // Never expose the underlying bcrypt error to the client.
    return { errors: { form: "Unable to change your password. Please try again." } };
  }

  try {
    // Scoped exclusively to the authenticated session's own id — never a
    // client-supplied id, and never a broad updateMany with no id
    // condition. Only passwordHash is written here.
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });
  } catch {
    // Never expose raw Prisma/SQL errors to the client.
    return { errors: { form: "Unable to change your password. Please try again." } };
  }

  return { success: true };
}
