"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import {
  clearCartItems,
  getCartDisplayProducts,
  removeCartItem,
  setCartItemQuantity,
  syncCartOnLogin,
  type CartDisplayProduct,
  type CartItemPayload,
} from "@/app/(storefront)/cart/actions";

export type CartItem = {
  product: CartDisplayProduct;
  quantity: number;
};

type Listener = () => void;

const CART_STORAGE_KEY = "ilink-cart";

function readFromStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(items: CartItem[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable/full — cart still works in-memory for this session.
  }
}

/**
 * A tiny external store (subscribe/getSnapshot) backing the cart, read via
 * useSyncExternalStore rather than setState-in-effect. getServerSnapshot
 * returns an empty cart for SSR and the first client render (so hydration
 * always matches); the real persisted cart is picked up by getSnapshot once
 * mounted in the browser.
 */
function createCartStore() {
  let items: CartItem[] = [];
  let hydrated = false;
  const listeners = new Set<Listener>();

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    items = readFromStorage();
  }

  function set(next: CartItem[]) {
    items = next;
    writeToStorage(items);
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: Listener) {
      ensureHydrated();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): CartItem[] {
      ensureHydrated();
      return items;
    },
    getServerSnapshot(): CartItem[] {
      return [];
    },
    addToCart(product: CartDisplayProduct, quantity = 1) {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        set(
          items.map((i) =>
            i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
          ),
        );
      } else {
        set([...items, { product, quantity: Math.max(1, quantity) }]);
      }
    },
    removeFromCart(productId: string) {
      set(items.filter((i) => i.product.id !== productId));
    },
    updateQuantity(productId: string, quantity: number) {
      if (quantity <= 0) {
        set(items.filter((i) => i.product.id !== productId));
        return;
      }
      set(items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
    },
    increaseQuantity(productId: string) {
      set(
        items.map((i) => (i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i)),
      );
    },
    decreaseQuantity(productId: string) {
      set(
        items.flatMap((i) => {
          if (i.product.id !== productId) return [i];
          const nextQuantity = i.quantity - 1;
          return nextQuantity <= 0 ? [] : [{ ...i, quantity: nextQuantity }];
        }),
      );
    },
    clearCart() {
      set([]);
    },
    /** Replaces the entire cart wholesale — used only by database sync. */
    replaceAll(next: CartItem[]) {
      set(next);
    },
  };
}

const cartStore = createCartStore();

// --- Database synchronization (underneath the public CartContext API) ---
//
// localStorage stays the immediate source of truth for the UI at all times.
// While authenticated, changes are pushed to Postgres in the background
// (debounced, fire-and-forget) and, once per browser session, the local
// cart is reconciled with the database cart. See src/app/cart/actions.ts
// for the server-side half of this.

const CART_SYNC_STATE_KEY = "ilink-cart-sync-state";

type CartSyncState = { userId: string; quantities: Record<string, number> };

