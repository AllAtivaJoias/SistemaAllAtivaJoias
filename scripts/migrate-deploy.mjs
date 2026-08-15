// Aplica o schema em produção sem `db push --accept-data-loss`.
// A cadeia 20260717* assume a tabela antiga "Ingredient"; banco vazio (Supabase
// novo) não tem essa relação — migrate deploy puro falha com P3018/42P01.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  combinedCaFilePath,
  needsSsl,
  pgClientConfig,
  prismaSslUrl,
  safeHostname,
  sanitizeDbError,
} from "../lib/pg-ssl.mjs";

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
      "[database] Defina POSTGRES_URL_NON_POOLING (direta) ou POSTGRES_PRISMA_URL / DATABASE_URL."
    );
    process.exit(1);
  }

  return url;
}

function prismaEnv(url) {
  const directUrl = prismaSslUrl(url);
  const pooled = process.env.POSTGRES_PRISMA_URL
    ? prismaSslUrl(process.env.POSTGRES_PRISMA_URL)
    : directUrl;
  return {
    ...process.env,
    POSTGRES_URL_NON_POOLING: directUrl,
    POSTGRES_PRISMA_URL: pooled,
    DATABASE_URL: directUrl,
    ...(needsSsl(url) ? { PGSSLROOTCERT: combinedCaFilePath() } : {}),
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
  const client = new pg.Client(pgClientConfig(url));
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
  ).replaceAll("\uFEFF", "");

  if (!sql.trim()) {
    throw new Error("Baseline SQL is empty after load.");
  }

  console.log("[database] Applying baseline schema");

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

  console.log("[database] Connecting...");
  console.log(`[database] Host: ${safeHostname(url)}`);
  if (needsSsl(url)) {
    console.log("[database] SSL enabled (verify-full, provider CA + Node trust store)");
  } else {
    console.log("[database] SSL not required for this host");
  }

  let state = await inspect(url);
  console.log("[database] Schema inspection completed");

  if (state.failed.includes(FAILED_JEWELRY) && !state.hasIngredient) {
    console.log(
      `[database] Recovering ${FAILED_JEWELRY} (Ingredient missing; P3018/42P01).`
    );
    runPrisma(["migrate", "resolve", "--rolled-back", FAILED_JEWELRY], env);
    state = await inspect(url);
  }

  if (isEmptyAppDb(state)) {
    console.log(
      "[database] Empty database: applying baseline and marking historical migrations as applied."
    );
    await applyBaseline(url);
    for (const name of migrationNames()) {
      runPrisma(["migrate", "resolve", "--applied", name], env);
    }
    console.log("[database] Migration completed successfully");
    return;
  }

  console.log("[database] Running migrations...");
  runPrisma(["migrate", "deploy"], env);
  console.log("[database] Migration completed successfully");
}

main().catch((error) => {
  const { code, message } = sanitizeDbError(error);
  console.error("[database] Migration failed");
  console.error(`[database] Error code: ${code}`);
  console.error(`[database] ${message}`);
  process.exit(1);
});
