"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import ProductCard from "@/components/sections/product-card";
import { useWishlist } from "@/contexts/wishlist-context";
import { useCart } from "@/contexts/cart-context";
import { getWishlistDisplayProducts, type WishlistDisplayProduct } from "@/app/(storefront)/wishlist/actions";

export default function WishlistPage() {
  const { productIds, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Phase 4.4.10 — fresh, DB-backed display data, fetched whenever the set
  // of saved product ids changes (initial load, add/remove, login merge).
  // There is no synchronous fallback to the legacy static catalog anymore.
  // `fetchedProducts` only ever grows via the effect's async .then()
  // callback (never set synchronously in the effect body, per this
  // project's set-state-in-effect lint rule); the productIds.length === 0
  // case is instead handled by deriving `products` below during render,
  // rather than by clearing state from inside the effect.
  const [fetchedProducts, setFetchedProducts] = useState<WishlistDisplayProduct[]>([]);

  useEffect(() => {
    if (productIds.length === 0) return;
    let cancelled = false;
    getWishlistDisplayProducts(productIds)
      .then((fresh) => {
        if (!cancelled) setFetchedProducts(fresh);
      })
      .catch(() => {
        // Fetch failed — leave whatever was already displayed as-is.
      });
    return () => {
      cancelled = true;
    };
  }, [productIds]);

  const products = productIds.length === 0 ? [] : fetchedProducts;

  if (products.length === 0) {
    return (
      <div className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <Heart className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">
              Your wishlist is empty
            </h1>
            <p className="mt-3 leading-relaxed text-slate">
              Save products you&apos;re interested in and they&apos;ll show up here.
            </p>
            <div className="mt-8">
              <Button href="/shop" variant="primary" size="lg">
                Continue Shopping
              </Button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Saved Items"
          title="Your Wishlist"
          description={`${products.length} product${products.length === 1 ? "" : "s"} saved.`}
          align="left"
          className="mx-0 text-left"
        />

        <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col gap-3">
              <ProductCard product={product} />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </Button>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(product.id)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-light-gray text-navy transition-colors hover:border-royal/30 hover:text-royal"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
