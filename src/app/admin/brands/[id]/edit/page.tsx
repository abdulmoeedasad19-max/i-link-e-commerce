import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBrandById } from "@/lib/admin/brands";
import BrandForm from "@/components/admin/brands/brand-form";

export const metadata: Metadata = {
  title: "Edit Brand",
};

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const brand = await getAdminBrandById(id);

  if (!brand) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/brands"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Brands
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Edit Brand</h1>
      <p className="mt-1 text-sm text-slate">
        {brand.name} — {brand.productCount} product{brand.productCount === 1 ? "" : "s"}
      </p>

      <div className="mt-6 max-w-2xl">
        <BrandForm mode="edit" brand={brand} />
      </div>
    </div>
  );
}