function readSyncState(): CartSyncState | null {
  try {
    const raw = window.localStorage.getItem(CART_SYNC_STATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as CartSyncState).userId === "string" &&
      typeof (parsed as CartSyncState).quantities === "object"
    ) {
      return parsed as CartSyncState;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSyncState(state: CartSyncState) {
  try {
    window.localStorage.setItem(CART_SYNC_STATE_KEY, JSON.stringify(state));
  } catch {
    // Best-effort bookkeeping only — worst case is a redundant sync later.
  }
}

const SYNC_DEBOUNCE_MS = 500;

function useCartDatabaseSync(items: CartItem[]) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;

  const prevUserIdRef = useRef<string | null>(null);
  const lastSyncedRef = useRef<Map<string, number>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Session not resolved yet — do nothing until we actually know whether
    // this visitor is a guest or a signed-in customer.
    if (status === "loading") return;

    if (!userId) {
      // Guest, or just logged out. Either way: never talk to the database,
      // and reset our bookkeeping so a future login starts a clean merge.
      prevUserIdRef.current = null;
      lastSyncedRef.current = new Map();
      return;
    }

    if (prevUserIdRef.current !== userId) {
      // First time this provider has seen this authenticated user during
      // this page load (a real login, or a page refresh while already
      // signed in). Reconcile once: merge only the *excess* over whatever
      // was last known to be synced for this same user, so re-running this
      // (e.g. another refresh, or logging back in without changing the
      // cart) never double-adds already-synced quantities.
      prevUserIdRef.current = userId;

      const priorSync = readSyncState();
      const knownQuantities = priorSync?.userId === userId ? priorSync.quantities : {};

      const guestPayload: CartItemPayload[] = items
        .map((item) => {
          const known = knownQuantities[item.product.id] ?? 0;
          const excess = item.quantity - known;
          return excess > 0 ? { productId: item.product.id, quantity: excess } : null;
        })
        .filter((entry): entry is CartItemPayload => entry !== null);

      syncCartOnLogin(guestPayload)
        .then(async (merged) => {
          // Phase 4.4.10 — one batched, DB-backed lookup for every
          // merged line's display data, never the legacy static catalog.
          // A product id that no longer resolves (deleted, or moved off
          // ACTIVE) is simply absent from the result and silently dropped
          // here, exactly like checkout's own "no longer available"
          // handling elsewhere in this codebase.
          const products = await getCartDisplayProducts(merged.map((entry) => entry.productId));
          const productById = new Map(products.map((p) => [p.id, p]));

          const hydrated: CartItem[] = [];
          const syncedMap = new Map<string, number>();
          const quantities: Record<string, number> = {};
          for (const entry of merged) {
            const product = productById.get(entry.productId);
            if (!product) continue;
            hydrated.push({ product, quantity: entry.quantity });
            syncedMap.set(entry.productId, entry.quantity);
            quantities[entry.productId] = entry.quantity;
          }
          lastSyncedRef.current = syncedMap;
          writeSyncState({ userId, quantities });
          cartStore.replaceAll(hydrated);
        })
        .catch(() => {
          // Merge failed — leave the local cart exactly as it was. The
          // database is untouched, so nothing has been lost; the next
          // cart change (or the next page load) will retry.
        });
      return;
    }

    // Steady state: already reconciled for this user this page load.
    // Debounce a background push of whatever changed locally since the
    // last successful sync.
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const lastSynced = lastSyncedRef.current;
      const nextMap = new Map(items.map((item) => [item.product.id, item.quantity]));
      const persist = () => writeSyncState({ userId, quantities: Object.fromEntries(lastSynced) });

      if (nextMap.size === 0 && lastSynced.size > 0) {
        clearCartItems()
          .then(() => {
            lastSynced.clear();
            persist();
          })
          .catch(() => {
            // Sync failure never rolls back the (already empty) UI cart —
            // it just retries next time the cart changes.
          });
        return;
      }

      const tasks: Promise<void>[] = [];
      for (const [productId, quantity] of nextMap) {
        if (lastSynced.get(productId) !== quantity) {
          tasks.push(
            setCartItemQuantity(productId, quantity)
              .then(() => {
                lastSynced.set(productId, quantity);
              })
              .catch(() => {}),
          );
        }
      }
      for (const productId of Array.from(lastSynced.keys())) {
        if (!nextMap.has(productId)) {
          tasks.push(
            removeCartItem(productId)
              .then(() => {
                lastSynced.delete(productId);
              })
              .catch(() => {}),
          );
        }
      }
      if (tasks.length > 0) {
        void Promise.all(tasks).then(persist);
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [items, userId, status]);
}

// Phase 4.4.10 — a one-time-per-mount refresh of every line's display data
// against the database, for GUEST carts only. A logged-in cart is already
// covered by useCartDatabaseSync's own login-branch above, which re-fires
// on every fresh mount (its ref resets on remount) and is itself the more
// authoritative source since it also knows about server-side merge results
// this effect never sees. Running both unconditionally would race — both
// call cartStore.replaceAll() independently, and this effect resolving
// after the login merge would silently discard newly-merged-in items — so
// this deliberately backs off entirely once a session is present.
function useCartFreshness() {
  const { data: session, status } = useSession();
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    // Wait for the session to resolve one way or the other — never run for
    // an authenticated user, whose refresh is useCartDatabaseSync's job.
    if (status === "loading") return;
    if (session?.user?.id) return;
    hasRunRef.current = true;

    const current = cartStore.getSnapshot();
    if (current.length === 0) return;

    getCartDisplayProducts(current.map((item) => item.product.id))
      .then((products) => {
        const productById = new Map(products.map((p) => [p.id, p]));
        // Re-read the snapshot at resolution time (not the `current` closed
        // over above) — quantities may have changed while this request was
        // in flight, and this must never clobber that.
        const latest = cartStore.getSnapshot();
        const refreshed: CartItem[] = [];
        for (const item of latest) {
          const product = productById.get(item.product.id);
          // Absent means no longer available (deleted / off ACTIVE status)
          // — dropped silently, the same "no longer available" handling
          // already established for checkout elsewhere in this codebase.
          if (product) refreshed.push({ product, quantity: item.quantity });
        }
        cartStore.replaceAll(refreshed);
      })
      .catch(() => {
        // Fetch failed — leave the cart exactly as it was; nothing lost.
      });
    // Depends on status (not just []): the session hook typically starts in
    // "loading" on mount, and this must re-evaluate once it resolves,
    // exactly like useCartDatabaseSync's own effect does — the hasRunRef
    // guard is what keeps this to a single actual fetch regardless of how
    // many times the effect body re-runs while status is still settling.
  }, [status, session?.user?.id]);
}

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: CartDisplayProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  getCartItemQuantity: (productId: string) => number;
  cartItemCount: number;
  cartSubtotal: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  useCartDatabaseSync(items);
  useCartFreshness();

  const cartItemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const cartSubtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(() => {
    const getCartItemQuantity = (productId: string) =>
      items.find((i) => i.product.id === productId)?.quantity ?? 0;

    return {
      items,
      addToCart: cartStore.addToCart,
      removeFromCart: cartStore.removeFromCart,
      updateQuantity: cartStore.updateQuantity,
      increaseQuantity: cartStore.increaseQuantity,
      decreaseQuantity: cartStore.decreaseQuantity,
      clearCart: cartStore.clearCart,
      getCartItemQuantity,
      cartItemCount,
      cartSubtotal,
    };
  }, [items, cartItemCount, cartSubtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
