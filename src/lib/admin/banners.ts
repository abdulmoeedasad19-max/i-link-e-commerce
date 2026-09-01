// Phase 4.4.13 — admin-side banner reads. Mirrors the read/write split
// established in src/lib/admin/contact-messages.ts / newsletter-
// subscribers.ts: a plain server-only function, never client-invokable,
// protected by the admin layout chain (the mutations, in
// src/app/admin/banners/actions.ts, independently call requireAdmin()).
// Unlike the public read in src/lib/banners-repository.ts, this one
// deliberately includes inactive banners and every field an admin needs to
// manage them — it must never be imported by any storefront page.
import "server-only";
import { db } from "@/lib/db";

export type AdminBannerListItem = {
  id: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** All banners, ordered exactly as the homepage would display them
 * (sortOrder, then createdAt as a stable tiebreaker) — inactive rows
 * included, so an admin can see and re-activate them. There are never
 * enough banners in practice to need pagination (see the Phase 4.4.12
 * audit), so this deliberately returns the full list, matching the
 * "smallest safe implementation" scope decision for this phase. */
export async function getAdminBanners(): Promise<AdminBannerListItem[]> {
  return db.banner.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      image: true,
      imageAlt: true,
      category: true,
      title: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export type AdminBannerDetail = {
  id: string;
  image: string;
  imageAlt: string;
  category: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  sortOrder: number;
  isActive: boolean;
};

export async function getAdminBannerById(id: string): Promise<AdminBannerDetail | null> {
  return db.banner.findUnique({
    where: { id },
    select: {
      id: true,
      image: true,
      imageAlt: true,
      category: true,
      title: true,
      description: true,
      primaryCtaLabel: true,
      primaryCtaHref: true,
      secondaryCtaLabel: true,
      secondaryCtaHref: true,
      sortOrder: true,
      isActive: true,
    },
  });
}
