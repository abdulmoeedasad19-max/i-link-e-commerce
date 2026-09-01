"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProductById, getProductsByIds } from "@/lib/products-repository";

async function dedupeValidIds(productIds: string[]): Promise<string[]> {
  const checked = await Promise.all(
    productIds.map(async (id) => {
      if (typeof id !== "string") return null;
      const product = await getProductById(id);
      return product !== null ? id : null;
    }),
  );
  return Array.from(new Set(checked.filter((id): id is string => id !== null)));
}

export async function addWishlistItem(productId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  // Never insert a product id that isn't in the real catalog.
  const product = await getProductById(productId);
  if (product === null) return;

  try {
    await db.wishlistItem.upsert({
      where: { userId_productId: { userId: session.user.id, productId } },
      update: {},
      create: { userId: session.user.id, productId },
    });
  } catch {
    // Never expose raw Prisma/SQL errors — the caller retries on the next
    // wishlist change.
  }
}

export async function removeWishlistItem(productId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await db.wishlistItem.deleteMany({ where: { userId: session.user.id, productId } });
  } catch {
    // ignore — see addWishlistItem
  }
}

export async function clearWishlistItems(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await db.wishlistItem.deleteMany({ where: { userId: session.user.id } });
  } catch {
    // ignore — see addWishlistItem
  }
}

/**
 * One-shot login reconciliation. Wishlist membership is a plain union, so
 * unlike the cart this is naturally idempotent — re-running it with the same
 * guest product ids never creates duplicates or double-counts anything.
 * Returns the authoritative full wishlist for this user after the union, so
 * the caller can replace localStorage with it. Throws on failure so the
 * caller can leave localStorage untouched rather than assume an empty list.
 */
export async function syncWishlistOnLogin(guestProductIds: string[]): Promise<string[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }
  const userId = session.user.id;

  const validIds = await dedupeValidIds(guestProductIds);

  try {
    const existing = await db.wishlistItem.findMany({
      where: { userId },
      select: { productId: true },
    });
    const existingIds = new Set(existing.map((item) => item.productId));
    const toCreate = validIds.filter((id) => !existingIds.has(id));

    if (toCreate.length > 0) {
      await db.wishlistItem.createMany({
        data: toCreate.map((productId) => ({ userId, productId })),
        skipDuplicates: true,
      });
    }

    return Array.from(new Set([...existingIds, ...validIds]));
  } catch {
    throw new Error("Unable to synchronize wishlist.");
  }
}

// Structurally identical to the legacy static Product type (src/lib/
// products.ts) on purpose — src/app/(storefront)/wishlist/page.tsx renders
// this straight through ProductCard, which still expects that shape. This
// is a fresh, independently-declared type, not an import of it: the point
// of Phase 4.4.10 is that the wishlist page no longer depends on that file
// at all, even for a type.
export type WishlistDisplayProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  featured: boolean;
};

/**
 * Phase 4.4.10 — fresh, DB-backed display data for the wishlist page,
 * replacing its previous dependency on the legacy static catalog. No
 * auth() gate: this is public product display data, and a guest's
 * localStorage-only wishlist needs it exactly as much as a logged-in
 * customer's does. A product id that no longer resolves (deleted, or moved
 * off ACTIVE status) is simply absent from the result.
 */
export async function getWishlistDisplayProducts(productIds: string[]): Promise<WishlistDisplayProduct[]> {
  if (productIds.length === 0) return [];
  const products = await getProductsByIds(productIds);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    categorySlug: p.categorySlug,
    brand: p.brand,
    price: p.price,
    image: p.image,
    description: p.description,
    stock: p.stock,
    featured: p.featured,
  }));
}
