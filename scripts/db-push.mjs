// Runner de migração do Aurora PostgreSQL com autenticação IAM (OIDC).
// O CLI do Prisma precisa de uma DATABASE_URL; como o Aurora não tem senha
// estática, geramos um token IAM temporário e montamos a URL em tempo de execução.
import { spawnSync } from "node:child_process";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";
import { prismaSslUrl } from "../lib/pg-ssl.mjs";

const host = process.env.PGHOST;
const port = Number(process.env.PGPORT ?? 5432);
const user = process.env.PGUSER || "postgres";
const database = process.env.PGDATABASE || "postgres";

if (!host || !process.env.AWS_ROLE_ARN || !process.env.AWS_REGION) {
  console.error(
    "[db-push] Variáveis do Aurora ausentes (PGHOST/AWS_ROLE_ARN/AWS_REGION). Pulando db push."
  );
  process.exit(0);
}

const signer = new Signer({
  credentials: awsCredentialsProvider({
    roleArn: process.env.AWS_ROLE_ARN,
    clientConfig: { region: process.env.AWS_REGION },
  }),
  region: process.env.AWS_REGION,
  hostname: host,
  username: user,
  port,
});

const token = await signer.getAuthToken();
const databaseUrl = prismaSslUrl(
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(
    token
  )}@${host}:${port}/${encodeURIComponent(database)}?sslmode=verify-full`
);

const result = spawnSync(
  "npx",
  ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
  {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  }
);

process.exit(result.status ?? 0);
