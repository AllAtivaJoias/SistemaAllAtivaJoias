import { Pool } from "pg";
import { Signer } from "@aws-sdk/rds-signer";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

const PG_PORT = Number(process.env.PGPORT ?? 5432);
const PG_USER = process.env.PGUSER || "postgres";

// Cria um pool `pg` autenticado no Aurora PostgreSQL via IAM (OIDC).
// Não há senha estática: o RDS Signer gera um token temporário por conexão.
export function createAuroraPool(): Pool {
  const signer = new Signer({
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION },
    }),
    region: process.env.AWS_REGION!,
    hostname: process.env.PGHOST!,
    username: PG_USER,
    port: PG_PORT,
  });

  return new Pool({
    host: process.env.PGHOST,
    database: process.env.PGDATABASE || "postgres",
    port: PG_PORT,
    user: PG_USER,
    // O token pode ser cacheado por até 15 min; o pg o solicita a cada nova conexão.
    password: () => signer.getAuthToken(),
    ssl: { rejectUnauthorized: false },
    max: 20,
  });
}
