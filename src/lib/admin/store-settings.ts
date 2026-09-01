// Phase 4.4.8 — the single, authoritative Store Settings read path. Every
// consumer (the admin settings page, the checkout shipping calculation in
// src/lib/coupon-checkout.ts, the checkout preview page) calls this same
// function — there is deliberately no second reader anywhere, matching the
// "ONE authoritative shipping value" requirement this phase was given.
import "server-only";
import { db } from "@/lib/db";
import type { StoreSettings } from "@/generated/prisma/client";
import { siteConfig } from "@/lib/site-config";

// The fixed, well-known singleton id — every reader/writer targets this
// exact row. Prisma's schema-level @default("singleton") on the id column
// means a plain create() with no id supplied already produces this value;
// this constant exists so read/write code never has to repeat the literal.
export const STORE_SETTINGS_ID = "singleton";

/**
 * Always returns a valid settings row. If the singleton hasn't been created
 * yet (e.g. no admin has ever saved Settings), it's created here on first
 * read, seeded with the schema's own defaults — which are exactly the
 * values that were hardcoded before this phase (see prisma/schema.prisma).
 * upsert() (not create()) is what makes this safe under concurrent first
 * reads: whichever call loses the race on the unique id simply updates the
 * row the winner just created, instead of throwing a unique-constraint
 * error. Checkout must never fail merely because no admin has visited the
 * Settings page yet.
 */
export async function getStoreSettings(): Promise<StoreSettings> {
  const existing = await db.storeSettings.findUnique({ where: { id: STORE_SETTINGS_ID } });
  if (existing) return existing;

  return db.storeSettings.upsert({
    where: { id: STORE_SETTINGS_ID },
    update: {},
    create: { id: STORE_SETTINGS_ID },
  });
}

/**
 * Phase 4.4.8 — narrow, server-safe, DB-backed variant of the four
 * `siteConfig` fields an admin can now edit (store name, phone, email,
 * hours). Deliberately NOT a replacement for `siteConfig` itself: every
 * existing consumer (SEO metadata, JSON-LD, the ~17 files with their own
 * duplicated marketing copy, and every "use client" component that
 * currently imports the static object) keeps importing it from
 * src/lib/site-config.ts, completely unaffected — converting those call
 * sites to this async reader is an explicitly out-of-scope, separate
 * follow-up (see the Phase 4.4.8 report), not something this function does
 * on its own. It deliberately lives here, in this "server-only" file,
 * rather than inside site-config.ts itself: that file is imported by
 * several "use client" components (header.tsx, mobile-nav.tsx), and a
 * database-reading function reachable from that module graph breaks the
 * client bundle (Prisma/pg pull in Node-only built-ins) even behind a
 * dynamic import — confirmed by an actual failed `next build` during this
 * phase's implementation. `url` and `shortName` are not editable settings
 * fields, so they pass through from the static config unchanged.
 * `phoneHref` is derived, not stored — it is not one of the five
 * authorized settings fields.
 */
export async function getSiteConfig(): Promise<typeof siteConfig> {
  const settings = await getStoreSettings();
  return {
    name: settings.storeName,
    shortName: siteConfig.shortName,
    url: siteConfig.url,
    phone: settings.phone,
    phoneHref: `tel:+92${settings.phone.replace(/\D/g, "").replace(/^0/, "")}`,
    email: settings.email,
    hours: settings.hours,
  };
}
