// Phase 4.4.24 — Category Repository Layer.
//
// This is the single authoritative, database-backed source for
// storefront category data, replacing the static `categories` array in
// site-config.ts (which remains only as prisma/seed.ts's seed-data
// source via src/lib/products.ts — never a live storefront read path).
// Mirrors products-repository.ts's exact conventions.
//
// There is no active/inactive concept in the Category model — every row
// is implicitly public. A category can only stop being publicly visible
// by being deleted, which src/app/admin/categories/actions.ts already
// blocks while any product still references it. This matches the
// storefront's pre-existing behavior exactly: nothing here changes what
// "active" means, it only changes where the data comes from.
import "server-only";
import { db } from "@/lib/db";
import type { CategoryTier as DbCategoryTier } from "@/generated/prisma/enums";

/** Matches the lowercase tier literals the storefront's tiered display
 * components (ShopByCategory) already key off of — converting here means
 * no downstream component needs to change its tier logic. */
export type CategoryTierDisplay = "featured" | "secondary" | "compact";

const TIER_DISPLAY: Record<DbCategoryTier, CategoryTierDisplay> = {
  FEATURED: "featured",
  SECONDARY: "secondary",
  COMPACT: "compact",
};

/** A drop-in replacement for site-config.ts's static `Category` type —
 * same fields (name, href, icon, description, image, tier) plus `id`/
 * `slug`, which no consumer needed before but every DB-backed one can
 * now rely on instead of re-deriving from `href`. */
export type RepositoryCategory = {
  id: string;
  name: string;
  slug: string;
  href: string;
  icon: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  image: string;
  tier: CategoryTierDisplay;
};

function wrapError(context: string, error: unknown): Error {
  console.error(`[categories-repository] ${context}:`, error);
  return new Error("Unable to load category data.");
}

function toCategory(row: {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  image: string | null;
  tier: DbCategoryTier;
}): RepositoryCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    href: `/shop/${row.slug}`,
    icon: row.icon ?? "",
    description: row.description ?? "",
    seoTitle: row.seoTitle ?? null,
    seoDescription: row.seoDescription ?? null,
    image: row.image ?? "",
    tier: TIER_DISPLAY[row.tier],
  };
}

/** All categories, ordered by tier (FEATURED, SECONDARY, COMPACT — the
 * schema's own enum declaration order) then sortOrder — the exact same
 * grouping/ordering the static array previously provided. */
export async function getAllCategories(): Promise<RepositoryCategory[]> {
  try {
    const rows = await db.category.findMany({ orderBy: [{ tier: "asc" }, { sortOrder: "asc" }] });
    return rows.map(toCategory);
  } catch (error) {
    throw wrapError("getAllCategories failed", error);
  }
}

/** A single category by slug, for /shop/[category] resolution. Returns
 * `null` (not `undefined`) for "not found" — the standard
 * repository-layer convention already used throughout
 * products-repository.ts. */
export async function getCategoryBySlug(slug: string): Promise<RepositoryCategory | null> {
  try {
    const row = await db.category.findUnique({ where: { slug } });
    return row ? toCategory(row) : null;
  } catch (error) {
    throw wrapError(`getCategoryBySlug("${slug}") failed`, error);
  }
}
