# Arquivo de migrations históricas e baseline

O diretório `prisma/migrations/` contém a cadeia versionada usada por `prisma migrate deploy`.

**FATO:** as pastas `20260717*` e `20260804*` assumem tabelas do domínio antigo (`Ingredient`, `RecipeItem`) ou colunas já criadas via `db push`. Elas **não** criam o schema do zero.

## Banco já existente (joalheria via `db push`)

1. Backup.
2. `npx prisma migrate status`
3. Marque como aplicadas as migrations cujo efeito **já está** no banco:

```
npx prisma migrate resolve --applied 20260717190000_jewelry_refactor
npx prisma migrate resolve --applied 20260717193000_jewelry_insumos
npx prisma migrate resolve --applied 20260717194500_material_requisition_attrs
npx prisma migrate resolve --applied 20260717201500_product_code
npx prisma migrate resolve --applied 20260717223000_performance_indexes
npx prisma migrate resolve --applied 20260722224500_soft_delete_and_order_snapshots
npx prisma migrate resolve --applied 20260722230000_cost_inheritance_alloy_wire
npx prisma migrate resolve --applied 20260804200000_ficha_tecnica_structured
npx prisma migrate resolve --applied 20260804210000_supply_patterns
```

4. `npx prisma migrate deploy` aplica as novas (`20260815*` — Decimal, custos adicionais, snapshot BOM, User, AuditLog, OrderStatus).

## Banco vazio (instalação nova)

Não rode a cadeia `20260717*` do zero. Use `fresh_install_baseline.sql` (schema atual completo) **uma vez**, depois:

```
npx prisma migrate resolve --applied 20260717190000_jewelry_refactor
… (todas as pastas em prisma/migrations)
```

Ou, só em banco **vazio** de desenvolvimento: `prisma db push` **sem** `--accept-data-loss`, depois `resolve --applied` em todas.

Nunca use `--accept-data-loss` em produção.
