"use client";

import { useActionState } from "react";
import Button from "@/components/ui/button";
import { Field, inputClass } from "@/components/ui/form-field";
import { createCategory, updateCategory, type CategoryActionState } from "@/app/admin/categories/actions";
import type { AdminCategoryDetail } from "@/lib/admin/categories";

const initialState: CategoryActionState = {};

const ICON_OPTIONS = [
  "Laptop",
  "Gamepad2",
  "MonitorSmartphone",
  "MonitorCheck",
  "Printer",
  "Network",
  "HardDrive",
  "MemoryStick",
  "Camera",
  "Mouse",
  "Keyboard",
  "Headphones",
  "Box",
  "Plug",
  "Cpu",
];

export default function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: AdminCategoryDetail;
}) {
  const action = mode === "edit" ? updateCategory : createCategory;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && category && <input type="hidden" name="id" value={category.id} />}

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
          <Field id="category-name" label="Name" required error={errors.name}>
            <input
              id="category-name"
              name="name"
              type="text"
              required
              defaultValue={category?.name}
              aria-invalid={Boolean(errors.name)}
              className={inputClass(Boolean(errors.name))}
            />
          </Field>

          <Field
            id="category-slug"
            label={mode === "create" ? "Slug (leave blank to auto-generate from name)" : "Slug"}
            required={mode === "edit"}
            error={errors.slug}
          >
            <input
              id="category-slug"
              name="slug"
              type="text"
              required={mode === "edit"}
              placeholder={mode === "create" ? "e.g. laptops" : undefined}
              defaultValue={category?.slug}
              aria-invalid={Boolean(errors.slug)}
              className={inputClass(Boolean(errors.slug))}
            />
            {mode === "edit" && (
              <p className="mt-1.5 text-xs text-slate">
                Changing this changes the category&apos;s storefront URL (<code>/shop/{category?.slug}</code>{" "}
                today). The old URL will stop working — nothing redirects it automatically.
              </p>
            )}
          </Field>

          <Field id="category-description" label="Description" error={errors.description}>
            <textarea
              id="category-description"
              name="description"
              rows={3}
              defaultValue={category?.description ?? undefined}
              aria-invalid={Boolean(errors.description)}
              className={inputClass(Boolean(errors.description))}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-light-gray bg-white p-5 premium-shadow sm:p-6">
        <h2 className="text-base font-bold text-navy">Display</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="category-tier" label="Tier" required error={errors.tier}>
            <select
              id="category-tier"
              name="tier"
              required
              defaultValue={category?.tier ?? "SECONDARY"}
              aria-invalid={Boolean(errors.tier)}
              className={inputClass(Boolean(errors.tier))}
            >
              <option value="FEATURED">Featured — large homepage tile</option>
              <option value="SECONDARY">Secondary — medium homepage tile</option>
              <option value="COMPACT">Compact — small homepage tile</option>
            </select>
          </Field>

          <Field id="category-icon" label="Icon" error={errors.icon}>
            <select
              id="category-icon"
              name="icon"
              defaultValue={category?.icon ?? ""}
              aria-invalid={Boolean(errors.icon)}
              className={inputClass(Boolean(errors.icon))}
            >
              <option value="">— No icon —</option>
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4">
          <Field id="category-image" label="Image Path" error={errors.image}>
            <input
              id="category-image"
              name="image"
              type="text"
              placeholder="/categories/laptops.jpg"
              defaultValue={category?.image ?? undefined}
              aria-invalid={Boolean(errors.image)}
              className={inputClass(Boolean(errors.image))}
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Category"}
        </Button>
        <Button href="/admin/categories" variant="ghost" size="md">
          Cancel
        </Button>
      </div>
    </form>
  );
}
