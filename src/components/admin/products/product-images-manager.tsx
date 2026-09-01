"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, ImageOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import {
  createProductImage,
  deleteProductImage,
  moveProductImage,
  setPrimaryProductImage,
  updateProductImage,
  type ImageActionState,
} from "@/app/admin/products/[id]/edit/image-actions";
import type { AdminProductImage } from "@/lib/admin/products";
import ProductImageUpload from "@/components/admin/products/product-image-upload";

const initialState: ImageActionState = {};

export default function ProductImagesManager({
  productId,
  images,
}: {
  productId: string;
  images: AdminProductImage[];
}) {
  return (
    <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
      <h2 className="text-base font-bold text-navy">Images</h2>
      <p className="mt-1 text-sm text-slate">
        The image marked <span className="font-semibold text-navy">Primary</span> is what customers see
        first. With no images at all, the product falls back to its category&apos;s placeholder image.
      </p>

      {images.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-light-gray px-4 py-6 text-center text-sm text-slate">
          No images yet — this product currently shows its category&apos;s placeholder image.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {images.map((image, index) => (
            <ImageRow
              key={image.id}
              productId={productId}
              image={image}
              isFirst={index === 0}
              isLast={index === images.length - 1}
            />
          ))}
        </ul>
      )}

      <div className="mt-5 border-t border-light-gray pt-5">
        <ProductImageUpload productId={productId} />
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer select-none text-xs font-semibold text-slate hover:text-royal">
          Add by URL instead
        </summary>
        <div className="mt-3">
          <AddImageForm productId={productId} />
        </div>
      </details>
    </div>
  );
}

function ImageRow({
  productId,
  image,
  isFirst,
  isLast,
}: {
  productId: string;
  image: AdminProductImage;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [rowError, setRowError] = useState<string | null>(null);
  const [editState, editAction, isSavingEdit] = useActionState(updateProductImage, initialState);
  // Adjusted during render (React's documented pattern for "respond to a
  // value changing"), not in a useEffect — avoids an extra render pass and
  // the set-state-in-effect lint rule this project enforces.
  const [prevEditState, setPrevEditState] = useState(editState);
  if (editState !== prevEditState) {
    setPrevEditState(editState);
    if (!editState.errors) setIsEditing(false);
  }

  const runAction = (action: () => Promise<{ error?: string }>) => {
    setRowError(null);
    startTransition(async () => {
      const result = await action();
      if (result?.error) setRowError(result.error);
    });
  };

  if (isEditing) {
    return (
      <li className="rounded-xl border border-royal/30 bg-royal/5 p-4">
        <form action={editAction} className="space-y-3">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="imageId" value={image.id} />
          {editState.errors?.form && (
            <p role="alert" className="text-xs font-medium text-error">
              {editState.errors.form}
            </p>
          )}
          <Field id={`image-url-${image.id}`} label="Image Path" required error={editState.errors?.url}>
            <input
              id={`image-url-${image.id}`}
              name="url"
              type="text"
              required
              defaultValue={image.url}
              aria-invalid={Boolean(editState.errors?.url)}
              className={inputClass(Boolean(editState.errors?.url))}
            />
          </Field>
          <Field id={`image-alt-${image.id}`} label="Alt Text" error={editState.errors?.altText}>
            <input
              id={`image-alt-${image.id}`}
              name="altText"
              type="text"
              defaultValue={image.altText ?? undefined}
              aria-invalid={Boolean(editState.errors?.altText)}
              className={inputClass(Boolean(editState.errors?.altText))}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={isSavingEdit}>
              {isSavingEdit ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-light-gray p-3">
      {image.url ? (
        // Admin-entered image paths are arbitrary local strings, not vetted
        // against next/image's remotePatterns — a plain <img> avoids a hard
        // crash on an unexpected path (same choice as the product list table).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt=""
          className="h-14 w-14 shrink-0 rounded-lg border border-light-gray object-cover"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-light-gray text-slate">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-navy">{image.url}</p>
        <p className="truncate text-xs text-slate">{image.altText || "No alt text"}</p>
      </div>
      {/* Primary state is also spelled out in text, not conveyed by color/icon alone. */}
      <span
        className={
          image.isPrimary
            ? "inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-semibold text-[#b5760f]"
            : "inline-flex items-center gap-1 rounded-full bg-soft-gray px-2.5 py-1 text-xs font-medium text-slate"
        }
      >
        <Star className={image.isPrimary ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} aria-hidden="true" />
        {image.isPrimary ? "Primary" : "Not primary"}
      </span>
      <div className="flex items-center gap-1">
        {!image.isPrimary && (
          <button
            type="button"
            onClick={() => runAction(() => setPrimaryProductImage(productId, image.id))}
            disabled={isPending}
            title="Make primary"
            aria-label="Make this the primary image"
            className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-50"
          >
            <Star className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => runAction(() => moveProductImage(productId, image.id, "up"))}
          disabled={isPending || isFirst}
          title="Move up"
          aria-label="Move image up in order"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-30"
        >
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => runAction(() => moveProductImage(productId, image.id, "down"))}
          disabled={isPending || isLast}
          title="Move down"
          aria-label="Move image down in order"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal disabled:opacity-30"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          title="Edit"
          aria-label="Edit image path and alt text"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-soft-gray hover:text-royal"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm("Delete this image?")) return;
            runAction(() => deleteProductImage(productId, image.id));
          }}
          disabled={isPending}
          title="Delete"
          aria-label="Delete image"
          className="rounded-lg p-2 text-slate transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {rowError && (
        <p role="alert" className="w-full text-xs font-medium text-error">
          {rowError}
        </p>
      )}
    </li>
  );
}

function AddImageForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(createProductImage, initialState);
  const [formKey, setFormKey] = useState(0);
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    // Remount the (uncontrolled) form on success so its fields clear —
    // there's no navigation here to do that for us.
    if (!state.errors) setFormKey((k) => k + 1);
  }

  return (
    <form key={formKey} action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      {state.errors?.form && (
        <p role="alert" className="text-xs font-medium text-error">
          {state.errors.form}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="new-image-url" label="Image Path" required error={state.errors?.url}>
          <input
            id="new-image-url"
            name="url"
            type="text"
            placeholder="/categories/laptops.jpg"
            required
            aria-invalid={Boolean(state.errors?.url)}
            className={inputClass(Boolean(state.errors?.url))}
          />
        </Field>
        <Field id="new-image-alt" label="Alt Text" error={state.errors?.altText}>
          <input
            id="new-image-alt"
            name="altText"
            type="text"
            aria-invalid={Boolean(state.errors?.altText)}
            className={inputClass(Boolean(state.errors?.altText))}
          />
        </Field>
      </div>
      <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        {isPending ? "Adding…" : "Add Image"}
      </Button>
    </form>
  );
}
