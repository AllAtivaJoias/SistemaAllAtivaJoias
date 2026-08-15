import path from "node:path";
import { defineConfig } from "prisma/config";

// Runtime: driver adapter em lib/prisma.ts (pool `pg`).
// CLI: preferir a conexão direta (migrations no Supabase/Neon não usam pooler).
const datasourceUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  "";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  ...(datasourceUrl ? { datasource: { url: datasourceUrl } } : {}),
});
