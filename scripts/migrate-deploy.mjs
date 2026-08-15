// Aplica o schema em produção sem `db push --accept-data-loss`.
// A cadeia 20260717* assume a tabela antiga "Ingredient"; banco vazio (Supabase
// novo) não tem essa relação — migrate deploy puro falha com P3018/42P01.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FAILED_JEWELRY = "20260717190000_jewelry_refactor";

function migrateUrl() {
  const preferred = [
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.DIRECT_URL,
  ].filter(Boolean);

  const fallback = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
  ].filter(Boolean);

  const isPooler = (url) =>
    /pooler\.supabase|[-.]pooler\.|pgbouncer=true/i.test(url);

  const nonPooler = [...preferred, ...fallback].find((url) => !isPooler(url));
  const url = nonPooler || preferred[0] || fallback[0];

  if (!url) {
    console.error(
      "[migrate-deploy] Defina POSTGRES_URL_NON_POOLING (direta) ou POSTGRES_PRISMA_URL / DATABASE_URL."
    );
    process.exit(1);
  }

  return url;
}

function sslFor(url) {
  const useSsl =
    /sslmode=require/i.test(url) ||
    /supabase\.(co|com)/i.test(url) ||
    /pooler\.supabase/i.test(url) ||
    /neon\.tech/i.test(url);
  return useSsl ? { rejectUnauthorized: true } : undefined;
}

function prismaEnv(url) {
  return {
    ...process.env,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || url,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL || url,
    DATABASE_URL: url,
  };
}

function runPrisma(args, env) {
  const result = spawnSync("npx", ["prisma", ...args], {
    stdio: "inherit",
    env,
    cwd: root,
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function migrationNames() {
  const dir = path.join(root, "prisma", "migrations");
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{14}_[a-z0-9_]+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function withClient(url, fn) {
  const client = new pg.Client({
    connectionString: url,
    ssl: sslFor(url),
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function tableExists(client, name) {
  const result = await client.query(
    `SELECT 1
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1`,
    [name]
  );
  return (result.rowCount ?? 0) > 0;
}

async function failedMigrationNames(client) {
  if (!(await tableExists(client, "_prisma_migrations"))) {
    return [];
  }
  const result = await client.query(
    `SELECT migration_name
       FROM _prisma_migrations
      WHERE finished_at IS NULL
        AND rolled_back_at IS NULL`
  );
  return result.rows.map((row) => row.migration_name);
}

async function inspect(url) {
  return withClient(url, async (client) => ({
    hasIngredient: await tableExists(client, "Ingredient"),
    hasMaterial: await tableExists(client, "Material"),
    hasProduct: await tableExists(client, "Product"),
    hasCategory: await tableExists(client, "Category"),
    failed: await failedMigrationNames(client),
  }));
}

function isEmptyAppDb(state) {
  return (
    !state.hasIngredient &&
    !state.hasMaterial &&
    !state.hasProduct &&
    !state.hasCategory
  );
}

async function applyBaseline(url) {
  const sql = readFileSync(
    path.join(root, "prisma", "migrations_archive", "fresh_install_baseline.sql"),
    "utf8"
  );

  await withClient(url, async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

async function main() {
  const url = migrateUrl();
  const env = prismaEnv(url);

  let state = await inspect(url);

  if (state.failed.includes(FAILED_JEWELRY) && !state.hasIngredient) {
    console.log(
      `[migrate-deploy] Recuperando ${FAILED_JEWELRY} (Ingredient inexistente; P3018/42P01).`
    );
    runPrisma(["migrate", "resolve", "--rolled-back", FAILED_JEWELRY], env);
    state = await inspect(url);
  }

  if (isEmptyAppDb(state)) {
    console.log(
      "[migrate-deploy] Banco vazio: aplicando baseline (schema atual) e marcando a cadeia histórica como aplicada."
    );
    await applyBaseline(url);
    for (const name of migrationNames()) {
      runPrisma(["migrate", "resolve", "--applied", name], env);
    }
    console.log("[migrate-deploy] Baseline concluído.");
    return;
  }

  runPrisma(["migrate", "deploy"], env);
}

main().catch((error) => {
  console.error("[migrate-deploy]", error);
  process.exit(1);
});
