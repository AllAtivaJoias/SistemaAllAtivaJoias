# Certificados CA públicos (PostgreSQL)

Estes arquivos são **autoridades certificadoras públicas** dos provedores, não chaves privadas nem senhas.

| Arquivo | Origem |
|---|---|
| `supabase-prod-ca-2021.crt` | [Supabase SSL](https://supabase.com/docs/guides/platform/ssl-enforcement) (`prod-ca-2021`) |
| `aws-rds-global-bundle.pem` | [AWS RDS truststore](https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem) |

O cliente PostgreSQL (`pg`) e o Prisma usam essas CAs com `rejectUnauthorized: true` / `sslmode=verify-full`. Não desabilite a validação TLS.

Se o provedor publicar um certificado de projeto diferente, defina `POSTGRES_SSL_CA` (PEM) ou `PGSSLROOTCERT` (caminho do arquivo) na Vercel.
