// Phase 4.4.24 — Brand Repository Layer.
//
// Single authoritative, database-backed source for storefront brand
// display data (the marquee and the /brands page). Product-level brand
// resolution already went through the DB via products-repository.ts's
// `brand.name` field — this file only closes the remaining gap, where
// the marquee/listing page read a static, hand-maintained list instead.
//
// No active/inactive concept exists on Brand, matching Category exactly
// — a brand can only stop being visible by being deleted, which
// src/app/admin/brands/actions.ts already blocks while any product still
// references it.
import "server-only";
import { db } from "@/lib/db";

export type RepositoryBrand = {
  id: string;
  name: string;
  slug: string;
  /** The exact stored path (e.g. "/brands/hp.svg"), or null if this
   * brand has no logo asset on file. Never derived/guessed from the
   * slug — using the DB's own value directly avoids the slug-vs-asset
   * mismatches the static config had (e.g. brand slug "wd" vs the
   * static config's asset-derived slug "westerndigital"). */
  logoUrl: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

function wrapError(context: string, error: unknown): Error {
  console.error(`[brands-repository] ${context}:`, error);
  return new Error("Unable to load brand data.");
}

/** All brands, ordered by name. */
export async function getAllBrands(): Promise<RepositoryBrand[]> {
  try {
    const rows = await db.brand.findMany({ orderBy: { name: "asc" } });
    return rows.map((b) => ({ 
      id: b.id, 
      name: b.name, 
      slug: b.slug, 
      logoUrl: b.logoUrl,
      description: b.description,
      seoTitle: b.seoTitle,
      seoDescription: b.seoDescription,
    }));
  } catch (error) {
    throw wrapError("getAllBrands failed", error);
  }
}

export type RepositoryBrandWithLogo = RepositoryBrand & { logoUrl: string };

/** Only brands with a real logo asset on file — for display contexts
 * (the homepage/about marquee) that need an image per entry and have no
 * sensible fallback for a brand without one. */
export async function getBrandsWithLogo(): Promise<RepositoryBrandWithLogo[]> {
  const all = await getAllBrands();
  return all.filter((b): b is RepositoryBrandWithLogo => Boolean(b.logoUrl));
}

export async function getBrandBySlug(slug: string): Promise<RepositoryBrand | null> {
  try {
    const row = await db.brand.findUnique({ where: { slug } });
    if (!row) return null;
    return { 
      id: row.id, 
      name: row.name, 
      slug: row.slug, 
      logoUrl: row.logoUrl,
      description: row.description,
      seoTitle: row.seoTitle,
      seoDescription: row.seoDescription,
    };
  } catch (error) {
    throw wrapError(`getBrandBySlug("${slug}") failed`, error);
  }
}
