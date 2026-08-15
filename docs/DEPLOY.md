# Deploy e migrations

## Ambientes

| Ambiente | Comando de schema | Build |
|---|---|---|
| Desenvolvimento | `npm run db:migrate` (`prisma migrate dev`) | `npm run dev` |
| Produção (Vercel) | `prisma migrate deploy` (via `build:production`) | `next build` |

O script `build` **não** aplica schema. Só gera o client Prisma e compila o Next.js.

## Variáveis obrigatórias

- `POSTGRES_PRISMA_URL` — conexão pooled (runtime)
- `POSTGRES_URL_NON_POOLING` — conexão direta (migrations)
- `AUTH_SECRET` — segredo JWT (gere com `npx auth secret`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — bootstrap do primeiro admin (mín. 8 caracteres; ignorados se já existir `User`)
- `BLOB_READ_WRITE_TOKEN` — upload de imagens

Nunca commite `.env`.

## Banco legado (criado com `db push`)

As migrations `20260717*` / `20260804*` **não** criam o schema do zero (renomeiam `Ingredient` → `Material`). Ver `prisma/migrations_archive/README.md`.

Se `_prisma_migrations` estiver vazia mas as tabelas de joalheria já existirem:

1. Backup.
2. Marque as migrations históricas já refletidas no banco com `prisma migrate resolve --applied <nome>`.
3. `npx prisma migrate deploy` aplica só o que falta (`20260815*`: Decimal, ficha, BOM snapshot, User, auditoria, status).

Banco **vazio**: use `prisma/migrations_archive/fresh_install_baseline.sql` uma vez, depois `resolve --applied` em todas as pastas. Não use `--accept-data-loss`.

Se uma migration nova falhar no meio:

1. Não apague o banco.
2. Leia o erro do `migrate deploy`.
3. Corrija o SQL ou marque como rolled back: `prisma migrate resolve --rolled-back <nome>`.
4. Não use `--accept-data-loss`.

## Rollback

Migrations Prisma não têm rollback automático.

- **Aplicação:** no Vercel, redesploy do deployment anterior.
- **Banco:** restore a partir do backup (PITR do provedor). Ver `docs/BACKUP.md`.
- **Migration destrutiva:** não há neste conjunto. Alterações são `ALTER TYPE`, `ADD COLUMN`/`TABLE` e `Float → Decimal` com `USING ROUND(...)`.

A conversão Float→Decimal arredonda valores existentes. Não é perda de linhas, mas centavos binários podem mudar na 3ª+ casa. Faça backup antes do primeiro `migrate deploy` em produção.

## Seed

`npm run db:seed` **apaga** catálogo de demonstração. Proibido em produção.
