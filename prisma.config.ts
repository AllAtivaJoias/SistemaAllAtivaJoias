import path from "node:path";
import { defineConfig } from "prisma/config";

// Runtime: driver adapter em lib/prisma.ts (pool `pg`).
// CLI: POSTGRES_PRISMA_URL / POSTGRES_URL_NON_POOLING no schema.prisma.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
