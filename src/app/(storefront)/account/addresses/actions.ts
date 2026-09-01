"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const addressSchema = z.object({
  label: z.string().trim().min(1, "Please enter a label for this address.").max(40, "Label is too long."),
  line1: z.string().trim().min(1, "Please enter address line 1.").max(120, "Address line 1 is too long."),
  line2: z
    .string()
    .trim()
    .max(120, "Address line 2 is too long.")
    .optional()
    .transform((v) => (v ? v : undefined)),
  city: z.string().trim().min(1, "Please enter a city.").max(60, "City is too long."),
  province: z.string().trim().min(1, "Please enter a province.").max(60, "Province is too long."),
  postalCode: z.string().trim().min(1, "Please enter a postal code.").max(20, "Postal code is too long."),
  // Deliberately broad and not country-specific, matching the profile
  // page's phone validation: digits, spaces, and common +/-/() separators.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, "Please enter a valid phone number."),
});

type AddressField = "label" | "line1" | "line2" | "city" | "province" | "postalCode" | "phone" | "form";

export type AddressState = {
  errors?: Partial<Record<AddressField, string>>;
  success?: boolean;
};

export type SimpleActionState = {
  error?: string;
  success?: boolean;
};

function parseAddressForm(formData: FormData) {
  return addressSchema.safeParse({
    label: formData.get("label"),
    line1: formData.get("line1"),
    line2: formData.get("line2"),
    city: formData.get("city"),
    province: formData.get("province"),
    postalCode: formData.get("postalCode"),
    phone: formData.get("phone"),
  });
}

function fieldErrorsFrom(
  parsed: ReturnType<typeof addressSchema.safeParse>,
): AddressState["errors"] {
  if (parsed.success) return undefined;
  const errors: AddressState["errors"] = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field as AddressField] = issue.message;
    }
  }
  return errors;
}

export async function createAddress(
  _prevState: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { form: "You must be logged in to add an address." } };
  }

  const parsed = parseAddressForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFrom(parsed) };
  }

  const requestedDefault = formData.get("isDefault") === "on";

  try {
    const existingCount = await db.address.count({ where: { userId: session.user.id } });
    // A user's very first address always becomes their default, so they're
    // never left with saved addresses but none marked default.
    const makeDefault = requestedDefault || existingCount === 0;

    if (makeDefault && existingCount > 0) {
      await db.$transaction([
        db.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        }),
        db.address.create({
          data: { ...parsed.data, userId: session.user.id, isDefault: true },
        }),
      ]);
    } else {
      await db.address.create({
        data: { ...parsed.data, userId: session.user.id, isDefault: makeDefault },
      });
    }
  } catch {
    // Never expose raw Prisma/SQL errors to the client.
    return { errors: { form: "Unable to add this address. Please try again." } };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function updateAddress(
  _prevState: AddressState,
  formData: FormData,
): Promise<AddressState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { errors: { form: "You must be logged in to update an address." } };
  }

  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) {
    return { errors: { form: "Unable to update this address. Please try again." } };
  }

  const parsed = parseAddressForm(formData);
  if (!parsed.success) {
    return { errors: fieldErrorsFrom(parsed) };
  }

  const requestedDefault = formData.get("isDefault") === "on";

  // Ownership check BEFORE any mutation — this is the authorization
  // boundary. A forged addressId belonging to another user (or a
  // nonexistent one) matches nothing here and the request is rejected
  // before touching the database further.
  const existing = await db.address.findFirst({
    where: { id: addressId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { errors: { form: "Unable to update this address. Please try again." } };
  }

  try {
    if (requestedDefault) {
      await db.$transaction([
        db.address.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        }),
        db.address.update({
          where: { id: addressId },
          data: { ...parsed.data, isDefault: true },
        }),
      ]);
    } else {
      // Leave isDefault untouched here — never force it to false. Default
      // status can only ever be *granted* by this action (via the branch
      // above) or by setDefaultAddress; it must never be silently revoked
      // as a side effect of an unrelated edit, or a user could end up with
      // no default address at all.
      await db.address.update({
        where: { id: addressId },
        data: parsed.data,
      });
    }
  } catch {
    return { errors: { form: "Unable to update this address. Please try again." } };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function deleteAddress(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to delete an address." };
  }

  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) {
    return { error: "Unable to delete this address. Please try again." };
  }

  // Ownership check before deleting — never reveals whether an address
  // with this id exists for a different user, just a generic failure.
  const existing = await db.address.findFirst({
    where: { id: addressId, userId: session.user.id },
    select: { id: true, isDefault: true },
  });
  if (!existing) {
    return { error: "Unable to delete this address. Please try again." };
  }

  try {
    await db.address.delete({ where: { id: addressId } });

    // If the default address was just removed, promote the most recently
    // added remaining address so the user isn't left with no default.
    if (existing.isDefault) {
      const next = await db.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (next) {
        await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  } catch {
    return { error: "Unable to delete this address. Please try again." };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}

export async function setDefaultAddress(
  _prevState: SimpleActionState,
  formData: FormData,
): Promise<SimpleActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be logged in to update your addresses." };
  }

  const addressId = formData.get("addressId");
  if (typeof addressId !== "string" || !addressId) {
    return { error: "Unable to update your default address. Please try again." };
  }

  // The selected address must first be verified as belonging to the
  // authenticated user before anything else happens.
  const existing = await db.address.findFirst({
    where: { id: addressId, userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    return { error: "Unable to update your default address. Please try again." };
  }

  try {
    await db.$transaction([
      db.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      db.address.update({ where: { id: addressId }, data: { isDefault: true } }),
    ]);
  } catch {
    return { error: "Unable to update your default address. Please try again." };
  }

  revalidatePath("/account/addresses");
  return { success: true };
}
