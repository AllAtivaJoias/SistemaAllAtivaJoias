import { PrismaClient } from "@prisma/client";

import { serializeDecimals } from "@/lib/decimal";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const base =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = base;
}

/**
 * Decimal do Prisma não é serializável para Client Components.
 * Leituras passam a number na borda da aplicação; o banco permanece DECIMAL.
 * TypeScript ainda descreve Decimal; converta com Number() na borda RSC → client.
 */
export const prisma = base.$extends({
  query: {
    async $allOperations({ args, query }) {
      const result = await query(args);
      return serializeDecimals(result);
    },
  },
});
