# Backup e recuperação

O sistema não implementa dump automático. A recuperação depende do provedor PostgreSQL (Vercel Postgres, Neon, RDS, etc.).

## O que precisa ser copiado

| Ativo | Onde | Crítico |
|---|---|---|
| Banco PostgreSQL | provedor | sim — pedidos, BOM, preços, usuários, audit log |
| Imagens | Vercel Blob | sim para a vitrine; o banco só guarda URL/pathname |
| Variáveis de ambiente | Vercel project settings | sim (`AUTH_SECRET`, connection strings) |
| Código | Git | sim |

Senhas nunca devem estar em backup de arquivo de código. `passwordHash` está no banco.

## Frequência e retenção (recomendado)

Ajuste aos SLAs do provedor. Valores de partida para uma joalheria single-tenant:

| | Desenvolvimento | Produção |
|---|---|---|
| Backup | opcional | diário + PITR contínuo se o plano oferecer |
| Retenção | — | no mínimo 7 dias; 30 dias preferível |
| Teste de restore | — | a cada alteração grande de schema e no mínimo trimestral |

## RPO e RTO

| Métrica | Alvo inicial | Como cumprir |
|---|---|---|
| **RPO** (perda máxima de dados) | ≤ 24 h; ≤ minutos se PITR estiver ativo | backup diário ou point-in-time recovery do Neon/Vercel Postgres |
| **RTO** (tempo até voltar a operar) | ≤ 4 h | restore do snapshot + `prisma migrate status` + redesploy Vercel |

Estes números são política operacional, não um job no repositório. Sem PITR, o RPO real é “desde o último dump”.

## Restore (procedimento)

1. **Não** apague o banco de produção para “testar”. Use um branch/database de staging.
2. Restaure o snapshot/PITR no banco de staging.
3. Confirme `npx prisma migrate status` (histórico alinhado).
4. Suba a aplicação apontando as URLs de staging.
5. Valide login, um pedido histórico, reimpressão da requisição (snapshot BOM) e o dashboard.
6. Só então, se for incidente real, restaure produção pelo mesmo caminho do provedor.

Um backup **nunca restaurado** não deve ser considerado comprovadamente confiável. Execute o passo 1–5 pelo menos uma vez após o go-live.

## Rollback de release

1. Vercel → Promote/Redeploy do deployment anterior (código).
2. Banco: **não** rode migrations “para trás”. Se a release nova já aplicou SQL, o rollback de código precisa ser compatível com o schema novo, ou restaure o banco para o instante anterior à migration.

## Falha de `migrate deploy`

Ver `docs/DEPLOY.md`. Nunca use `db push --accept-data-loss`.
