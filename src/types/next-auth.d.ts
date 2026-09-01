import type { Role } from "@/generated/prisma/client";

// `next-auth`'s own `Session`/`User` exports are pure type re-exports of
// @auth/core/types's interfaces (`export type { Session, User, ... } from
// "@auth/core/types"` in next-auth/index.d.ts), not fresh interface
// declarations — so a `declare module "next-auth"` augmentation alone
// does not merge into the actual interface the callback signatures use.
// Both modules are augmented here to be safe/explicit; @auth/core/types
// is the one that actually matters at the `session()`/`authorize()`
// callback sites.
//
// The `Session.user` shape below is written out directly (name/email/
// image) rather than intersecting with `DefaultSession["user"]`
// (equivalently `User`) — that would re-import `User.id`/`role` as
// *required* fields into the intersection, silently collapsing our
// intentionally-optional id/role right back to required and defeating
// the whole point of this override (Phase 4.4.26's session-invalidation
// check needs to be able to represent "no id/role" on a stale session).
declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
    /** Phase 4.4.26 — snapshot of User.updatedAt at the moment this user
     * authenticated. Stamped onto the JWT so a later account change
     * (most importantly a password change) can be detected and the
     * token invalidated. Not a secret — just a timestamp. */
    updatedAt: Date;
  }

  interface Session {
    // Optional now (Phase 4.4.26): a session whose token has been
    // invalidated (see src/auth.ts's jwt() callback) carries no id/role,
    // which is exactly what every existing `if (!session?.user?.id)`
    // ownership/auth check throughout the app already treats as "not
    // logged in" — no call site needed to change for this.
    user: {
      id?: string;
      role?: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/types" {
  interface User {
    id: string;
    role: Role;
    updatedAt: Date;
  }

  interface Session {
    user: {
      id?: string;
      role?: Role;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    /** Phase 4.4.26 — security-stamp pattern (same concept ASP.NET
     * Identity uses): User.updatedAt, as epoch milliseconds, at the
     * moment this token was issued. Re-validated against the database
     * on every subsequent request in src/auth.ts's jwt() callback — a
     * mismatch means the account changed since sign-in and the token
     * must stop granting access. */
    securityStamp?: number;
  }
}
