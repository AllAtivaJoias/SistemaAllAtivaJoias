import path from "node:path";
import { defineConfig } from "prisma/config";
import { combinedCaFilePath, needsSsl, prismaSslUrl } from "./lib/pg-ssl.mjs";

// Runtime: driver adapter em lib/prisma.ts (pool `pg` → Supabase).
// Banco oficial: Supabase PostgreSQL (integração Vercel). Não use Neon/Vercel Postgres.
const rawUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL ||
  "postgresql://127.0.0.1:5432/placeholder";

const cliUrl = needsSsl(rawUrl) ? prismaSslUrl(rawUrl) : rawUrl;

process.env.POSTGRES_PRISMA_URL ??= cliUrl;
process.env.POSTGRES_URL_NON_POOLING ??= cliUrl;
if (needsSsl(rawUrl)) {
  process.env.PGSSLROOTCERT ??= combinedCaFilePath();
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliUrl,
  },
});
