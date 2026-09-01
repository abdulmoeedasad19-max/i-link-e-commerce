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
  addWishlistItem,
  clearWishlistItems,
  removeWishlistItem,
  syncWishlistOnLogin,
} from "@/app/(storefront)/wishlist/actions";

type Listener = () => void;

const WISHLIST_STORAGE_KEY = "ilink-wishlist";

function readFromStorage(): string[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeToStorage(productIds: string[]) {
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(productIds));
  } catch {
    // Storage unavailable/full — wishlist still works in-memory for this session.
  }
}

/**
 * Same external-store pattern as the cart (see cart-context.tsx): only
 * product IDs are kept, never a copy of the product data, so there is
 * nothing here that can ever go stale — display data for those ids is
 * resolved fresh, on demand, from the database (see wishlist/page.tsx and
 * wishlist/actions.ts's getWishlistDisplayProducts, Phase 4.4.10).
 */
function createWishlistStore() {
  let productIds: string[] = [];
  let hydrated = false;
  const listeners = new Set<Listener>();

  function ensureHydrated() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    productIds = readFromStorage();
  }

  function set(next: string[]) {
    productIds = next;
    writeToStorage(productIds);
    listeners.forEach((listener) => listener());
  }

  return {
    subscribe(listener: Listener) {
      ensureHydrated();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): string[] {
      ensureHydrated();
      return productIds;
    },
    getServerSnapshot(): string[] {
      return [];
    },
    addToWishlist(product: { id: string }) {
      if (!productIds.includes(product.id)) {
        set([...productIds, product.id]);
      }
    },
    removeFromWishlist(productId: string) {
      set(productIds.filter((id) => id !== productId));
    },
    toggleWishlist(product: { id: string }) {
      set(
        productIds.includes(product.id)
          ? productIds.filter((id) => id !== product.id)
          : [...productIds, product.id],
      );
    },
    clearWishlist() {
      set([]);
    },
    /** Replaces the entire wishlist wholesale — used only by database sync. */
    replaceAll(next: string[]) {
      set(next);
    },
  };
}

const wishlistStore = createWishlistStore();

// --- Database synchronization (underneath the public WishlistContext API) ---
//
// Wishlist membership is a plain set, so unlike the cart, union-merging is
// naturally idempotent — re-running the login sync with the same guest
// product ids is always safe. See src/app/wishlist/actions.ts for the
// server-side half of this.

const SYNC_DEBOUNCE_MS = 500;

function useWishlistDatabaseSync(productIds: string[]) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;

  const prevUserIdRef = useRef<string | null>(null);
  const lastSyncedRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!userId) {
      // Guest, or just logged out — never talk to the database.
      prevUserIdRef.current = null;
      lastSyncedRef.current = new Set();
      return;
    }

    if (prevUserIdRef.current !== userId) {
      // First time this provider has seen this authenticated user during
      // this page load — union the local wishlist with the database
      // wishlist and adopt the result locally.
      prevUserIdRef.current = userId;

      syncWishlistOnLogin(productIds)
        .then((merged) => {
          lastSyncedRef.current = new Set(merged);
          wishlistStore.replaceAll(merged);
        })
        .catch(() => {
          // Merge failed — leave the local wishlist exactly as it was.
        });
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const lastSynced = lastSyncedRef.current;
      const nextSet = new Set(productIds);

      if (nextSet.size === 0 && lastSynced.size > 0) {
        clearWishlistItems()
          .then(() => lastSynced.clear())
          .catch(() => {});
        return;
      }

      for (const productId of nextSet) {
        if (!lastSynced.has(productId)) {
          addWishlistItem(productId)
            .then(() => lastSynced.add(productId))
            .catch(() => {});
        }
      }
      for (const productId of Array.from(lastSynced)) {
        if (!nextSet.has(productId)) {
          removeWishlistItem(productId)
            .then(() => lastSynced.delete(productId))
            .catch(() => {});
        }
      }
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [productIds, userId, status]);
}

type WishlistContextValue = {
  productIds: string[];
  addToWishlist: (product: { id: string }) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: { id: string }) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
};

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const productIds = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  useWishlistDatabaseSync(productIds);

  const value = useMemo<WishlistContextValue>(
    () => ({
      productIds,
      addToWishlist: wishlistStore.addToWishlist,
      removeFromWishlist: wishlistStore.removeFromWishlist,
      toggleWishlist: wishlistStore.toggleWishlist,
      isInWishlist: (productId: string) => productIds.includes(productId),
      clearWishlist: wishlistStore.clearWishlist,
      wishlistCount: productIds.length,
    }),
    [productIds],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return ctx;
}
