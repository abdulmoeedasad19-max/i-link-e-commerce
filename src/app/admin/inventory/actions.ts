"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { logActivity } from "@/lib/admin/activity-log";

const stockSchema = z.object({
  stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock must be zero or greater."),
});

// See src/app/admin/orders/actions.ts for the full rationale.
class RaceLostError extends Error {}

export type UpdateProductStockState = {
  error?: string;
  success?: boolean;
};

/**
 * The ONLY inventory mutation in this phase. Sets Product.stock directly
 * to an explicit, validated value — never an increment/decrement, since
 * nothing in the existing checkout/order flow ever decrements stock (see
 * the Phase 4.3.8 report), so there is no concurrent writer this action
 * needs to reconcile against beyond another admin. Touches stock only:
 * name, slug, price, status, category, brand, SKU, images, and
 * specifications are all handled exclusively by the existing product
 * edit form/action from Phase 4.3.2 — this action cannot change any of
 * them, by construction (the update payload contains only `stock`).
 */
export async function updateProductStock(
  _prevState: UpdateProductStockState,
  formData: FormData,
): Promise<UpdateProductStockState> {
  const session = await requireAdmin();

  const productId = String(formData.get("productId") ?? "");
  const expectedStock = Number(formData.get("expectedStock"));

  if (!productId || !Number.isInteger(expectedStock) || expectedStock < 0) {
    return { error: "Invalid request." };
  }

  const parsed = stockSchema.safeParse({ stock: formData.get("stock") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Stock must be a non-negative whole number." };
  }

  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true, slug: true, category: { select: { slug: true } } },
  });
  if (!product) {
    return { error: "Product not found." };
  }

  // Race-safe, mirroring the exact conditional-update pattern already
  // established for order status, quotation status, and customer role: the
  // WHERE clause re-checks the expected current stock at the moment of the
  // write. A single `data: { stock: newValue }` update is safe here
  // specifically because this always REPLACES the scalar value (never
  // `increment`/`decrement`), so there is no read-modify-write gap to
  // protect beyond "did someone else change it since I loaded the page."
  // The audit log write is inside the same transaction, so it can only be
  // created alongside a genuinely successful, race-winning stock update.
  try {
    await db.$transaction(async (tx) => {
      const result = await tx.product.updateMany({
        where: { id: productId, stock: expectedStock },
        data: { stock: parsed.data.stock },
      });
      if (result.count === 0) {
        throw new RaceLostError();
      }
      await logActivity(tx, {
        adminId: session.user.id,
        action: "UPDATE",
        entityType: "PRODUCT",
        entityId: productId,
        description: `Adjusted inventory for ${product.name}`,
        metadata: { previousStock: expectedStock, newStock: parsed.data.stock },
      });
    });
  } catch (err) {
    if (err instanceof RaceLostError) {
      return {
        error: "This product's stock has changed since you loaded this page. Please refresh and try again.",
      };
    }
    console.error("[admin/inventory] updateProductStock failed:", err);
    return { error: "Unable to update stock. Please try again." };
  }

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/admin");
  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/shop");
  revalidatePath(`/shop/${product.category.slug}`);
  return { success: true };
}
