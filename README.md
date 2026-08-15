# AllAtiva Joias

ERP operacional de joalheria: vitrine pública, insumos, ficha técnica (BOM), precificação, PDV, pedidos, requisição de materiais e dashboard.

Stack: **Next.js 15** (App Router) · **React 19** · **TypeScript** · **Prisma** · **PostgreSQL** · **Auth.js** · **Vercel Blob**.

Single-tenant. Um administrador persistido na tabela `User` (senha com bcrypt).

---

## Requisitos

- Node.js 20+
- PostgreSQL 15+ (local ou Vercel/Neon Postgres)
- Conta Vercel Blob para upload de imagens (opcional em desenvolvimento)

---

## Setup local

1. Copie `.env.example` para `.env` e preencha as variáveis.
2. Instale dependências: `npm install`
3. Aplique migrations: `npm run db:migrate` (desenvolvimento)  
   Em um banco já existente use `npm run db:deploy`.
4. Suba o servidor: `npm run dev`
5. Acesse `/admin/login`.

O primeiro usuário administrador é criado automaticamente **somente se a tabela `User` estiver vazia**, a partir de `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 8 caracteres). Depois disso o login usa o hash no banco, não as variáveis de ambiente.

**Não execute `npm run db:seed` em produção.** O seed apaga dados de catálogo de demonstração.

---

## Scripts

| Script | Uso |
|---|---|
| `npm run dev` | Desenvolvimento |
| `npm run build` | `prisma generate` + `next build` — **não altera o schema** |
| `npm run build:production` | baseline/migrate + generate + build (Vercel) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `scripts/migrate-deploy.mjs` (baseline em banco vazio, senão migrate deploy) |
| `npm run db:validate` | `prisma validate` |
| `npm run db:status` | `prisma migrate status` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Playwright (requer build + banco) |

É **proibido** `prisma db push --accept-data-loss` em produção.

---

## Autenticação e sessão

- Credentials + `User.passwordHash` (bcrypt, cost 12).
- Sessão JWT com **24 horas** explícitas (`SESSION_MAX_AGE_SECONDS`).
- Rate limit de login: 5 falhas / 15 min por e-mail; 20 falhas / 15 min por IP. Persistido em `LoginAttempt`.
- Recuperação de senha **não está implementada** (lacuna). Reset manual no banco ou via novo bootstrap apenas com tabela `User` vazia.

Rotas `/admin/*` exigem sessão (middleware + layout). APIs administrativas usam `requireAdmin()`.

`/api/file` é **pública** de propósito: a vitrine precisa das fotos. Os blobs permanecem privados; o proxy valida o pathname.

`/api/health` é público e faz `SELECT 1` no banco.

---

## Deploy (Vercel)

1. Variáveis: `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (bootstrap), `BLOB_READ_WRITE_TOKEN`.
2. `vercel.json` usa `npm run build:production` → `scripts/migrate-deploy.mjs` + generate + `next build`.
   Banco vazio: o script aplica o baseline e marca as migrations históricas (não roda o RENAME de `Ingredient`).
3. Se o banco foi criado no passado só com `db push` (sem `_prisma_migrations`), marque as migrations já equivalentes como aplicadas:

   `npx prisma migrate resolve --applied 20260717190000_jewelry_refactor`  
   (repita para cada migration já refletida no schema, **sem** reexecutar SQL destrutivo.)

Detalhes: [docs/DEPLOY.md](docs/DEPLOY.md) · backup: [docs/BACKUP.md](docs/BACKUP.md).

---

## Testes

- Unitários: precificação, liga/fio, BOM snapshot, estados de pedido, rate limit, pathname de blob.
- E2E (Playwright): login público, redirect sem sessão, APIs admin 401, login inválido.

Antes do merge, o GitHub Actions executa validate, typecheck, lint, testes, migrate deploy em Postgres de CI e o build.

---

## Documentação adicional

- `DOCUMENTACAO_PROJETO.md` — análise histórica do código (pode estar desatualizada em deploy/auth; este README prevalece).
- `docs/DEPLOY.md` — migrations, rollback, ambiente.
- `docs/BACKUP.md` — RPO/RTO, restore.
