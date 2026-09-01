import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBrandOptions, getAdminCategoryOptions } from "@/lib/admin/products";
import ProductForm from "@/components/admin/products/product-form";

export const metadata: Metadata = {
  title: "Add Product",
};

export default async function NewProductPage() {
  await requireAdmin();

  const [categories, brands] = await Promise.all([getAdminCategoryOptions(), getAdminBrandOptions()]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Products
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Add Product</h1>

      {categories.length === 0 ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-error/30 bg-error/5 px-6 py-8 text-center text-sm font-medium text-error"
        >
          A product needs a category, but no categories exist in the database yet. Category management is
          outside this phase — a category must be added directly before a product can be created.
        </div>
      ) : (
        <div className="mt-6 max-w-3xl">
          <ProductForm mode="create" categories={categories} brands={brands} />
        </div>
      )}
    </div>
  );
}
