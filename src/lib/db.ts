import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Standard Next.js dev-mode singleton: without this, every hot-reload of a
// file that imports `db` would instantiate a brand new PrismaClient (and a
// new connection pool) on top of the last one, quickly exhausting the
// database's connection limit. Stashing the instance on `globalThis` makes
// it survive module reloads in development. In production there's only one
// module load per process, so this is a no-op there.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 requires an explicit driver adapter — a bare connection-string
// constructor is no longer supported. `@prisma/adapter-pg` is the official
// adapter for PostgreSQL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
