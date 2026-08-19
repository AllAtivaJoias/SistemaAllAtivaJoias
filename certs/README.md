# Certificados CA públicos (PostgreSQL — Supabase)

Estes arquivos são **autoridades certificadoras públicas** do Supabase, não chaves privadas nem senhas.

| Arquivo | Origem |
|---|---|
| `supabase-prod-ca-2021.crt` | [Supabase SSL](https://supabase.com/docs/guides/platform/ssl-enforcement) (`prod-ca-2021`) |

O cliente PostgreSQL (`pg`) e o Prisma usam esta CA com `rejectUnauthorized: true` / `sslmode=verify-full`. Não desabilite a validação TLS.

Se o dashboard do Supabase publicar um certificado de projeto diferente, defina `POSTGRES_SSL_CA` (PEM) ou `PGSSLROOTCERT` (caminho do arquivo) na Vercel.
