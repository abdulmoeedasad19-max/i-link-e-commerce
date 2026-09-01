"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProductById, getProductsByIds } from "@/lib/products-repository";

const MAX_QUANTITY = 99;

export type CartItemPayload = { productId: string; quantity: number };

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(quantity)));
}

async function dedupeGuestItems(items: CartItemPayload[]): Promise<CartItemPayload[]> {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    if (typeof item.productId !== "string" || !Number.isFinite(item.quantity) || item.quantity <= 0) {
      continue;
    }
    const product = await getProductById(item.productId);
    if (product === null) continue;
    byProduct.set(item.productId, (byProduct.get(item.productId) ?? 0) + Math.trunc(item.quantity));
  }
  return Array.from(byProduct.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Sets a single cart line to an absolute quantity (upsert). Called from the
 * client's debounced background sync — fire-and-forget from the caller's
 * perspective, so failures here are swallowed rather than surfaced.
 */
export async function setCartItemQuantity(productId: string, quantity: number): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  // Never insert a product id that isn't in the real catalog.
  const product = await getProductById(productId);
  if (product === null) return;

  const safeQuantity = clampQuantity(quantity);

  try {
    await db.cartItem.upsert({
      where: { userId_productId: { userId: session.user.id, productId } },
      update: { quantity: safeQuantity },
      create: { userId: session.user.id, productId, quantity: safeQuantity },
    });
  } catch {
    // Never expose raw Prisma/SQL errors — the caller retries on the next
    // cart change since it never advances its "last synced" bookkeeping
    // for an item that failed here.
  }
}

export async function removeCartItem(productId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await db.cartItem.deleteMany({ where: { userId: session.user.id, productId } });
  } catch {
    // ignore — see setCartItemQuantity
  }
}

export async function clearCartItems(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  try {
    await db.cartItem.deleteMany({ where: { userId: session.user.id } });
  } catch {
    // ignore — see setCartItemQuantity
  }
}

/**
 * One-shot login reconciliation. `guestItems` should be the *excess* over
 * whatever was last known to already be synced for this user (the caller is
 * responsible for that subtraction, since only it has the persisted
 * last-synced bookkeeping) — this keeps the merge idempotent even if it
 * fires again (e.g. a page reload while already authenticated, or the same
 * user logging back in without having changed their cart).
 *
 * Returns the authoritative full cart for this user after merging, so the
 * caller can replace localStorage with it. Throws on failure so the caller
 * can distinguish "nothing changed" from "we don't know what happened" and
 * leave localStorage untouched in the latter case.
 */
export async function syncCartOnLogin(guestItems: CartItemPayload[]): Promise<CartItemPayload[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated.");
  }
  const userId = session.user.id;

  const validGuestItems = await dedupeGuestItems(guestItems);

  try {
    const existing = await db.cartItem.findMany({ where: { userId } });
    const merged = new Map(existing.map((item) => [item.productId, item.quantity]));

    if (validGuestItems.length > 0) {
      const upserts = validGuestItems.map((item) => {
        const mergedQuantity = clampQuantity((merged.get(item.productId) ?? 0) + item.quantity);
        merged.set(item.productId, mergedQuantity);
        return db.cartItem.upsert({
          where: { userId_productId: { userId, productId: item.productId } },
          update: { quantity: mergedQuantity },
          create: { userId, productId: item.productId, quantity: mergedQuantity },
        });
      });
      await db.$transaction(upserts);
    }

    return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  } catch {
    throw new Error("Unable to synchronize cart.");
  }
}

export type CartDisplayProduct = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  image: string;
};

/**
 * Phase 4.4.10 — the client cart (cart-context.tsx) stores a full product
 * snapshot alongside each line item in localStorage, purely for display
 * (name/price/image/brand); this is what keeps that snapshot from staying
 * frozen at whatever it was when the item was added. Deliberately no
 * requireAdmin()/auth() gate: this is public product display data, and
 * guest carts (never authenticated) need it exactly as much as a logged-in
 * customer's cart does. A product id that no longer resolves (deleted, or
 * moved off ACTIVE status) simply isn't present in the result — callers
 * treat that the same way checkout's own "no longer available" handling
 * already does, by dropping the item rather than crashing.
 */
export async function getCartDisplayProducts(productIds: string[]): Promise<CartDisplayProduct[]> {
  if (productIds.length === 0) return [];
  const products = await getProductsByIds(productIds);
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    price: p.price,
    image: p.image,
  }));
}
