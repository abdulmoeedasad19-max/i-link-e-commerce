// Phase 4.2.3 — Product Repository Layer.
//
// This is the ONLY place database Product reads should happen. It is a
// read-only, server-only companion to src/lib/products.ts (the legacy
// static catalog), which remains the storefront's actual source of truth
// until a later phase switches pages over. Nothing in this file is
// imported by any page or component yet.
//
// Every function here filters to ProductStatus.ACTIVE — this is the
// customer-facing rule established in Phase 4.2.1/4.2.2. There is
// deliberately no draft/archived-inclusive variant yet; admin functionality
// will need one later, but adding it now would be speculative (no admin UI
// exists to call it).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

// Single shared include shape so every query below resolves its Category,
// Brand, and ordered Image rows in one query (Prisma compiles `include`
// into joins) — never a separate query per relation, and never a
// separate query per product in a list.
const PRODUCT_INCLUDE = {
  category: true,
  brand: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/**
 * Clean, application-facing product shape. A superset of the static
 * Product type in src/lib/products.ts (same id/name/slug/category/
 * categorySlug/brand/price/image/description/stock/featured fields, so the
 * two are directly comparable field-by-field) plus the additional
 * database-backed fields the static catalog has no equivalent for
 * (images, status, sku, compareAtPrice). No Prisma types (Decimal,
 * relation objects) are exposed past this boundary.
 */
export type RepositoryProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  stock: number;
  featured: boolean;
  status: string;
  category: string;
  categorySlug: string;
  brand: string;
  image: string;
  images: { url: string; altText: string | null; sortOrder: number; isPrimary: boolean }[];
  tags: string[];
  seoTitle: string | null;
  seoDescription: string | null;
};

// Decimal -> number conversion happens exactly once, here, at the
// repository boundary — mirroring the same Decimal-to-number convention
// already used at the Order/OrderItem presentation boundary elsewhere in
// this codebase. Safe (no precision loss): every seeded price is a whole
// Rupee amount well under Number.MAX_SAFE_INTEGER, and .toNumber() performs
// a direct decimal->double conversion, not a string round-trip through
// floating-point parsing — there is no rounding introduced by this step.
function toProduct(p: ProductWithRelations): RepositoryProduct {
  const primaryImage = p.images.find((img) => img.isPrimary) ?? p.images[0];
  // Same fallback the static catalog's defineProducts() already performs
  // (`image ?? category.image`) — replicated here so a product with no
  // ProductImage rows yet still resolves to its category's placeholder,
  // exactly like every one of the 48 seeded products does today.
  const image = primaryImage?.url ?? p.category.image ?? "";

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    shortDescription: p.shortDescription,
    price: p.price.toNumber(),
    compareAtPrice: p.compareAtPrice?.toNumber() ?? null,
    sku: p.sku,
    stock: p.stock,
    featured: p.featured,
    status: p.status,
    category: p.category.name,
    categorySlug: p.category.slug,
    // Every seeded product currently has a brand (all 27 distinct static
    // brand strings were seeded as Brand rows in Phase 4.2.2), so this is
    // never actually empty today — the `?? ""` only guards the schema's
    // optional brandId for a future product created without one.
    brand: p.brand?.name ?? "",
    image,
    images: p.images.map((img) => ({
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
    tags: p.tags,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
  };
}

// Never leak raw Prisma/driver errors (connection strings, SQL, stack
// traces) to whatever eventually renders a repository call's failure —
// same principle already applied to every Prisma call in
// src/app/(storefront)/cart/actions.ts and checkout/actions.ts.
function wrapError(context: string, error: unknown): Error {
  console.error(`[products-repository] ${context}:`, error);
  return new Error("Unable to load product data.");
}

/** All ACTIVE products. No sort is defined by the static catalog beyond its
 * fixed array order, so this uses creation order as the closest stable
 * equivalent — the *set* of products is what the compatibility check
 * verifies, not positional array order. */
export async function getAllProducts(): Promise<RepositoryProduct[]> {
  try {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE" },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProduct);
  } catch (error) {
    throw wrapError("getAllProducts failed", error);
  }
}

/** Mirrors getProductBySlug in src/lib/products.ts. Returns `null` (not
 * `undefined`) for "not found" — the standard Prisma/repository-layer
 * convention; callers already treat both as falsy. An ARCHIVED/DRAFT
 * product is treated identically to a missing one here, matching the
 * existing "no longer available" handling already built into checkout. */
export async function getProductBySlug(slug: string): Promise<RepositoryProduct | null> {
  try {
    const row = await db.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: PRODUCT_INCLUDE,
    });
    return row ? toProduct(row) : null;
  } catch (error) {
    throw wrapError(`getProductBySlug("${slug}") failed`, error);
  }
}

