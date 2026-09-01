"use client";

import { useActionState, useState, useTransition } from "react";
import Button from "@/components/ui/button";
import { inputClass } from "@/components/ui/form-field";
import {
  placeOrder,
  applyCoupon,
  type CheckoutState,
  type ApplyCouponState,
} from "@/app/(storefront)/checkout/actions";
import { formatPrice } from "@/lib/utils";

const initialState: CheckoutState = {};

export type CheckoutAddress = {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  isDefault: boolean;
};

export type CheckoutLineItem = {
  key: string;
  name: string;
  quantity: number;
  price: number;
};

export default function CheckoutForm({
  addresses,
  defaultAddressId,
  lineItems,
  subtotal,
  shipping,
  total,
}: {
  addresses: CheckoutAddress[];
  defaultAddressId: string | null;
  lineItems: CheckoutLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
}) {
  const [state, formAction, isPending] = useActionState(placeOrder, initialState);
  const errors = state.errors ?? {};

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ApplyCouponState | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCouponPending, startCouponTransition] = useTransition();

  // Preview values only when a coupon is applied — both server-computed
  // from the real cart at the moment "Apply" was clicked, never trusted
  // beyond that as the authoritative order total. placeOrder() always
  // recalculates everything from scratch server-side regardless of what's
  // shown here.
  const displaySubtotal = appliedCoupon?.subtotal ?? subtotal;
  const displayTotal = appliedCoupon?.total ?? total;

  const handleApplyCoupon = () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Coupon code is required.");
      return;
    }
    setCouponError(null);
    startCouponTransition(async () => {
      const result = await applyCoupon(code);
      if (result.error) {
        setAppliedCoupon(null);
        setCouponError(result.error);
      } else {
        setAppliedCoupon(result);
        setCouponError(null);
      }
    });
  };

  const handleRemoveCoupon = () => {
    // Local checkout state only — never touches the Coupon database record.
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  return (
    <form action={formAction} className="space-y-8">
      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-lg font-bold text-navy">Shipping Address</h2>
        {errors.addressId && (
          <p role="alert" className="mt-2 text-xs font-medium text-error">
            {errors.addressId}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {addresses.map((address) => (
            <label
              key={address.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-light-gray p-4 transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5"
            >
              <input
                type="radio"
                name="addressId"
                value={address.id}
                defaultChecked={address.id === defaultAddressId}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-royal"
              />
              <span className="text-sm">
                <span className="flex items-center gap-2 font-semibold text-navy">
                  {address.label}
                  {address.isDefault && (
                    <span className="rounded-full bg-royal/10 px-2 py-0.5 text-[10px] font-semibold text-royal">
                      Default
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-slate">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </span>
                <span className="block text-slate">
                  {address.city}, {address.province} {address.postalCode}
                </span>
                <span className="block text-slate">{address.phone}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <Button href="/account/addresses" variant="ghost" size="sm">
            + Add New Address
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-lg font-bold text-navy">Payment Method</h2>
        {errors.paymentMethod && (
          <p role="alert" className="mt-2 text-xs font-medium text-error">
            {errors.paymentMethod}
          </p>
        )}

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-light-gray p-4 transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5">
            <input
              type="radio"
              name="paymentMethod"
              value="COD"
              defaultChecked
              required
              className="mt-1 h-4 w-4 shrink-0 accent-royal"
            />
            <span className="text-sm">
              <span className="block font-semibold text-navy">Cash on Delivery</span>
              <span className="mt-1 block text-slate">Pay in cash when your order arrives.</span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-light-gray p-4 transition-colors has-[:checked]:border-royal has-[:checked]:bg-royal/5">
            <input
              type="radio"
              name="paymentMethod"
              value="EASYPAISA"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-royal"
            />
            <span className="text-sm">
              <span className="block font-semibold text-navy">Easypaisa</span>
              <span className="mt-1 block text-slate">
                Pay manually using Easypaisa and submit your Transaction ID for verification.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-lg font-bold text-navy">Order Summary</h2>

        <div className="mt-4 divide-y divide-light-gray">
          {lineItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-semibold text-navy">{item.name}</p>
                <p className="text-xs text-slate">Qty {item.quantity}</p>
              </div>
              <p className="font-semibold text-navy">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-light-gray pt-4">
          {appliedCoupon ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-royal/20 bg-royal/5 px-3.5 py-2.5 text-sm">
              <span className="font-semibold text-navy">
                Coupon <span className="font-mono">{appliedCoupon.code}</span> applied
              </span>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="font-semibold text-royal hover:text-royal-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor="checkout-coupon-code" className="mb-1.5 block text-xs font-semibold text-slate">
                  Coupon Code
                </label>
                <input
                  id="checkout-coupon-code"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  disabled={isCouponPending}
                  placeholder="Enter code"
                  className={`${inputClass(Boolean(couponError))} uppercase`}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isCouponPending}
                onClick={handleApplyCoupon}
              >
                {isCouponPending ? "Applying…" : "Apply"}
              </Button>
            </div>
          )}
          {couponError && (
            <p role="alert" className="mt-2 text-xs font-medium text-error">
              {couponError}
            </p>
          )}
        </div>

        {/* The applied coupon's code is the only thing submitted with the
            order — never the discount amount or total shown here. placeOrder()
            re-validates the code and recalculates the discount from scratch. */}
        <input type="hidden" name="couponCode" value={appliedCoupon?.code ?? ""} />

        <dl className="mt-4 space-y-2.5 border-t border-light-gray pt-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate">Subtotal</dt>
            <dd className="font-semibold text-navy">{formatPrice(displaySubtotal)}</dd>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between">
              <dt className="text-slate">Discount</dt>
              <dd className="font-semibold text-success">
                -{formatPrice(appliedCoupon.discountAmount ?? 0)}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-slate">Shipping</dt>
            <dd className={`font-semibold ${shipping > 0 ? "text-navy" : "text-success"}`}>
              {shipping > 0 ? formatPrice(shipping) : "Free"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex items-center justify-between border-t border-light-gray pt-4">
          <span className="text-base font-bold text-navy">Total</span>
          <span className="text-xl font-bold text-navy">{formatPrice(displayTotal)}</span>
        </div>
      </div>

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Placing Order…" : "Place Order"}
      </Button>
    </form>
  );
}
