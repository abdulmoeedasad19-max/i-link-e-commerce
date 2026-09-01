"use client";

import { useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createBanner, updateBanner, type BannerActionState } from "@/app/admin/banners/actions";
import type { AdminBannerDetail } from "@/lib/admin/banners";

const initialState: BannerActionState = {};

export default function BannerForm({
  mode,
  banner,
}: {
  mode: "create" | "edit";
  banner?: AdminBannerDetail;
}) {
  const action = mode === "edit" ? updateBanner : createBanner;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && banner && <input type="hidden" name="id" value={banner.id} />}

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Image</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="banner-image" label="Image" required error={errors.image}>
            <input
              id="banner-image"
              name="image"
              type="text"
              required
              placeholder="/images/banners/example.jpg"
              defaultValue={banner?.image}
              aria-invalid={Boolean(errors.image)}
              className={inputClass(Boolean(errors.image))}
            />
          </Field>

          <Field id="banner-image-alt" label="Image Alt Text" required error={errors.imageAlt}>
            <input
              id="banner-image-alt"
              name="imageAlt"
              type="text"
              required
              placeholder="Describe the image for screen readers"
              defaultValue={banner?.imageAlt}
              aria-invalid={Boolean(errors.imageAlt)}
              className={inputClass(Boolean(errors.imageAlt))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate">Enter a path or URL to an existing image — there is no upload here.</p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Content</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="banner-category" label="Category" required error={errors.category}>
            <input
              id="banner-category"
              name="category"
              type="text"
              required
              placeholder="e.g. New Arrivals"
              defaultValue={banner?.category}
              aria-invalid={Boolean(errors.category)}
              className={inputClass(Boolean(errors.category))}
            />
          </Field>

          <Field id="banner-title" label="Title" required error={errors.title}>
            <input
              id="banner-title"
              name="title"
              type="text"
              required
              defaultValue={banner?.title}
              aria-invalid={Boolean(errors.title)}
              className={inputClass(Boolean(errors.title))}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field id="banner-description" label="Description" required error={errors.description}>
            <textarea
              id="banner-description"
              name="description"
              rows={3}
              required
              defaultValue={banner?.description}
              aria-invalid={Boolean(errors.description)}
              className={inputClass(Boolean(errors.description))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Call to Action</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="banner-primary-cta-label" label="Primary Button Label" required error={errors.primaryCtaLabel}>
            <input
              id="banner-primary-cta-label"
              name="primaryCtaLabel"
              type="text"
              required
              placeholder="e.g. Shop Now"
              defaultValue={banner?.primaryCtaLabel}
              aria-invalid={Boolean(errors.primaryCtaLabel)}
              className={inputClass(Boolean(errors.primaryCtaLabel))}
            />
          </Field>

          <Field id="banner-primary-cta-href" label="Primary Button Link" required error={errors.primaryCtaHref}>
            <input
              id="banner-primary-cta-href"
              name="primaryCtaHref"
              type="text"
              required
              placeholder="/products"
              defaultValue={banner?.primaryCtaHref}
              aria-invalid={Boolean(errors.primaryCtaHref)}
              className={inputClass(Boolean(errors.primaryCtaHref))}
            />
          </Field>

          <Field
            id="banner-secondary-cta-label"
            label="Secondary Button Label"
            required
            error={errors.secondaryCtaLabel}
          >
            <input
              id="banner-secondary-cta-label"
              name="secondaryCtaLabel"
              type="text"
              required
              placeholder="e.g. Learn More"
              defaultValue={banner?.secondaryCtaLabel}
              aria-invalid={Boolean(errors.secondaryCtaLabel)}
              className={inputClass(Boolean(errors.secondaryCtaLabel))}
            />
          </Field>

          <Field id="banner-secondary-cta-href" label="Secondary Button Link" required error={errors.secondaryCtaHref}>
            <input
              id="banner-secondary-cta-href"
              name="secondaryCtaHref"
              type="text"
              required
              placeholder="/about"
              defaultValue={banner?.secondaryCtaHref}
              aria-invalid={Boolean(errors.secondaryCtaHref)}
              className={inputClass(Boolean(errors.secondaryCtaHref))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Display</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="banner-sort-order" label="Sort Order" required error={errors.sortOrder}>
            <input
              id="banner-sort-order"
              name="sortOrder"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={banner?.sortOrder ?? 0}
              aria-invalid={Boolean(errors.sortOrder)}
              className={inputClass(Boolean(errors.sortOrder))}
            />
          </Field>

          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={banner?.isActive ?? true}
              className="h-4 w-4 rounded border-light-gray text-royal focus:ring-royal/30"
            />
            Active
          </label>
        </div>
        <p className="mt-2 text-xs text-slate">Lower numbers appear first in the carousel.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Banner"}
        </Button>
        <Button href="/admin/banners" variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
