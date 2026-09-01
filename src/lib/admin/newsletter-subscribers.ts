// Phase 4.4.11 — admin-side newsletter subscriber reads. Mirrors the
// read/write split established in src/lib/admin/quotations.ts /
// contact-messages.ts: a plain server-only function, never client-
// invokable. There is no corresponding write module — this phase has no
// admin mutation (view-only; see the final report for why).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const ADMIN_NEWSLETTER_SUBSCRIBERS_PAGE_SIZE = 20;

export type AdminNewsletterSubscriberListItem = {
  id: string;
  email: string;
  createdAt: Date;
};

export type AdminNewsletterSubscriberFilters = {
  search?: string;
  page?: number;
};

export type AdminNewsletterSubscriberPage = {
  subscribers: AdminNewsletterSubscriberListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminNewsletterSubscribers(
  filters: AdminNewsletterSubscriberFilters,
): Promise<AdminNewsletterSubscriberPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.NewsletterSubscriberWhereInput = {};
  const search = filters.search?.trim();
  if (search) {
    where.email = { contains: search, mode: "insensitive" };
  }

  const [subscribers, totalCount] = await Promise.all([
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_NEWSLETTER_SUBSCRIBERS_PAGE_SIZE,
      take: ADMIN_NEWSLETTER_SUBSCRIBERS_PAGE_SIZE,
    }),
    db.newsletterSubscriber.count({ where }),
  ]);

  return {
    subscribers,
    totalCount,
    page,
    pageSize: ADMIN_NEWSLETTER_SUBSCRIBERS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_NEWSLETTER_SUBSCRIBERS_PAGE_SIZE)),
  };
}
