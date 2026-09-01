// Phase 4.4.9 — admin-side contact message reads. Mirrors the read/write
// split established in src/lib/admin/quotations.ts: plain server-only
// functions, never client-invokable, protected by the admin layout chain
// (the mutation, in src/app/admin/contact/actions.ts, independently calls
// requireAdmin()).
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ContactMessageStatus } from "@/generated/prisma/enums";

export const ADMIN_CONTACT_MESSAGES_PAGE_SIZE = 20;

export type AdminContactMessageListItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: ContactMessageStatus;
  createdAt: Date;
};

function toListItem(m: {
  id: string;
  name: string;
  email: string;
  subject: string;
  status: ContactMessageStatus;
  createdAt: Date;
}): AdminContactMessageListItem {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    status: m.status,
    createdAt: m.createdAt,
  };
}

export type AdminContactMessageStatusFilter = "ALL" | ContactMessageStatus;

export type AdminContactMessageFilters = {
  search?: string;
  status?: AdminContactMessageStatusFilter;
  page?: number;
};

export type AdminContactMessagePage = {
  messages: AdminContactMessageListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminContactMessages(
  filters: AdminContactMessageFilters,
): Promise<AdminContactMessagePage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ContactMessageWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_CONTACT_MESSAGES_PAGE_SIZE,
      take: ADMIN_CONTACT_MESSAGES_PAGE_SIZE,
    }),
    db.contactMessage.count({ where }),
  ]);

  return {
    messages: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_CONTACT_MESSAGES_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_CONTACT_MESSAGES_PAGE_SIZE)),
  };
}

export type AdminContactMessageDetail = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  status: ContactMessageStatus;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
};

export async function getAdminContactMessageById(id: string): Promise<AdminContactMessageDetail | null> {
  const m = await db.contactMessage.findUnique({ where: { id } });
  if (!m) return null;

  return {
    id: m.id,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    status: m.status,
    name: m.name,
    email: m.email,
    phone: m.phone,
    subject: m.subject,
    message: m.message,
  };
}
