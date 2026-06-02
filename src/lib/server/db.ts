import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client: PrismaClient | null = null;

/**
 * Returns a Prisma client only when DATABASE_URL is configured.
 * Persistence is best-effort: the app works fully without a database.
 */
export function getDb(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!client) {
    client = globalForPrisma.prisma ?? new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  }
  return client;
}
