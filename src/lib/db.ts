import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as unknown as { prisma?: PrismaClient };

function databaseUrl(): string | undefined {
  const configured = process.env.DATABASE_URL;
  if (!configured) return undefined;
  const url = new URL(configured);
  if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "3");
  return url.toString();
}

const url = databaseUrl();

export const prisma = globalDatabase.prisma ?? new PrismaClient({
  ...(url ? { datasources: { db: { url } } } : {}),
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalDatabase.prisma = prisma;
