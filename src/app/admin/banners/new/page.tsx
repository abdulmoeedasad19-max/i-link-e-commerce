import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import BannerForm from "@/components/admin/banners/banner-form";

export const metadata: Metadata = {
  title: "Add Banner",
};

export default async function NewBannerPage() {
  await requireAdmin();

  return (
    <div>
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Banners
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Add Banner</h1>

      <div className="mt-6 max-w-3xl">
        <BannerForm mode="create" />
      </div>
    </div>
  );
}
