import path from "node:path";
import { defineConfig } from "prisma/config";

// Runtime: driver adapter em lib/prisma.ts (pool `pg`).
// O arquivo de config do Prisma 6 não carrega `.env`; o CLI ainda lê env() do schema.
const cliUrl =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  "postgresql://127.0.0.1:5432/placeholder";

process.env.POSTGRES_PRISMA_URL ??= cliUrl;
process.env.POSTGRES_URL_NON_POOLING ??= cliUrl;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: cliUrl,
  },
});
