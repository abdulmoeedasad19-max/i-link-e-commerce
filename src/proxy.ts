import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Layer 1 of route protection for /account/*, /checkout/*, and /admin/*.
// This is Next.js 16's renamed replacement for `middleware.ts` (the
// `middleware` file convention is deprecated as of v16 — using the old
// filename would mean this file is silently never invoked at all, so
// `proxy.ts` is the file Next.js actually looks for). Proxy defaults to the
// Node.js runtime in v16, so importing `@/auth` (and, transitively, the
// Prisma driver adapter) here is fully supported.
//
// This is a fast, DB-free check: the JWT session strategy means `req.auth`
// is populated by decrypting the session cookie, not by querying the
// database — `role` is already embedded in that token (see the `jwt`/
// `session` callbacks in src/auth.ts), so the admin role check below is
// just as cheap as the login check, no extra DB round trip. Layer 2 (an
// independent auth() check in every protected Server Component/layout)
// still applies on top of this — see src/app/(storefront)/account/ and
// src/lib/admin/require-admin.ts.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  // Phase 4.4.26 — `req.auth` can now be a truthy session object with no
  // `user.id` (see src/auth.ts's jwt() callback: a stale, invalidated
  // token still produces a session, just with id/role stripped out), so
  // checking `Boolean(req.auth)` alone would let a stale session straight
  // through this layer. `user.id` is what every layer-2 check already
  // treats as the actual "logged in" signal — matching that here too.
  const isLoggedIn = Boolean(req.auth?.user?.id);

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // An authenticated customer is not sent back through /login (which
    // would just redirect them straight to /account anyway) — send them
    // there directly, mirroring src/lib/admin/require-admin.ts exactly.
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/account", req.nextUrl.origin));
    }

    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};