/** Mirrors getProductById in src/lib/products.ts. Server-side only — the
 * client-side call sites of getProductById (cart-context.tsx,
 * wishlist-context.tsx, wishlist/page.tsx) cannot use this function; see
 * the final report for why that gap is left as-is in this phase. */
export async function getProductById(id: string): Promise<RepositoryProduct | null> {
  try {
    const row = await db.product.findFirst({
      where: { id, status: "ACTIVE" },
      include: PRODUCT_INCLUDE,
    });
    return row ? toProduct(row) : null;
  } catch (error) {
    throw wrapError(`getProductById("${id}") failed`, error);
  }
}

/** Mirrors getProductsByCategory in src/lib/products.ts. An unknown
 * categorySlug simply matches zero rows (never throws), the same
 * "coming soon" -safe behavior the static function already has. */
export async function getProductsByCategory(categorySlug: string): Promise<RepositoryProduct[]> {
  try {
    const rows = await db.product.findMany({
      where: { status: "ACTIVE", category: { slug: categorySlug } },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProduct);
  } catch (error) {
    throw wrapError(`getProductsByCategory("${categorySlug}") failed`, error);
  }
}

/** Phase 4.4.10 — fresh, DB-backed display data for a specific set of
 * product ids, one query for however many ids the caller has (never N
 * individual getProductById calls). Added specifically so Cart/Wishlist
 * display data (src/app/(storefront)/cart/actions.ts,
 * .../wishlist/actions.ts) never has to fall back to the legacy static
 * catalog (src/lib/products.ts) to resolve a batch of already-known ids.
 * Same ACTIVE-only rule as every other function here — an id that's since
 * gone DRAFT/ARCHIVED/deleted simply doesn't come back, exactly like
 * getProductById's "not found" case. */
export async function getProductsByIds(ids: string[]): Promise<RepositoryProduct[]> {
  if (ids.length === 0) return [];
  try {
    const rows = await db.product.findMany({
      where: { id: { in: ids }, status: "ACTIVE" },
      include: PRODUCT_INCLUDE,
    });
    return rows.map(toProduct);
  } catch (error) {
    throw wrapError("getProductsByIds failed", error);
  }
}

/** Mirrors searchProducts in src/lib/products.ts: a case-insensitive
 * substring match across the same four fields (name, brand, category,
 * description), translated directly to Postgres ILIKE via Prisma's
 * `contains`/`mode: "insensitive"` — no search engine, no new dependency.
 * An empty/whitespace-only query short-circuits to `[]` without touching
 * the database, matching the static function exactly. */
export async function searchProducts(query: string): Promise<RepositoryProduct[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const rows = await db.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { brand: { name: { contains: q, mode: "insensitive" } } },
          { category: { name: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: PRODUCT_INCLUDE,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProduct);
  } catch (error) {
    throw wrapError(`searchProducts("${query}") failed`, error);
  }
}

// No getAllCategories(), getFeaturedProducts(), or getProductsByBrand()
// function exists here: none of these correspond to a real export of
// src/lib/products.ts today. Categories are read directly from
// site-config.ts by every current consumer, not through any products.ts
// function, and nothing in the storefront currently calls a
// featured-products or brand-filter lookup (see the final report).