import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Layer 2 admin gate — the same auth()-in-layout pattern already used by
 * /account (see src/app/(storefront)/account/layout.tsx), extended with a
 * role check. Never rely on src/proxy.ts (Layer 1) alone; every admin
 * layout/page must call this independently.
 *
 * Unauthenticated visitors are sent to /login. An authenticated customer
 * (role !== "ADMIN") is sent to /account rather than back through /login —
 * /login already redirects an authenticated session straight to /account,
 * so this just skips the redundant hop instead of bouncing them through it.
 *
 * The return type is narrowed to guarantee `user.id`/`role` are always
 * present (session/user.id/role are optional on the base Session type as
 * of Phase 4.4.26, since an invalidated session carries neither — see
 * src/auth.ts's jwt() callback) — `redirect()` returns `never`, so by the
 * time this function returns normally both checks above have already
 * passed, and every one of the 20+ admin actions that reads
 * `session.user.id` as `adminId` for logActivity() can keep doing so
 * without an extra null-check at every call site.
 */
export async function requireAdmin(): Promise<Session & { user: { id: string; role: "ADMIN" } }> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return session as Session & { user: { id: string; role: "ADMIN" } };
}
