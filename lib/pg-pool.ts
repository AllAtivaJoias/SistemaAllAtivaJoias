import { Pool } from "pg";

// Pool `pg` conectado ao Neon PostgreSQL via connection string (SSL).
// A URL vem das variáveis do Neon: usamos a conexão *pooled* em runtime.
export function createNeonPool(): Pool {
  const connectionString =
    process.env.NEON_DATABASE_URL ??
    process.env.NEON_POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Nenhuma connection string do Neon encontrada (NEON_DATABASE_URL)."
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
  });
}
