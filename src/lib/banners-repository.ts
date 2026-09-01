// Phase 4.4.13 — the storefront's read path for homepage banners, mirroring
// src/lib/products-repository.ts's shape: read-only, server-only, no
// admin dependency. This is the ONLY place the public homepage should ever
// read Banner rows from — the admin read layer (src/lib/admin/banners.ts)
// is a separate, admin-only module that also sees inactive rows.
import "server-only";
import { db } from "@/lib/db";

/**
 * Clean, storefront-facing banner shape — exactly what Hero renders, never
 * more. `id`/`isActive`/`createdAt`/`updatedAt` are intentionally excluded:
 * the storefront has no use for them.
 */
export type StorefrontBanner = {
  id: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

/**
 * Active banners, in display order. `sortOrder` is the primary sort;
 * `createdAt` is a stable secondary tiebreaker for any rows that happen to
 * share a sortOrder value (e.g. two banners both left at the default 0),
 * so the order is never arbitrary/database-dependent between requests.
 * Returns an empty array — never throws — on any failure, so a database
 * hiccup can never crash the homepage; the caller (Hero, via page.tsx)
 * already has an established safe-empty-state to fall back to.
 */
export async function getActiveBanners(): Promise<StorefrontBanner[]> {
  try {
    const rows = await db.banner.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        image: true,
        imageAlt: true,
        category: true,
        title: true,
        description: true,
        primaryCtaLabel: true,
        primaryCtaHref: true,
        secondaryCtaLabel: true,
        secondaryCtaHref: true,
      },
    });
    return rows;
  } catch (error) {
    // Never expose raw Prisma/SQL errors, and never let a banner-read
    // failure take down the homepage — same principle already applied to
    // every other public read in this codebase.
    console.error("[banners-repository] getActiveBanners failed:", error);
    return [];
  }
}
