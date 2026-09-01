import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBannerById } from "@/lib/admin/banners";
import BannerForm from "@/components/admin/banners/banner-form";

export const metadata: Metadata = {
  title: "Edit Banner",
};

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const banner = await getAdminBannerById(id);

  if (!banner) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/banners"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-royal"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Banners
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">Edit Banner</h1>
      <p className="mt-1 text-sm text-slate">{banner.title}</p>

      <div className="mt-6 max-w-3xl">
        <BannerForm mode="edit" banner={banner} />
      </div>
    </div>
  );
}
