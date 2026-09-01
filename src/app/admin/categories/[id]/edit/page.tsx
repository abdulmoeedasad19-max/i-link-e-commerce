import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminCategoryById } from "@/lib/admin/categories";
import CategoryForm from "@/components/admin/categories/category-form";

export const metadata: Metadata = {
  title: "Edit Category",
};

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const category = await getAdminCategoryById(id);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Categories
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Edit Category</h1>
      <p className="mt-1 text-sm text-slate">
        {category.name} — {category.productCount} product{category.productCount === 1 ? "" : "s"}
      </p>

      <div className="mt-6 max-w-2xl">
        <CategoryForm mode="edit" category={category} />
      </div>
    </div>
  );
}
