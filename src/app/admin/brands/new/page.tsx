import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import BrandForm from "@/components/admin/brands/brand-form";

export const metadata: Metadata = {
  title: "Add Brand",
};

export default async function NewBrandPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/brands"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Brands
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Add Brand</h1>

      <div className="mt-6 max-w-2xl">
        <BrandForm mode="create" />
      </div>
    </div>
  );
}
