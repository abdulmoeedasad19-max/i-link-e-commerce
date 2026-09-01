import NextAuth from "next-auth";
import type { Session } from "next-auth";
import type { JWT } from "@auth/core/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { checkLoginAttemptStatus, recordFailedLoginAttempt, clearLoginAttempts } from "@/lib/login-rate-limit";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  // The Credentials provider only allows JWT sessions (Auth.js does not
  // support persisting credentials-based sessions to a database session
  // table) — the adapter is still wired in for its User/Account tables,
  // which matters the moment an OAuth provider is added alongside this one.
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        // The Credentials provider hands us `unknown` values — never trust
        // them without validation before touching the database.
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        // Same normalization login/signup already apply before this point —
        // re-applied here too since this is the actual enforcement
        // boundary, reachable by any caller of signIn("credentials", ...),
        // not just the login form.
        const email = parsed.data.email.toLowerCase();
        const { password } = parsed.data;

        // Phase 4.4.1 — the authoritative brute-force gate. Checked before
        // touching the database or running bcrypt, so a locked-out email
        // never causes either. This is the single choke point every
        // credentials sign-in passes through, so it can't be bypassed by
        // calling signIn() from somewhere other than the login form.
        const attemptStatus = await checkLoginAttemptStatus(email);
        if (attemptStatus.locked) {
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });

        // Same generic failure whether the account doesn't exist, has no
        // password set (e.g. an OAuth-only account in the future), or the
        // password is wrong — never reveal which case it was.
        if (!user || !user.passwordHash) {
          await recordFailedLoginAttempt(email);
          return null;
        }

        const isValidPassword = await verifyPassword(password, user.passwordHash);
        if (!isValidPassword) {
          await recordFailedLoginAttempt(email);
          return null;
        }

        await clearLoginAttempts(email);

        // Deliberately excludes passwordHash — this object is what ends up
        // on the JWT and, eventually, the client-visible session.
        // `updatedAt` is not a secret either — it's the security-stamp
        // seed the jwt() callback below uses (see Phase 4.4.26).
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: user.updatedAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // `user` is only present on the initial sign-in call.
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.securityStamp = user.updatedAt.getTime();
        return token;
      }

      // Phase 4.4.26 — a legitimate, already-authenticated request
      // explicitly asked to refresh this session (e.g. after a profile
      // name change, via unstable_update() in account/profile/actions.ts).
      // Re-stamp from the current database value here instead of running
      // the staleness check below, so this exact call — which itself just
      // caused User.updatedAt to change — can never invalidate the very
      // session that triggered it.
      if (trigger === "update") {
        if (session?.user?.name) {
          token.name = session.user.name;
        }
        if (token.id) {
          const dbUser = await db.user.findUnique({ where: { id: token.id }, select: { updatedAt: true } });
          if (dbUser) {
            token.securityStamp = dbUser.updatedAt.getTime();
          }
        }
        return token;
      }

      // Every other call (i.e. every normal authenticated request):
      // re-validate this token's stamp against the database. A mismatch
      // means something about this user's row changed since the token
      // was issued — most importantly a password change
      // (account/profile/actions.ts's changePassword, or an admin-assisted
      // reset via admin/customers/actions.ts's resetCustomerPassword), but
      // also a role change — so a demoted/promoted admin's existing
      // session can't keep operating under its old, now-stale role either.
      // One indexed primary-key lookup per authenticated request — the
      // accepted cost of real session invalidation on top of JWT-strategy
      // sessions with no separate session store or schema change.
      if (token.id) {
        const dbUser = await db.user.findUnique({ where: { id: token.id }, select: { updatedAt: true } });
        if (!dbUser || dbUser.updatedAt.getTime() !== token.securityStamp) {
          delete token.id;
          delete token.role;
          delete token.securityStamp;
        }
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      // Explicitly typed to the JWT-strategy shape only (this project
      // never uses `strategy: "database"` — the adapter above is wired
      // in only for its User/Account tables). Auth.js's own callback
      // signature is a union covering both strategies simultaneously,
      // which — combined with the database strategy's AdapterUser.id
      // being non-optional — collapses our intentionally-optional
      // Session.user.id/role (see src/types/next-auth.d.ts) back to a
      // required string under plain inference. This annotation is what
      // makes `session.user.id = token.id` (both possibly undefined
      // after Phase 4.4.26's session-invalidation check below) type-check
      // correctly instead of fighting that unrelated database-strategy
      // branch of the type.
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
