import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { createAuroraPool } from "./pg-pool";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

// Aurora PostgreSQL na Vercel usa autenticação IAM (OIDC): não existe senha
// estática nem POSTGRES_PRISMA_URL. O Prisma acessa o banco através do driver
// adapter (@prisma/adapter-pg), usando um pool `pg` com token IAM temporário.
function createPool(): Pool {
  const pool = createAuroraPool();
  attachDatabasePool(pool);
  return pool;
}

const pool = globalForPrisma.pgPool ?? createPool();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
