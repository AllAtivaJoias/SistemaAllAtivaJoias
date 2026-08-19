# Deploy: PostgreSQL, SSL/TLS e migrations

Este documento descreve como o `allativa-joias` conecta no PostgreSQL (Prisma + `pg`) em Development, Preview e Production na Vercel.

Não copie senhas, tokens ou connection strings reais para este arquivo.

## 1. Como o PostgreSQL é conectado

O schema Prisma usa duas variáveis:

| Variável | Uso |
|---|---|
| `POSTGRES_PRISMA_URL` | Runtime (pooler / serverless) |
| `POSTGRES_URL_NON_POOLING` | Migrations e sessões diretas (`directUrl`) |

O runtime **não** usa o engine nativo do Prisma para queries. `lib/prisma.ts` abre um `Pool` de `pg` (`lib/pg-pool.ts`) com o adapter `@prisma/adapter-pg`.

O script de migration (`scripts/migrate-deploy.mjs`) usa **somente**:

1. `POSTGRES_URL_NON_POOLING` (preferida — host direto)
2. `POSTGRES_PRISMA_URL` (fallback, se não for pooler)

Provedor oficial deste projeto: **Supabase PostgreSQL** (integração Vercel). Hosts: `*.supabase.co` / `*.pooler.supabase.com`.

## 2. SSL/TLS

A validação de certificado **permanece ativa**.

Comportamento (`lib/pg-ssl.mjs`):

1. Detecta se o host exige TLS (Supabase ou `sslmode=require|verify-ca|verify-full`).
2. Loopback (`localhost` / `127.0.0.1`) **sem** `sslmode` → sem SSL (CI / Postgres local).
3. Para o driver `pg`, **remove** `sslmode` da URL e passa um objeto `ssl` explícito. Isso evita o bug em que `pg-connection-string` v2 trata `require` como `verify-full` e **ignora** `ssl.ca`.
4. `ssl.rejectUnauthorized` é `true`.
5. `ssl.ca` = CAs padrão do Node (`tls.rootCertificates`) **mais** a CA pública do provedor.
6. Para o CLI Prisma (`migrate deploy`), a URL recebe `sslmode=verify-full` e `sslrootcert` apontando para o bundle combinado. `PGSSLROOTCERT` é definido no processo filho.

CAs versionadas (públicas, não são secrets):

- `certs/supabase-prod-ca-2021.crt` — [Supabase SSL Enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement)

CA extra (opcional, se o dashboard do projeto publicar um certificado diferente):

- `POSTGRES_SSL_CA` — conteúdo PEM
- `PGSSLROOTCERT` / `POSTGRES_SSL_CA_PATH` — caminho de arquivo

`sslmode` no Postgres (libpq):

| Modo | Cifra | Valida CA | Valida hostname |
|---|---|---|---|
| `require` | sim | não (libpq) | não |
| `verify-ca` | sim | sim | não |
| `verify-full` | sim | sim | sim (recomendado) |

No `pg` 8.x / `pg-connection-string` 2.14+, `require` e `verify-ca` são tratados como `verify-full` (daí o warning no build). A correção é: CA do provedor + `verify-full` explícito no Prisma, e objeto `ssl` no `pg` sem `sslmode` na URL.

## 3. Como as migrations são executadas

O build de produção na Vercel (`vercel.json` → `buildCommand`) roda:

```bash
npm run build:production
# node scripts/migrate-deploy.mjs && prisma generate && next build
```

O script:

1. Conecta com TLS validado.
2. Inspeciona o schema (tabelas de joalheria + `_prisma_migrations`).
3. Recupera `20260717190000_jewelry_refactor` falha se `Ingredient` não existir.
4. Banco vazio → aplica `prisma/migrations_archive/fresh_install_baseline.sql` e marca a cadeia como aplicada.
5. Caso contrário → `prisma migrate deploy`.

Migrations continuam **no build** deste projeto porque Preview/Production precisam do schema antes do `next build` e o bootstrap de banco vazio não é só `migrate deploy`. Separar migration para um job de release exigiria outro passo na Vercel; não foi alterado para não quebrar o fluxo atual.

`npm run build` (sem `:production`) só faz `prisma generate && next build` — adequado para desenvolvimento local sem tocar no banco.

## 4. Variáveis necessárias

