"use client";

import { useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createBrand, updateBrand, type BrandActionState } from "@/app/admin/brands/actions";
import type { AdminBrandListItem } from "@/lib/admin/brands";

const initialState: BrandActionState = {};

export default function BrandForm({ mode, brand }: { mode: "create" | "edit"; brand?: AdminBrandListItem }) {
  const action = mode === "edit" ? updateBrand : createBrand;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && brand && <input type="hidden" name="id" value={brand.id} />}

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Brand Details</h2>
        <div className="mt-4 space-y-4">
          <Field id="brand-name" label="Name" required error={errors.name}>
            <input
              id="brand-name"
              name="name"
              type="text"
              required
              defaultValue={brand?.name}
              aria-invalid={Boolean(errors.name)}
              className={inputClass(Boolean(errors.name))}
            />
          </Field>

          <Field
            id="brand-slug"
            label={mode === "create" ? "Slug (leave blank to auto-generate from name)" : "Slug"}
            required={mode === "edit"}
            error={errors.slug}
          >
            <input
              id="brand-slug"
              name="slug"
              type="text"
              required={mode === "edit"}
              placeholder={mode === "create" ? "e.g. hp" : undefined}
              defaultValue={brand?.slug}
              aria-invalid={Boolean(errors.slug)}
              className={inputClass(Boolean(errors.slug))}
            />
            <p className="mt-1.5 text-xs text-slate">
              Not used in any storefront URL — only as part of the logo image path convention below.
            </p>
          </Field>

          <Field id="brand-logo" label="Logo Path" error={errors.logoUrl}>
            <input
              id="brand-logo"
              name="logoUrl"
              type="text"
              placeholder="/brands/hp.svg"
              defaultValue={brand?.logoUrl ?? undefined}
              aria-invalid={Boolean(errors.logoUrl)}
              className={inputClass(Boolean(errors.logoUrl))}
            />
          </Field>
          
          <Field id="brand-description" label="Description" error={errors.description}>
            <textarea
              id="brand-description"
              name="description"
              rows={3}
              defaultValue={brand?.description ?? undefined}
              aria-invalid={Boolean(errors.description)}
              className={inputClass(Boolean(errors.description))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">SEO Metadata</h2>
        <div className="mt-4 space-y-4">
          <Field id="brand-seoTitle" label="SEO Title" error={errors.seoTitle}>
            <input
              type="text"
              id="brand-seoTitle"
              name="seoTitle"
              defaultValue={brand?.seoTitle ?? undefined}
              placeholder="Dell Laptops & Computers in Pakistan | i.Link Systems"
              aria-invalid={Boolean(errors.seoTitle)}
              className={inputClass(Boolean(errors.seoTitle))}
              maxLength={60}
            />
            <p className="mt-1.5 text-xs text-slate">
              Maximum 60 characters. Leave blank to use the brand name.
            </p>
          </Field>

          <Field id="brand-seoDescription" label="SEO Description" error={errors.seoDescription}>
            <textarea
              id="brand-seoDescription"
              name="seoDescription"
              rows={2}
              defaultValue={brand?.seoDescription ?? undefined}
              placeholder="Shop Dell laptops and computers in Pakistan at i.Link Systems. Explore Dell business, professional and performance systems available online."
              aria-invalid={Boolean(errors.seoDescription)}
              className={inputClass(Boolean(errors.seoDescription))}
              maxLength={160}
            />
            <p className="mt-1.5 text-xs text-slate">
              Maximum 160 characters. Leave blank to use the standard description.
            </p>
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Brand"}
        </Button>
        <Button href="/admin/brands" variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
