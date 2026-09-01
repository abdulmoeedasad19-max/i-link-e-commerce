"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, increaseQuantity, decreaseQuantity, removeFromCart, cartItemCount, cartSubtotal } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <ShoppingCart className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Your cart is empty</h1>
            <p className="mt-3 leading-relaxed text-slate">
              Looks like you haven&apos;t added anything yet. Browse our catalog to find genuine,
              warranty-backed products.
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
          eyebrow="Your Cart"
          title="Shopping Cart"
          description={`${cartItemCount} item${cartItemCount === 1 ? "" : "s"} in your cart.`}
          align="left"
          className="mx-0 text-left"
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="divide-y divide-light-gray rounded-2xl border border-light-gray bg-white premium-shadow lg:col-span-2">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex gap-4 p-4 sm:gap-5 sm:p-5">
                <Link
                  href={`/product/${product.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-soft-gray sm:h-28 sm:w-28"
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    quality={75}
                    sizes="112px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/product/${product.slug}`}
                      className="line-clamp-2 text-sm font-bold text-navy hover:text-royal sm:text-[15px]"
                    >
                      {product.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate">{product.brand}</p>
                    <p className="mt-1.5 text-sm font-semibold text-navy sm:hidden">
                      {formatPrice(product.price)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-light-gray">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(product.id)}
                        aria-label={`Decrease quantity of ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy transition-colors hover:bg-soft-gray"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <span
                        className="w-6 text-center text-sm font-semibold text-navy"
                        aria-live="polite"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(product.id)}
                        aria-label={`Increase quantity of ${product.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-navy transition-colors hover:bg-soft-gray"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      aria-label={`Remove ${product.name} from cart`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate transition-colors hover:text-royal"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <p className="text-sm font-semibold text-navy">{formatPrice(product.price)}</p>
                  <p className="mt-1 text-xs text-slate">
                    {quantity} ={" "}
                    <span className="font-semibold text-navy">
                      {formatPrice(product.price * quantity)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-2xl border border-light-gray bg-white p-6 premium-shadow">
            <h2 className="text-lg font-bold text-navy">Order Summary</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate">Items ({cartItemCount})</dt>
                <dd className="font-semibold text-navy">{formatPrice(cartSubtotal)}</dd>
              </div>
              <div className="flex items-center justify-between text-xs text-slate">
                <dt>Shipping &amp; taxes</dt>
                <dd>Calculated at checkout</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-light-gray pt-4">
              <span className="text-base font-bold text-navy">Subtotal</span>
              <span className="text-xl font-bold text-navy">{formatPrice(cartSubtotal)}</span>
            </div>

            <Button href="/checkout" variant="primary" size="lg" className="mt-6 w-full">
              Proceed to Checkout
            </Button>
            <Button href="/shop" variant="ghost" size="md" className="mt-3 w-full">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
