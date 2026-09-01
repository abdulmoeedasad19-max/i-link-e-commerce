import type { NextConfig } from "next";

// Master Phase — Production Security Hardening. A deliberately static CSP
// (set once here, not per-request via proxy.ts) rather than the
// nonce-based pattern Next.js's own docs otherwise recommend as
// stricter: a nonce requires every page to opt into dynamic rendering
// (no ISR, no static generation — see
// node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md,
// "Static vs Dynamic Rendering with CSP"), which would silently disable
// the homepage's `revalidate = 60` and every statically-generated
// shop/blog page — a real behavioral/performance regression this phase
// is explicitly not authorized to make. This is exactly the static
// "Without Nonces" baseline that same doc recommends for apps that keep
// static rendering, matched against this app's actual, audited resource
// usage (see the phase report for the full inventory this was built
// from) rather than copied as a generic template:
//
// - script-src/style-src need 'unsafe-inline': Next.js's own official
//   static-CSP example includes 'unsafe-inline' on script-src because
//   the App Router's RSC hydration payload (`self.__next_f.push(...)`)
//   is delivered as inline <script> tags with no nonce available outside
//   the dynamic-rendering path; this codebase also renders real inline
//   `style="..."` attributes via React's `style` prop (e.g.
//   src/components/sections/newsletter.tsx's background-grid pattern),
//   which is a genuine, demonstrated need, not a default. Eliminating
//   either would require the nonce-based proxy approach and its
//   static-rendering cost above.
// - No third-party script/font/analytics domains anywhere in the
//   codebase (audited: no <script src="https://...">, no Google
//   Analytics/Tag Manager, no CDN scripts) — script-src and style-src
//   need no external hosts.
// - Fonts are self-hosted via next/font/google (see src/lib/fonts.ts),
//   which downloads and bundles font files at build time — no runtime
//   request to fonts.googleapis.com/fonts.gstatic.com ever happens, so
//   font-src is 'self' only.
// - next.config.ts sets no images.remotePatterns/domains, so next/image
//   only ever serves local, same-origin images (verified: zero
//   data:/blob: image usage anywhere in src/) — img-src is 'self' only.
// - Every mutation in this app goes through same-origin Server Actions
//   or the single NextAuth route handler — no client-side fetch to an
//   external API anywhere — connect-src is 'self' only.
// - No <iframe> anywhere in the app — frame-src and frame-ancestors are
//   both 'none' (the latter is also the modern replacement for the
//   X-Frame-Options header set alongside it below, for older-browser
//   defense in depth).
// 'unsafe-eval' is dev-only, matching Next's own documented guidance:
// "React uses eval to provide enhanced debugging information... Neither
// React nor Next.js use eval in production by default." Confirmed live
// — without this, dev mode's admin dashboard (and any other page) fails
// to render client-side at all, with the browser console reporting
// "eval() is not supported in this environment... make sure that
// unsafe-eval is included" — a real regression found via a genuine
// browser during this same phase, not merely a documented possibility.
// Production is unaffected either way.
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self';
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-src 'none';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90, 100],
  },
  // Admin Product Image Upload bugfix — Next.js's own default Server
  // Action request body limit is 1MB (see
  // node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md),
  // silently unconfigured until now. The product-image upload UI accepts
  // files up to 5MB (see src/lib/storage/local-images.ts), so any real
  // photo over roughly 1MB — a routine size for an actual product photo,
  // not an edge case — was rejected by Next.js itself before
  // uploadStagedProductImage/uploadProductImages ever ran, independent
  // of anything in this app's own code. 6mb leaves headroom above the
  // 5MB file limit for the multipart boundary/header overhead the docs
  // call out.
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          // 2 years, includeSubDomains — the standard preload-eligible
          // value. Harmless to set unconditionally: browsers ignore HSTS
          // entirely on a plain-HTTP response (e.g. local dev), so this
          // only ever takes effect once the app is actually served over
          // HTTPS in production.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Superseded by frame-ancestors above in CSP-aware browsers,
          // kept for defense in depth in older ones.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Every browser feature this app never uses, explicitly denied
          // for every origin including this one — audited: no
          // geolocation, camera, microphone, or Payment Request API
          // usage anywhere in src/.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
