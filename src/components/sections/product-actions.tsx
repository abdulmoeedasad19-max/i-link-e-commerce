"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Heart, ShoppingCart } from "lucide-react";
import Button from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";
import type { Product } from "@/lib/products";

export default function ProductActions({ product }: { product: Product }) {
  const { addToCart, getCartItemQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);

  const inStock = product.stock > 0;
  const cartQuantity = getCartItemQuantity(product.id);
  const saved = isInWishlist(product.id);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 1800);
    return () => clearTimeout(timer);
  }, [justAdded]);

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Button
        type="button"
        variant="primary"
        size="lg"
        disabled={!inStock}
        onClick={() => {
          addToCart(product);
          setJustAdded(true);
        }}
      >
        {justAdded ? (
          <>
            <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
            Added to Cart
          </>
        ) : (
          <>
            <ShoppingCart className="h-4.5 w-4.5" aria-hidden="true" />
            {cartQuantity > 0 ? `Add to Cart (${cartQuantity} in cart)` : "Add to Cart"}
          </>
        )}
      </Button>

      <Button type="button" variant="secondary" size="lg" onClick={() => toggleWishlist(product)}>
        <Heart
          className={saved ? "h-4.5 w-4.5 fill-royal text-royal" : "h-4.5 w-4.5"}
          aria-hidden="true"
        />
        {saved ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}
