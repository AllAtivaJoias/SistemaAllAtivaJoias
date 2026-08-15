import { Pool } from "pg";

// Pool `pg` para o adapter do Prisma. Prefere a URL pooled do runtime
// (POSTGRES_PRISMA_URL / Neon) e cai para DATABASE_URL.
export function createNeonPool(): Pool {
  const connectionString =
    process.env.POSTGRES_PRISMA_URL ??
    process.env.NEON_DATABASE_URL ??
    process.env.NEON_POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Nenhuma connection string PostgreSQL encontrada (POSTGRES_PRISMA_URL ou DATABASE_URL)."
    );
  }

  const useSsl =
    /sslmode=require/i.test(connectionString) ||
    /neon\.tech/i.test(connectionString);

  return new Pool({
    connectionString,
    ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
    max: 20,
  });
}
