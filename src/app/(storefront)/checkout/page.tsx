import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import Container from "@/components/ui/container";
import SectionHeading from "@/components/ui/section-heading";
import Button from "@/components/ui/button";
import CheckoutForm from "@/components/sections/checkout-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getProductsByIds } from "@/lib/products-repository";
import { getStoreSettings } from "@/lib/admin/store-settings";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

export default async function CheckoutPage() {
  // Layer 2 of route protection — independent of proxy.ts (Layer 1). Never
  // rely on the proxy alone.
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }
  const userId = session.user.id;

  // The authoritative database cart and the customer's own saved
  // addresses — both scoped exclusively to the authenticated session's id.
  const [cartItems, addresses] = await Promise.all([
    db.cartItem.findMany({ where: { userId } }),
    db.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  if (cartItems.length === 0) {
    return (
      <div className="py-20 sm:py-24">
        <Container>
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <ShoppingCart className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-6 text-2xl font-bold text-navy sm:text-3xl">Your cart is empty</h1>
            <p className="mt-3 leading-relaxed text-slate">
              Add something to your cart before checking out.
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

  // Display-only: resolved against the current catalog purely so the
  // customer sees accurate names/prices before submitting. The actual
  // order totals are recomputed from scratch, server-side, inside the
  // placeOrder Server Action — this is never trusted as the source of truth.
  //
  // Phase 4.4.26 — one batched lookup instead of one query per cart line.
  // Order is preserved by iterating `cartItems` (not the batch query's
  // result order, which Prisma doesn't guarantee to match the `id IN (...)`
  // list); a product no longer found (deleted/archived — getProductsByIds
  // only returns ACTIVE products, same as getProductById) is filtered out
  // exactly as before.
  const products = await getProductsByIds(cartItems.map((item) => item.productId));
  const productById = new Map(products.map((p) => [p.id, p]));

  const lineItems = cartItems
    .map((item) => {
      const product = productById.get(item.productId);
      if (!product) return null;
      return { key: item.id, name: product.name, quantity: item.quantity, price: product.price };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // Same StoreSettings singleton read that getCheckoutCartSummary() (used
  // by applyCoupon/placeOrder) draws its shipping figure from — this is a
  // second read of that one authoritative value, not a second calculation
  // of it, exactly mirroring how this page already computes its own
  // preview `subtotal` independently of getCheckoutCartSummary's subtotal.
  const settings = await getStoreSettings();
  const shipping = settings.shippingCost.toNumber();
  const total = subtotal + shipping;

  const defaultAddressId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;

  return (
    <div className="py-16 sm:py-20">
      <Container>
        <SectionHeading eyebrow="Checkout" title="Checkout" align="left" className="mx-0 text-left" />

        <div className="mx-auto mt-10 max-w-2xl">
          {addresses.length === 0 ? (
            <div className="rounded-2xl border border-light-gray bg-soft-gray px-6 py-12 text-center">
              <p className="text-sm font-semibold text-navy">You don&apos;t have a saved address yet.</p>
              <p className="mt-2 text-sm text-slate">Add a shipping address to continue with checkout.</p>
              <div className="mt-6">
                <Button href="/account/addresses" variant="primary" size="md">
                  Add Address
                </Button>
              </div>
            </div>
          ) : (
            <CheckoutForm
              addresses={addresses.map((address) => ({
                id: address.id,
                label: address.label,
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
                phone: address.phone,
                isDefault: address.isDefault,
              }))}
              defaultAddressId={defaultAddressId}
              lineItems={lineItems}
              subtotal={subtotal}
              shipping={shipping}
              total={total}
            />
          )}
        </div>
      </Container>
    </div>
  );
}
