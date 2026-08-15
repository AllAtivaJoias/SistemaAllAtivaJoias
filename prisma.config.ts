import path from "node:path";
import { defineConfig } from "prisma/config";

// O runtime conecta ao Aurora via driver adapter com IAM (ver lib/prisma.ts).
// O CLI do Prisma usa a DATABASE_URL definida em scripts/db-push.mjs.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
