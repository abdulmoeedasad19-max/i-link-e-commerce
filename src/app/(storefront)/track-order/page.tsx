import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import PolicyPage, { PolicyH2, PolicyP } from "@/components/sections/policy-page";
import Button from "@/components/ui/button";

const canonicalPath = "/track-order";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Check the status of your order from your i.Link Systems & Solutions account.",
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "website",
    title: "Track Your Order",
    description: "Check the status of your order from your account.",
    url: canonicalPath,
  },
  twitter: {
    card: "summary",
    title: "Track Your Order",
    description: "Check the status of your order from your account.",
  },
};

export default function TrackOrderPage() {
  return (
    <PolicyPage eyebrow="Support" title="Track Your Order" description="See where your order stands, any time.">
      <PolicyP>
        Every order shows its current status — Pending, Confirmed, Shipped, Delivered or Cancelled —
        in your account. Sign in and open My Orders to see the latest status for any order you&rsquo;ve
        placed, along with its items, payment status and delivery address.
      </PolicyP>

      <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl border border-light-gray bg-soft-gray p-6">
        <div className="flex-1">
          <p className="text-sm font-bold text-navy">Check your order status</p>
          <p className="mt-1 text-sm text-slate">You&rsquo;ll be asked to sign in if you aren&rsquo;t already.</p>
        </div>
        <Button href="/account/orders" variant="primary" size="md">
          View My Orders
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <PolicyH2>A Dedicated Tracking Page Is Coming</PolicyH2>
      <PolicyP>
        A public, order-number-based tracking page is still being rolled out. Until then, My Orders
        is the fastest way to see your order&rsquo;s current status, and our support team can also give
        you a live update using your order number.
      </PolicyP>
    </PolicyPage>
  );
}
