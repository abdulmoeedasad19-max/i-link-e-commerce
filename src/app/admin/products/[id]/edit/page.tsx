import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBrandOptions, getAdminCategoryOptions, getAdminProductById } from "@/lib/admin/products";
import ProductForm from "@/components/admin/products/product-form";
import ProductImagesManager from "@/components/admin/products/product-images-manager";

export const metadata: Metadata = {
  title: "Edit Product",
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getAdminProductById(id),
    getAdminCategoryOptions(),
    getAdminBrandOptions(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Products
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Edit Product</h1>
      <p className="mt-1 text-sm text-slate">{product.name}</p>

      <div className="mt-6 max-w-3xl space-y-6">
        <ProductForm mode="edit" product={product} categories={categories} brands={brands} />
        <ProductImagesManager productId={product.id} images={product.images} />
      </div>
    </div>
  );
}