| Variável | Production | Preview | Development | Notas |
|---|---|---|---|---|
| `POSTGRES_PRISMA_URL` | sim | sim | sim | Pooler (porta 6543 no Supabase transaction mode, ou a URL pooled do provedor). Preferir `sslmode=verify-full`. |
| `POSTGRES_URL_NON_POOLING` | sim | sim | sim | Host direto `db.<ref>.supabase.co:5432` (não `pooler`). |
| `AUTH_SECRET` | sim | sim | sim | Auth.js |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | bootstrap | bootstrap | bootstrap | Só se a tabela `User` estiver vazia |
| `BLOB_READ_WRITE_TOKEN` | se usar Blob | se usar Blob | se usar Blob | Upload de imagens |
| `POSTGRES_SSL_CA` | opcional | opcional | opcional | PEM extra do Supabase |
| `PGSSLROOTCERT` | opcional | opcional | opcional | O script já aponta para o bundle combinado |

Não use `DATABASE_URL`, `DIRECT_URL` nem integração Neon/Vercel Postgres — o código lê apenas `POSTGRES_*`.

## 5. Integrações Vercel (Storage)

Mantenha **apenas**:

| Integração | Função |
|---|---|
| **Supabase** (Database) | PostgreSQL — injeta `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` |
| **Blob** (Storage) | Imagens — injeta `BLOB_READ_WRITE_TOKEN` |

**Desconecte** integrações extras (Neon, Vercel Postgres, etc.). Duas integrações de banco conflitam nas variáveis de ambiente.

Se a tela Blob mostrar “já conectado”, **não reconecte** — confirme que `BLOB_READ_WRITE_TOKEN` existe em Settings → Environment Variables.

## 6. Configurar variáveis na Vercel

```text
Vercel → Project → Settings → Environment Variables
```

```text
POSTGRES_PRISMA_URL        = [connection string pooled do provedor]
POSTGRES_URL_NON_POOLING   = [connection string direta do provedor]
AUTH_SECRET                = [segredo Auth.js]
ADMIN_EMAIL                = [bootstrap]
ADMIN_PASSWORD             = [bootstrap]
BLOB_READ_WRITE_TOKEN      = [se aplicável]
```

Marque Production, Preview e Development conforme o ambiente de cada valor.

Recomendações na URL (sem colar senha aqui):

- `sslmode=verify-full`
- Migrations: host direto, não `aws-*.pooler.supabase.com`
- Runtime: pooler em transaction mode se o deploy for serverless
- Não duplique o mesmo parâmetro (`sslmode` duas vezes)
- Não use `sslmode=disable`

O certificado CA público já vai no repositório (`certs/`). Não é necessário colar o PEM na Vercel, salvo se o provedor rotacionar para uma CA ainda não versionada.

## 7. Build local

```bash
npx prisma validate
npx prisma generate
npm run build
```

Build que aplica migrations (precisa de rede até o Postgres configurado no `.env` local):

```bash
npm run build:production
```

Postgres só local (CI): URL sem `sslmode`, host `127.0.0.1` — TLS não é forçado.

## 8. Diagnosticar falhas de conexão

O script registra apenas:

```text
[database] Connecting...
[database] Host: <hostname>
[database] SSL enabled ...
[database] Running migrations...
```

Em erro:

```text
[database] Migration failed
[database] Error code: ...
```

Mensagens são sanitizadas (sem senha / URL completa).

| Sintoma | Causa típica | O que fazer |
|---|---|---|
| `SELF_SIGNED_CERT_IN_CHAIN` | CA do provedor ausente ou `sslmode` na URL sobrescrevendo `ssl.ca` | Confirmar `certs/` no deploy; definir `POSTGRES_SSL_CA` se a CA do dashboard mudou |
| `P3018` / `Ingredient` | Migration antiga em banco vazio | O script já recupera isso |
| Timeout IPv6 | Host `db.<ref>.supabase.co` em rede só IPv4 | Usar pooler **session** (5432) só se não houver add-on IPv4; migrate prefere direta |
| Prisma migrate no pooler | DDL no transaction pooler | `POSTGRES_URL_NON_POOLING` deve ser a URL direta |

## 9. Configurações que NÃO devem ser usadas

```text
NODE_TLS_REJECT_UNAUTHORIZED=0
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
ssl: { rejectUnauthorized: false }
sslmode=disable          (em hosts gerenciados)
uselibpqcompat=true      (só para enfraquecer require → não verificar CA)
```

## 10. Por que `rejectUnauthorized: false` não deve ser utilizado

`rejectUnauthorized: false` aceita **qualquer** certificado apresentado pelo servidor. Isso permite man-in-the-middle: um atacante na rota até o Postgres (ou um DNS/proxy comprometido) pode apresentar um certificado próprio, decifrar a sessão e ler ou alterar queries (incluindo senhas de usuários e dados de pedidos).

A alternativa correta é **confiar na CA do provedor** e manter a verificação de cadeia e hostname (`verify-full`).
