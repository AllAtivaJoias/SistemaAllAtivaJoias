import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { createNeonPool } from "./pg-pool";

import { serializeDecimals } from "@/lib/decimal";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// Runtime usa o driver adapter (@prisma/adapter-pg) + pool `pg`.
// Em serverless (Vercel) o pool é registrado para drenar conexões ociosas.
function createPool(): Pool {
  const pool = createNeonPool();
  attachDatabasePool(pool);
  return pool;
}

const pool = globalForPrisma.pgPool ?? createPool();

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = base;
  globalForPrisma.pgPool = pool;
}

/**
 * Decimal do Prisma não é serializável para Client Components.
 * Leituras passam a number na borda da aplicação; o banco permanece DECIMAL.
 * TypeScript ainda descreve Decimal; converta com Number() na borda RSC → client.
 */
export const prisma = base.$extends({
  query: {
    async $allOperations({
      args,
      query,
    }: {
      args: unknown;
      query: (args: unknown) => Promise<unknown>;
    }) {
      const result = await query(args);
      return serializeDecimals(result);
    },
  },
});
