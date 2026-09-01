import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import CategoryForm from "@/components/admin/categories/category-form";

export const metadata: Metadata = {
  title: "Add Category",
};

export default async function NewCategoryPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Categories
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Add Category</h1>

      <div className="mt-6 max-w-2xl">
        <CategoryForm mode="create" />
      </div>
    </div>
  );
}
