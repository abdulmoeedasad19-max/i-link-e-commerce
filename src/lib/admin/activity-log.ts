// Phase 4.4.7 — the single shared insert helper for the admin audit trail.
// Deliberately NOT a "use server" module — it's a plain function called
// from inside already-authorized Server Actions, exactly matching the
// established non-"use server" shared-module convention already used by
// order-transitions.ts / quotation-transitions.ts / payment-transitions.ts
// / review-transitions.ts. Never imported from the storefront.
//
// Callers must only invoke this AFTER the underlying business mutation has
// actually succeeded — never speculatively, never before a race-safety
// check has confirmed the mutation actually won. Most call sites pass a
// transaction client (`tx`) so the log write and the business mutation
// commit or roll back together; see each action file for the exact
// integration.
import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { ActivityAction } from "@/generated/prisma/enums";

export type LogActivityInput = {
  adminId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  /** Small, JSON-serializable, non-sensitive structured detail only — never
   * a raw database row, never credentials/tokens/secrets. */
  metadata?: Prisma.InputJsonValue;
};

type ActivityLogWriter = { activityLog: { create(args: { data: unknown }): Promise<unknown> } };

export async function logActivity(client: ActivityLogWriter, input: LogActivityInput): Promise<void> {
  await client.activityLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      description: input.description,
      metadata: input.metadata,
    },
  });
}

// Read side, mirroring the read/write split established in
// src/lib/admin/reviews.ts / quotations.ts: plain server-only functions for
// the /admin/activity-log list page. There is deliberately no delete/update
// read helper here — this log is append-only, by design (see the Phase
// 4.4.7 spec: no delete-log, no edit-log, no clear-all action, ever).
export const ADMIN_ACTIVITY_LOG_PAGE_SIZE = 20;

export type AdminActivityLogListItem = {
  id: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  description: string;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  adminName: string | null;
  adminEmail: string;
};

const ADMIN_ACTIVITY_LOG_INCLUDE = {
  admin: { select: { name: true, email: true } },
} satisfies Prisma.ActivityLogInclude;

type ActivityLogWithRelations = Prisma.ActivityLogGetPayload<{ include: typeof ADMIN_ACTIVITY_LOG_INCLUDE }>;

function toListItem(row: ActivityLogWithRelations): AdminActivityLogListItem {
  return {
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    description: row.description,
    metadata: row.metadata,
    createdAt: row.createdAt,
    adminName: row.admin.name,
    adminEmail: row.admin.email,
  };
}

export type AdminActivityLogActionFilter = "ALL" | ActivityAction;

export type AdminActivityLogFilters = {
  search?: string;
  action?: AdminActivityLogActionFilter;
  entityType?: string;
  page?: number;
};

export type AdminActivityLogPage = {
  logs: AdminActivityLogListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getAdminActivityLogs(filters: AdminActivityLogFilters): Promise<AdminActivityLogPage> {
  const page = Math.max(1, Math.trunc(filters.page ?? 1));

  const where: Prisma.ActivityLogWhereInput = {};
  if (filters.action && filters.action !== "ALL") where.action = filters.action;

  const entityType = filters.entityType?.trim();
  if (entityType && entityType !== "ALL") where.entityType = entityType;

  const search = filters.search?.trim();
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { admin: { name: { contains: search, mode: "insensitive" } } },
      { admin: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [rows, totalCount] = await Promise.all([
    db.activityLog.findMany({
      where,
      include: ADMIN_ACTIVITY_LOG_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_ACTIVITY_LOG_PAGE_SIZE,
      take: ADMIN_ACTIVITY_LOG_PAGE_SIZE,
    }),
    db.activityLog.count({ where }),
  ]);

  return {
    logs: rows.map(toListItem),
    totalCount,
    page,
    pageSize: ADMIN_ACTIVITY_LOG_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_ACTIVITY_LOG_PAGE_SIZE)),
  };
}

// Every distinct entityType ever logged, used to populate the entity-type
// filter dropdown without hardcoding the list (new entity types added in a
// future phase appear automatically).
export async function getAdminActivityLogEntityTypes(): Promise<string[]> {
  const rows = await db.activityLog.findMany({
    distinct: ["entityType"],
    select: { entityType: true },
    orderBy: { entityType: "asc" },
  });
  return rows.map((r) => r.entityType);
}
