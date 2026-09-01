import type { Metadata } from "next";
import { Image as ImageIcon, Plus } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getAdminBanners } from "@/lib/admin/banners";
import BannerRowActions from "@/components/admin/banners/banner-row-actions";

export const metadata: Metadata = {
  title: "Banners",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminBannersPage() {
  await requireAdmin();

  const banners = await getAdminBanners();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Banners</h1>
          <p className="mt-1 text-sm text-slate">
            {banners.length} banner{banners.length === 1 ? "" : "s"} for the homepage hero carousel.
          </p>
        </div>
        <Button href="/admin/banners/new" variant="primary" size="md">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Banner
        </Button>
      </div>

      <Card hover={false} className="mt-6 overflow-hidden p-0">
        {banners.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-royal/10 text-royal">
              <ImageIcon className="h-7 w-7" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-navy">No banners yet</h3>
            <p className="mt-2 text-sm text-slate">Add your first banner to populate the homepage hero carousel.</p>
            <div className="mt-6">
              <Button href="/admin/banners/new" variant="primary" size="md">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Banner
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-light-gray text-xs font-semibold uppercase tracking-wide text-slate">
                  <th scope="col" className="px-4 py-3">
                    Banner
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Sort Order
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Created
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-gray">
                {banners.map((banner, index) => (
                  <tr key={banner.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {banner.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={banner.image}
                            alt=""
                            className="h-10 w-16 shrink-0 rounded-lg border border-light-gray object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-light-gray text-slate">
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                        <p className="min-w-0 truncate font-semibold text-navy">{banner.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate">{banner.category}</td>
                    <td className="px-4 py-3">
                      <Badge variant={banner.isActive ? "success" : "navy"}>
                        {banner.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate">{banner.sortOrder}</td>
                    <td className="px-4 py-3 text-slate">{formatDate(banner.createdAt)}</td>
                    <td className="px-4 py-3">
                      <BannerRowActions
                        id={banner.id}
                        title={banner.title}
                        isActive={banner.isActive}
                        isFirst={index === 0}
                        isLast={index === banners.length - 1}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
