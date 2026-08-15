import { Pool, type PoolConfig } from "pg";
import { pgClientConfig } from "./pg-ssl.mjs";

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

  const tlsConfig = pgClientConfig(connectionString);
  const poolConfig: PoolConfig = {
    connectionString: tlsConfig.connectionString,
    max: 20,
  };
  if (tlsConfig.ssl) {
    poolConfig.ssl = tlsConfig.ssl;
  }
  return new Pool(poolConfig);
}
