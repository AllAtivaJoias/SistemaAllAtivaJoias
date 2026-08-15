import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { createNeonPool } from "./pg-pool";

import { serializeDecimals } from "@/lib/decimal";

function extendClient(base: PrismaClient) {
  return base.$extends({
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
}

type AppPrisma = ReturnType<typeof extendClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaExtended: AppPrisma | undefined;
  pgPool: Pool | undefined;
};

function getPool(): Pool {
  if (!globalForPrisma.pgPool) {
    const pool = createNeonPool();
    attachDatabasePool(pool);
    globalForPrisma.pgPool = pool;
  }
  return globalForPrisma.pgPool;
}

function getBase(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      adapter: new PrismaPg(getPool()),
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

function getPrisma(): AppPrisma {
  if (!globalForPrisma.prismaExtended) {
    globalForPrisma.prismaExtended = extendClient(getBase());
  }
  return globalForPrisma.prismaExtended;
}

/**
 * Decimal do Prisma não é serializável para Client Components.
 * Leituras passam a number na borda da aplicação; o banco permanece DECIMAL.
 * TypeScript ainda descreve Decimal; converta com Number() na borda RSC → client.
 *
 * O client é lazy: `next build` importa o módulo sem exigir DATABASE_URL.
 */
export const prisma: AppPrisma = new Proxy({} as AppPrisma, {
  get(_target, prop, receiver) {
    return Reflect.get(getPrisma(), prop, receiver);
  },
});
