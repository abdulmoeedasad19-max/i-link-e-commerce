"use client";

import { useActionState, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createProduct, updateProduct, type ProductActionState } from "@/app/admin/products/actions";
import type { AdminProductDetail } from "@/lib/admin/products";
import ProductTagsInput from "@/components/admin/products/product-tags-input";
import ProductSeoSection from "@/components/admin/products/product-seo-section";
import ProductImageStagingUpload from "@/components/admin/products/product-image-staging-upload";

const initialState: ProductActionState = {};

export default function ProductForm({
  mode,
  product,
  categories,
  brands,
}: {
  mode: "create" | "edit";
  product?: AdminProductDetail;
  categories: { id: string; name: string }[];
  brands: { id: string; name: string }[];
}) {
  const action = mode === "edit" ? updateProduct : createProduct;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  // Tracked live (not just uncontrolled defaultValue) purely so the SEO
  // preview below can update as the admin types — every other field in
  // this form stays uncontrolled, unchanged from before.
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [description, setDescription] = useState(product?.description ?? "");

  const stockInputRef = useRef<HTMLInputElement>(null);
  function setStockQuickly(value: number) {
    if (stockInputRef.current) stockInputRef.current.value = String(value);
  }

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && product && <input type="hidden" name="id" value={product.id} />}

      {errors.form && (
        <div
          role="alert"
          className="rounded-[10px] border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
        >
          {errors.form}
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Basic Information</h2>
        <div className="mt-4 space-y-4">
          <Field id="product-name" label="Name" required error={errors.name}>
            <input
              id="product-name"
              name="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              className={inputClass(Boolean(errors.name))}
            />
          </Field>

          <Field
            id="product-slug"
            label={mode === "create" ? "Slug (leave blank to auto-generate from name)" : "Slug"}
            required={mode === "edit"}
            error={errors.slug}
          >
            <input
              id="product-slug"
              name="slug"
              type="text"
              required={mode === "edit"}
              placeholder={mode === "create" ? "e.g. hp-elitebook-840-g9" : undefined}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              aria-invalid={Boolean(errors.slug)}
              className={inputClass(Boolean(errors.slug))}
            />
          </Field>

          <Field
            id="product-short-description"
            label="Short Description / Key Specifications"
            error={errors.shortDescription}
          >
            <textarea
              id="product-short-description"
              name="shortDescription"
              rows={6}
              defaultValue={product?.shortDescription ?? undefined}
              placeholder={
                "HP ProBook 640 G5\n\n• Intel Core i5-8265U Processor\n• 16GB DDR4 RAM\n• 512GB NVMe SSD\n• 14-inch Full HD Display"
              }
              aria-invalid={Boolean(errors.shortDescription)}
              className={inputClass(Boolean(errors.shortDescription))}
            />
          </Field>
          <p className="-mt-2.5 text-xs text-slate">
            Optional. Add a concise description or the key specifications customers should see
            quickly — written however you like, line breaks are preserved.
          </p>

          <Field id="product-description" label="Full Description" required error={errors.description}>
            <textarea
              id="product-description"
              name="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={Boolean(errors.description)}
              className={inputClass(Boolean(errors.description))}
            />
          </Field>

          <div>
            <span className="block text-sm font-semibold text-navy">Tags</span>
            <p className="mt-0.5 text-xs text-slate">
              Short keywords customers might search for, e.g. gaming laptop, RTX 4060, 16GB RAM.
            </p>
            <div className="mt-1.5">
              <ProductTagsInput defaultTags={product?.tags ?? []} />
            </div>
          </div>
        </div>
      </div>

      {mode === "create" && (
        <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
          <h2 className="text-base font-bold text-navy">Product Images</h2>
          <p className="mt-1 text-sm text-slate">
            Upload product images directly from your computer. The first image is used as the main
            product photo.
          </p>
          <div className="mt-4">
            <ProductImageStagingUpload />
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Classification</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="product-category" label="Category" required error={errors.categoryId}>
            <select
              id="product-category"
              name="categoryId"
              required
              defaultValue={product?.categoryId ?? ""}
              aria-invalid={Boolean(errors.categoryId)}
              className={inputClass(Boolean(errors.categoryId))}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field id="product-brand" label="Brand" error={errors.brandId}>
            <select
              id="product-brand"
              name="brandId"
              defaultValue={product?.brandId ?? ""}
              aria-invalid={Boolean(errors.brandId)}
              className={inputClass(Boolean(errors.brandId))}
            >
              <option value="">— No brand —</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Pricing</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            id="product-compare-price"
            label="Normal Price (PKR)"
            error={errors.compareAtPrice}
          >
            <input
              id="product-compare-price"
              name="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave blank if not discounted"
              defaultValue={product?.compareAtPrice ?? undefined}
              aria-invalid={Boolean(errors.compareAtPrice)}
              className={inputClass(Boolean(errors.compareAtPrice))}
            />
          </Field>

          <Field
            id="product-price"
            label="Selling / Discounted Price (PKR)"
            required
            error={errors.price}
          >
            <input
              id="product-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={product?.price}
              aria-invalid={Boolean(errors.price)}
              className={inputClass(Boolean(errors.price))}
            />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate">
          This is the price customers actually pay. Set a Normal Price too and it will be shown
          crossed out on the storefront as the discount.
        </p>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Inventory</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="product-sku" label="SKU" error={errors.sku}>
            <input
              id="product-sku"
              name="sku"
              type="text"
              defaultValue={product?.sku ?? undefined}
              aria-invalid={Boolean(errors.sku)}
              className={inputClass(Boolean(errors.sku))}
            />
          </Field>

          <Field id="product-stock" label="Stock Quantity" required error={errors.stock}>
            <input
              ref={stockInputRef}
              id="product-stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={product?.stock ?? 0}
              aria-invalid={Boolean(errors.stock)}
              className={inputClass(Boolean(errors.stock))}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStockQuickly(1)}
                className="rounded-full border border-success/30 bg-success/5 px-3 py-1 text-xs font-semibold text-success hover:bg-success/10"
              >
                Mark In Stock
              </button>
              <button
                type="button"
                onClick={() => setStockQuickly(0)}
                className="rounded-full border border-light-gray bg-soft-gray px-3 py-1 text-xs font-semibold text-slate hover:bg-light-gray"
              >
                Mark Out of Stock
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate">
              Out-of-stock products stay visible on the website — purchasing is disabled but the
              product page still works.
            </p>
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Storefront</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="product-status" label="Status" required error={errors.status}>
            <select
              id="product-status"
              name="status"
              required
              defaultValue={product?.status ?? "ACTIVE"}
              aria-invalid={Boolean(errors.status)}
              className={inputClass(Boolean(errors.status))}
            >
              <option value="DRAFT">Draft — hidden from storefront</option>
              <option value="ACTIVE">Active — visible on storefront</option>
              <option value="ARCHIVED">Archived — hidden from storefront</option>
            </select>
          </Field>

          <label className="flex items-center gap-2.5 self-end pb-2.5 text-sm font-semibold text-navy">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured ?? false}
              className="h-4 w-4 rounded border-light-gray text-royal focus:ring-royal/30"
            />
            Featured product
          </label>
        </div>
      </div>

      <ProductSeoSection
        defaultSeoTitle={product?.seoTitle}
        defaultSeoDescription={product?.seoDescription}
        slug={slug}
        fallbackTitle={name || "Product Name"}
        fallbackDescription={description || "Product description"}
        errors={{ seoTitle: errors.seoTitle, seoDescription: errors.seoDescription }}
      />

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Product"}
        </Button>
        <Button href="/admin/products" variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
