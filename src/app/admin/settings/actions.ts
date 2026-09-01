"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logActivity } from "@/lib/admin/activity-log";
import { getStoreSettings, STORE_SETTINGS_ID } from "@/lib/admin/store-settings";

// Only the five fields authorized for this phase are ever read from the
// form or persisted — there is no generic/dynamic field pass-through, so a
// client can never smuggle an unknown column into this row.
const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required.").max(200, "Store name is too long."),
  phone: z.string().trim().min(1, "Phone is required.").max(50, "Phone is too long."),
  email: z.email("Please enter a valid email address.").max(200, "Email is too long."),
  hours: z.string().trim().min(1, "Business hours are required.").max(200, "Business hours text is too long."),
  // Empty-string is explicitly rejected rather than silently coerced to 0
  // (Number("") === 0 in JS, which would otherwise let a blank field pass
  // as "free shipping" instead of the validation error it should be).
  // .finite() rejects Infinity/-Infinity; the .max() bound below also
  // guards against Infinity in practice and gives a friendlier message.
  shippingCost: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? NaN : v),
    z.coerce
      .number()
      .finite("Shipping cost must be a valid number.")
      .min(0, "Shipping cost must be zero or greater.")
      .max(999999.99, "Shipping cost is too large."),
  ),
  // Manual Easypaisa payment settings (Phase 4.4.14) — all optional, all
  // trimmed, empty string normalized to null (never stored as ""). No
  // format/regex validation on the number: Easypaisa numbers aren't
  // globally standardized in this project and there's no established
  // convention to validate against, matching the spec's own guidance not
  // to invent one.
  easypaisaAccountName: z.string().trim().max(200, "Account name is too long.").optional(),
  easypaisaNumber: z.string().trim().max(50, "Number is too long.").optional(),
  easypaisaQrCode: z.string().trim().max(500, "QR code path is too long.").optional(),
  easypaisaInstructions: z.string().trim().max(1000, "Instructions are too long.").optional(),
});

type SettingsFormField =
  | "storeName"
  | "phone"
  | "email"
  | "hours"
  | "shippingCost"
  | "easypaisaAccountName"
  | "easypaisaNumber"
  | "easypaisaQrCode"
  | "easypaisaInstructions"
  | "form";

export type UpdateStoreSettingsState = {
  errors?: Partial<Record<SettingsFormField, string>>;
  success?: boolean;
};

function collectZodErrors(error: z.ZodError): NonNullable<UpdateStoreSettingsState["errors"]> {
  const errors: NonNullable<UpdateStoreSettingsState["errors"]> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as SettingsFormField] = issue.message;
    }
  }
  return errors;
}

export async function updateStoreSettings(
  _prevState: UpdateStoreSettingsState,
  formData: FormData,
): Promise<UpdateStoreSettingsState> {
  const session = await requireAdmin();

  const parsed = settingsSchema.safeParse({
    storeName: formData.get("storeName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    hours: formData.get("hours"),
    shippingCost: formData.get("shippingCost"),
    // Empty input -> undefined -> the optional() branch, matching the
    // established convention (see Category's own optional `description`
    // field in src/app/admin/categories/actions.ts) — never stored as "".
    easypaisaAccountName: formData.get("easypaisaAccountName") || undefined,
    easypaisaNumber: formData.get("easypaisaNumber") || undefined,
    easypaisaQrCode: formData.get("easypaisaQrCode") || undefined,
    easypaisaInstructions: formData.get("easypaisaInstructions") || undefined,
  });
  if (!parsed.success) {
    return { errors: collectZodErrors(parsed.error) };
  }
  const data = parsed.data;
  const shippingCostFixed = data.shippingCost.toFixed(2);
  const easypaisaAccountName = data.easypaisaAccountName ?? null;
  const easypaisaNumber = data.easypaisaNumber ?? null;
  const easypaisaQrCode = data.easypaisaQrCode ?? null;
  const easypaisaInstructions = data.easypaisaInstructions ?? null;

  // getStoreSettings() guarantees a row exists (creating it with schema
  // defaults on first-ever call) — the diff below always has a real,
  // current row to compare against, never a missing-row special case.
  const existing = await getStoreSettings();

  // Small, explicit field-by-field diff — never a blind serialization of
  // the whole row — matching the exact "changedFields" pattern already
  // established in Phase 4.4.7 (updateCategory/updateBrand/updateProduct/
  // updateCoupon).
  const changedFields: string[] = [];
  if (existing.storeName !== data.storeName) changedFields.push("storeName");
  if (existing.phone !== data.phone) changedFields.push("phone");
  if (existing.email !== data.email) changedFields.push("email");
  if (existing.hours !== data.hours) changedFields.push("hours");
  if (existing.shippingCost.toFixed(2) !== shippingCostFixed) changedFields.push("shippingCost");
  if ((existing.easypaisaAccountName ?? null) !== easypaisaAccountName) changedFields.push("easypaisaAccountName");
  if ((existing.easypaisaNumber ?? null) !== easypaisaNumber) changedFields.push("easypaisaNumber");
  if ((existing.easypaisaQrCode ?? null) !== easypaisaQrCode) changedFields.push("easypaisaQrCode");
  if ((existing.easypaisaInstructions ?? null) !== easypaisaInstructions) changedFields.push("easypaisaInstructions");

  // No-op submission: nothing actually changed, so there is nothing
  // meaningful to persist or log. Still reported as a successful save from
  // the form's point of view — resubmitting identical values isn't an
  // error condition.
  if (changedFields.length === 0) {
    return { success: true };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.storeSettings.upsert({
        where: { id: STORE_SETTINGS_ID },
        update: {
          storeName: data.storeName,
          phone: data.phone,
          email: data.email,
          hours: data.hours,
          shippingCost: shippingCostFixed,
          easypaisaAccountName,
          easypaisaNumber,
          easypaisaQrCode,
          easypaisaInstructions,
        },
        create: {
          id: STORE_SETTINGS_ID,
          storeName: data.storeName,
          phone: data.phone,
          email: data.email,
          hours: data.hours,
          shippingCost: shippingCostFixed,
          easypaisaAccountName,
          easypaisaNumber,
          easypaisaQrCode,
          easypaisaInstructions,
        },
      });
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "STORE_SETTINGS",
        entityId: STORE_SETTINGS_ID,
        description: "Updated store settings",
        metadata: { changedFields },
      });
    });
  } catch (err) {
    console.error("[admin/settings] updateStoreSettings failed:", err);
    return { errors: { form: "Unable to save settings. Please try again." } };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
