"use client";

// Admin Product Management upgrade. A native <details>/<summary> handles
// the "collapsible" requirement with zero extra JS state; only the
// character counters and live search-snippet preview need client state.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Field, inputClass } from "@/components/ui/form-field";
import { siteConfig } from "@/lib/site-config";

const SEO_TITLE_MAX = 60;
const SEO_DESCRIPTION_MAX = 160;

export default function ProductSeoSection({
  defaultSeoTitle,
  defaultSeoDescription,
  slug,
  fallbackTitle,
  fallbackDescription,
  errors,
}: {
  defaultSeoTitle?: string | null;
  defaultSeoDescription?: string | null;
  /** Live-updated by the caller from the slug field's own value, so the
   * preview URL tracks whatever the admin is currently typing there. */
  slug: string;
  fallbackTitle: string;
  fallbackDescription: string;
  errors?: { seoTitle?: string; seoDescription?: string };
}) {
  const [seoTitle, setSeoTitle] = useState(defaultSeoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(defaultSeoDescription ?? "");

  const previewTitle = seoTitle.trim() || `${fallbackTitle} | ${siteConfig.name}`;
  const previewDescription = seoDescription.trim() || fallbackDescription;
  const displayUrl = `${siteConfig.url.replace(/^https?:\/\//, "")}/product/${slug || "product-slug"}`;

  return (
    <details className="group rounded-2xl border border-light-gray bg-white premium-shadow" open={Boolean(defaultSeoTitle || defaultSeoDescription)}>
      <summary className="flex cursor-pointer select-none list-none items-center justify-between p-5 sm:p-6">
        <span>
          <span className="text-base font-bold text-navy">Search Engine Optimization</span>
          <span className="ml-2 text-xs font-medium text-slate">(optional)</span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="space-y-4 border-t border-light-gray p-5 sm:p-6">
        <p className="text-sm text-slate">
          Customize how this product appears in search engine results. Leave blank to automatically use
          the product name and description.
        </p>

        <div className="rounded-xl border border-light-gray bg-soft-gray p-4">
          <p className="truncate text-[15px] text-[#1a0dab]">{previewTitle}</p>
          <p className="text-xs text-[#006621]">{displayUrl}</p>
          <p className="mt-1 line-clamp-2 text-sm text-slate">{previewDescription || "…"}</p>
        </div>

        <Field id="product-seo-title" label={`SEO Title  (${seoTitle.length}/${SEO_TITLE_MAX})`} error={errors?.seoTitle}>
          <input
            id="product-seo-title"
            name="seoTitle"
            type="text"
            maxLength={200}
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder={fallbackTitle}
            aria-invalid={Boolean(errors?.seoTitle)}
            className={inputClass(Boolean(errors?.seoTitle))}
          />
        </Field>

        <Field
          id="product-seo-description"
          label={`SEO Description  (${seoDescription.length}/${SEO_DESCRIPTION_MAX})`}
          error={errors?.seoDescription}
        >
          <textarea
            id="product-seo-description"
            name="seoDescription"
            rows={3}
            maxLength={500}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder={fallbackDescription}
            aria-invalid={Boolean(errors?.seoDescription)}
            className={inputClass(Boolean(errors?.seoDescription))}
          />
        </Field>
      </div>
    </details>
  );
}
