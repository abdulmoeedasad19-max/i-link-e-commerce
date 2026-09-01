"use client";

// Customer Product Page redesign. Both panels' content is already fully
// resolved server-side by the parent page (Description is plain text;
// Reviews is <ProductReviews>, a Server Component that does its own
// auth/data fetching) and passed in as children — this component only
// owns which one is currently visible. Both stay mounted (toggled via
// the `hidden` attribute, not conditional rendering) so switching tabs
// never re-fetches anything and never discards in-progress state in the
// review form.
import { useState, type ReactNode } from "react";

export default function ProductDetailTabs({
  description,
  reviews,
  reviewCount,
}: {
  description: ReactNode;
  reviews: ReactNode;
  reviewCount: number;
}) {
  const [active, setActive] = useState<"description" | "reviews">("description");

  return (
    <div className="mt-16">
      <div role="tablist" aria-label="Product details" className="flex gap-8 border-b border-light-gray">
        <button
          type="button"
          role="tab"
          id="tab-description"
          aria-selected={active === "description"}
          aria-controls="panel-description"
          onClick={() => setActive("description")}
          className={`-mb-px border-b-2 px-1 pb-3.5 text-sm font-bold transition-colors ${
            active === "description" ? "border-royal text-navy" : "border-transparent text-slate hover:text-navy"
          }`}
        >
          Description
        </button>
        <button
          type="button"
          role="tab"
          id="tab-reviews"
          aria-selected={active === "reviews"}
          aria-controls="panel-reviews"
          onClick={() => setActive("reviews")}
          className={`-mb-px border-b-2 px-1 pb-3.5 text-sm font-bold transition-colors ${
            active === "reviews" ? "border-royal text-navy" : "border-transparent text-slate hover:text-navy"
          }`}
        >
          Reviews{reviewCount > 0 ? ` (${reviewCount})` : ""}
        </button>
      </div>

      <div id="panel-description" role="tabpanel" aria-labelledby="tab-description" hidden={active !== "description"} className="pt-8">
        {description}
      </div>
      <div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" hidden={active !== "reviews"} className="pt-8">
        {reviews}
      </div>
    </div>
  );
}
