import { Pool, type PoolConfig } from "pg";
import { pgClientConfig } from "./pg-ssl.mjs";

/**
 * Pool `pg` para o adapter do Prisma (runtime serverless).
 * Banco oficial do projeto: Supabase PostgreSQL via integração Vercel.
 * Usa somente POSTGRES_PRISMA_URL (URL pooled do Supabase).
 */
export function createPgPool(): Pool {
  const connectionString = process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "POSTGRES_PRISMA_URL não definida. Conecte o Supabase na Vercel (Storage → Database) ou configure no .env."
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
