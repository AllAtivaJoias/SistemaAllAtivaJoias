# DOCUMENTAÇÃO TÉCNICA COMPLETA — AllAtiva Joias

**Projeto:** `allativa-joias` (package.json)  
**Versão do package:** `0.1.0`  
**Data desta análise:** 14 de agosto de 2026  
**Escopo:** código-fonte real do repositório. Comportamentos inventados foram evitados. Onde a evidência no código é incompleta, está marcado com ⚠️.

**Legenda de certeza**

- **Confirmado:** extraído diretamente do código.
- **Inferido:** consequência lógica do código, sem teste de execução nesta análise.
- **Desconhecido:** não há evidência suficiente no repositório.

---

## 1. VISÃO GERAL DO SISTEMA

### Objetivo

Sistema da joalheria **AllAtiva Joias** com duas faces:

1. **Vitrine pública** (`/`): catálogo digital de peças por categoria, com foto, título, descrição e preço. Não é um e-commerce com checkout do cliente.
2. **Painel administrativo** (`/admin`): ERP interno para cadastro de categorias/produtos, biblioteca de insumos da ourivesaria, ficha técnica (custo e precificação), PDV (ponto de venda), fila de pedidos com impressão térmica e histórico financeiro.

### Problema que resolve

Centraliza:

- exposição do catálogo ao público;
- precificação de joias a partir da composição (metais, gemas, fios, correntes, kits/ordens);
- registro de vendas no balcão (cliente, vendedor, sinal);
- geração de comprovante + **requisição de materiais** para o joalheiro comprar insumos no fornecedor;
- indicadores de faturamento/lucro das vendas concluídas.

### Usuários

| Papel | Quem é | Como acessa |
|---|---|---|
| Visitante | Cliente/público | `/` — sem login |
| Administrador | Único usuário do painel | `/admin/login` — credenciais `ADMIN_EMAIL` / `ADMIN_PASSWORD` |

**Confirmado:** não existe tabela `User`, nem papéis (admin/vendedor/ourives) no banco. O “Administrador” é um usuário sintético criado no `authorize` do NextAuth (`id: "admin"`). Qualquer pessoa autenticada com essas credenciais tem acesso a **todo** o painel.

⚠️ Não foi possível determinar, a partir do código, se na operação real há vários atendentes compartilhando a mesma conta. O campo `sellerName` no pedido é texto livre, não um usuário autenticado.

### Principais funcionalidades

- Catálogo público por categoria (apenas produtos `isAvailable = true` e `isDeleted = false`).
- Login do painel (Credentials + JWT).
- Dashboard de vendas concluídas (KPIs, gráficos, tabela de desempenho).
- CRUD de categorias e produtos (soft delete de produtos).
- Biblioteca de insumos: pedras, correntes, fios/chapas, ligas, ordens/kits.
- Ficha técnica: composição + custos adicionais + estratégias de preço; grava custo/preço no produto.
- PDV: carrinho, cliente, sinal, envio do pedido como `PENDING`.
- Board de pedidos pendentes com polling e impressão automática (PC do caixa).
- Histórico de pedidos `COMPLETED` com reimpressão.
- Upload de imagens (Vercel Blob, store privada) e proxy público `/api/file`.

### Como o sistema funciona (visão geral)

É um **monólito Next.js 15 (App Router)** com:

- **Frontend:** React 19 + Server Components + Client Components.
- **Backend:** Server Actions (`"use server"`) e Route Handlers em `app/api`.
- **Banco:** PostgreSQL via Prisma.
- **Auth:** Auth.js / NextAuth v5 (Credentials + JWT), sem Prisma.

Não há microserviços, filas, WebSockets, e-mail transacional nem geração de PDF nativa. Impressão = HTML + `window.print()` (recibo térmico 80mm).

### Fluxo resumido (arquitetura real)

```
Visitante → / → Prisma (Category + Product visíveis) → vitrine

Admin → /admin/login → Server Action authenticate → NextAuth Credentials
     → JWT em cookie → middleware + layout protegido → /admin (Dashboard)

Admin → módulos (Categorias, Produtos, Insumos, Ficha Técnica, PDV, Pedidos, Histórico)
     → Server Action ou fetch de API
     → requireAdmin() / auth()
     → Prisma (PostgreSQL)
     → revalidatePath / revalidateTag
     → UI atualiza (RSC refresh ou estado local)

PDV → createOrder (PENDING) → Board faz polling → fetch work-order
     → HTML térmico → window.print() → Concluir → COMPLETED → Dashboard/Histórico
```

### Principais fluxos de negócio

1. **Cadastrar peça:** categoria → produto (foto/preço) → ficha técnica (composição) → preço/custo gravados no produto → aparece na vitrine e no PDV se disponível.
2. **Vender:** PDV adiciona peças disponíveis → cliente obrigatório → opcionalmente WhatsApp/sinal → pedido `PENDING` → impressão na recepção → concluir → `COMPLETED`.
3. **Produzir:** a via do joalheiro no recibo agrega insumos da ficha técnica × quantidade vendida (requisição de compra).

---

## 2. TECNOLOGIAS UTILIZADAS

Fontes: `package.json`, `prisma/schema.prisma`, `next.config.mjs`, `auth.config.ts`, `tailwind.config.ts`, `components.json`, `.env.example`.

### Runtime / linguagem

| Tecnologia | Versão | Finalidade | Onde |
|---|---|---|---|
| TypeScript | `^5` | Tipagem | Todo o projeto |
| Node.js | (dev: `@types/node` ^20) | Runtime serverless / Next | Vercel / local |
| React | `^19.0.0` | UI | `app/`, `components/`, `hooks/` |
| React DOM | `^19.0.0` | Renderização | Idem |

### Frontend

| Tecnologia | Versão | Finalidade | Onde |
|---|---|---|---|
| Next.js (App Router) | `^15.1.6` | Framework full-stack, RSC, rotas | `app/` |
| Tailwind CSS | `^3.4.17` | Estilo | `app/globals.css`, `tailwind.config.ts` |
| tailwindcss-animate | `^1.0.7` | Animações CSS | plugin Tailwind |
| class-variance-authority | `^0.7.1` | Variantes de componentes UI | `components/ui/` |
| clsx + tailwind-merge | `^2.1.1` / `^2.6.0` | `cn()` | `lib/utils.ts` |
| lucide-react | `^0.469.0` | Ícones | UI admin e vitrine |
| Radix UI (checkbox, dialog, label, popover, select, separator, slot, switch) | várias | Primitivos acessíveis | `components/ui/` |
| shadcn/ui (estilo `new-york`, base `stone`) | — | Scaffold de UI | `components.json` |
| Google Fonts: Manrope, Playfair Display | next/font | Tipografia | `app/layout.tsx` |
| recharts | `^3.9.2` | Gráficos do dashboard | `components/admin/dashboard-charts.tsx` |
| SWR | `^2.4.2` | Polling/cache de pedidos pendentes | `hooks/use-pending-orders.ts` |
| react-hook-form | `^7.81.0` | Formulários | produtos, insumos, ficha, ordens |
| @hookform/resolvers | `^5.4.0` | Zod + RHF | Idem |
| zod | `^4.4.3` | Validação FE/BE | actions e forms |

### Backend / dados

| Tecnologia | Versão | Finalidade | Onde |
|---|---|---|---|
| Prisma ORM | `^6.2.1` | Schema, client, migrations | `prisma/`, `lib/prisma.ts` |
| @prisma/client | `^6.2.1` | Queries | Server Components, actions, APIs |
| PostgreSQL | — | Banco (Neon/Vercel Postgres/Supabase, conforme env) | `POSTGRES_PRISMA_URL` |
| tsx | `^4.19.2` | Seed scripts | `prisma/seed.ts`, `prisma/seed-stones.ts` |

### Autenticação

| Tecnologia | Versão | Finalidade | Onde |
|---|---|---|---|
| next-auth (Auth.js v5) | `5.0.0-beta.25` | Login Credentials, JWT, middleware | `auth.ts`, `auth.config.ts`, `middleware.ts`, `app/api/auth/[...nextauth]/route.ts` |

### Upload / arquivos

| Tecnologia | Versão | Finalidade | Onde |
|---|---|---|---|
| @vercel/blob | `^2.6.1` | Upload privado (`put`) e leitura (`get`) | `app/api/upload/route.ts`, `app/api/file/route.ts` |

### Build / qualidade

| Tecnologia | Versão | Finalidade |
|---|---|---|
| ESLint + eslint-config-next | `^8` / `^15.1.6` | Lint |
| PostCSS + Autoprefixer | `^8` / `^10.4.20` | CSS |
| next/image | Next 15 | Otimização de imagens (Unsplash, placehold.co, Blob) |

### O que **não** existe no código

- Docker / docker-compose
- Redis / cache externo (há `unstable_cache` do Next)
- Filas (Bull, etc.)
- WebSockets
- Envio de e-mail
- Geração de PDF/Excel/CSV
- Stripe ou gateway de pagamento
- QZ Tray / ESC/POS (apenas comentário de upgrade futuro em `lib/print.ts`)

### Scripts npm (`package.json`)

| Script | Comando |
|---|---|
| `dev` | `next dev` |
| `build` | `prisma generate && prisma db push --skip-generate --accept-data-loss && next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `postinstall` | `prisma generate` |
| `db:push` | `prisma db push --accept-data-loss` |
| `db:seed` | `prisma db seed` → `tsx prisma/seed.ts` |
| `db:seed:stones` | `tsx prisma/seed-stones.ts` |
| `db:studio` | `prisma studio` |

**Atenção:** `build` e `db:push` usam `--accept-data-loss`. Em produção isso pode **apagar colunas/dados** se o schema divergir.

---

## 3. ESTRUTURA DO PROJETO

```
SistemaAllAtivaJoias/
├── app/                          # Rotas Next.js (App Router)
│   ├── layout.tsx                # Layout raiz (fontes, metadata, globals)
│   ├── page.tsx                  # Vitrine pública
│   ├── globals.css               # Tailwind + impressão térmica
│   ├── admin/
│   │   ├── login/                # Tela e action de login
│   │   ├── (protected)/          # Grupo de rotas com layout autenticado
│   │   │   ├── layout.tsx        # auth() + AdminShell
│   │   │   ├── page.tsx          # Dashboard
│   │   │   ├── categorias/
│   │   │   ├── produtos/
│   │   │   ├── insumos/
│   │   │   ├── ficha-tecnica/
│   │   │   └── pedidos/          # board, novo (PDV), historico
│   │   ├── categorias/actions.ts
│   │   ├── produtos/actions.ts
│   │   ├── insumos/actions.ts
│   │   ├── insumos/pattern-actions.ts
│   │   ├── ficha-tecnica/actions.ts
│   │   ├── pedidos/actions.ts
│   │   └── login/actions.ts
│   └── api/
│       ├── auth/[...nextauth]/   # Handlers NextAuth
│       ├── upload/               # POST imagem
│       ├── file/                 # GET proxy Blob
│       ├── admin/orders/pending/
│       ├── admin/orders/[id]/work-order/
│       └── insumos/seed-pedras/
├── components/
│   ├── admin/                    # Componentes de domínio do painel
│   ├── layout/                   # Header/Footer da vitrine
│   ├── ui/                       # Primitivos shadcn
│   └── ProductCard.tsx
├── hooks/                        # Hooks client
├── lib/                          # Regras de negócio, Prisma, format, auth
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts
│   ├── seed-stones.ts
│   └── stones-library.ts
├── auth.ts / auth.config.ts / middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── components.json               # shadcn
├── .env.example
└── package.json
```

### O que cada pasta representa

| Pasta / arquivo | Papel |
|---|---|
| `app/` | Páginas (RSC), layouts, Route Handlers, Server Actions |
| `app/admin/(protected)/` | Telas do ERP; o layout exige sessão |
| `app/admin/*/actions.ts` | Mutações de servidor (não REST) |
| `app/api/` | Endpoints HTTP |
| `components/admin/` | UI reutilizável do painel |
| `components/ui/` | Botão, dialog, table, etc. (sem regra de negócio) |
| `components/layout/` | Header/Footer da vitrine |
| `hooks/` | Polling, impressão, scroll-spy |
| `lib/` | Precificação, joalheria, requisição, dashboard, Prisma, auth-guard |
| `prisma/` | Modelo, migrations, seeds |
| `auth.config.ts` | Config Edge-safe do NextAuth (sem Prisma) |
| `middleware.ts` | Protege `/admin/:path*` |

Não há pastas `services/`, `controllers/` ou `models/` clássicas. Equivalentes:

- **Controllers:** Server Actions + Route Handlers
- **Models:** Prisma schema (`prisma/schema.prisma`)
- **Services:** `lib/pricing.ts`, `lib/jewelry-math.ts`, `lib/material-requisition.ts`, `lib/dashboard-metrics.ts`, `lib/supply-pattern-expand.ts`
- **Queries:** inline nos Server Components e em `lib/dashboard-metrics.ts` (`$queryRaw`)
- **Assets:** imagens remotas (Unsplash, placehold.co, Vercel Blob); sem pasta `public/` de imagens de produto no git status analisado
- **Scripts:** `prisma/seed.ts`, `prisma/seed-stones.ts`

### Arquivos importantes da lógica

Ver seções 8–13. Arquivos gerados (`node_modules`, `.next`, `next-env.d.ts`) não fazem parte da lógica de negócio.

**Arquivo legado não usado pela rota atual:**  
`app/admin/(protected)/ficha-tecnica/ficha-tecnica-client.tsx` — a página importa `FichaTecnicaForm`, não este client. Ver seção 27.

---

## 4. ARQUITETURA

### Estilo

**Monólito full-stack Next.js (App Router)** com renderização híbrida:

- **Server Components** carregam dados no servidor (Prisma) e enviam HTML.
- **Client Components** (`"use client"`) tratam formulários, filtros, carrinho, polling e impressão.
- **Server Actions** mutam o banco.
- **Route Handlers** cobrem auth HTTP, upload, proxy de arquivo, polling e seed de pedras.

Não há BFF separado. Não há camada de serviço injetável — as actions chamam Prisma diretamente.

### Camadas

```
Browser
  ├── Vitrine RSC ── Prisma ── PostgreSQL
  └── Admin
        ├── RSC (listagens) ── Prisma
        ├── Client (forms) ── Server Action ── requireAdmin ── Prisma
        ├── Client (SWR) ── GET /api/admin/... ── auth() ── Prisma
        └── Client (upload) ── POST /api/upload ── auth() ── Vercel Blob
```

### Fluxo real de uma mutação (exemplo: criar produto)

```
ProductFormSheet (client)
  → RHF + Zod (frontend)
  → formAction(FormData)
  → createProduct (Server Action)
  → requireAdmin()  [auth()]
  → Zod no servidor
  → prisma.product.create
  → revalidatePath("/admin/produtos", "/admin/pedidos/novo", "/")
  → revalidateTag("dashboard")
  → { success: true }
  → useEffect fecha o Sheet
```

### Fluxo real de uma venda

```
PdvClient.addToCart → estado local
  → handleFinalize → createOrder(input)
  → validações + prisma.product.findMany (disponíveis)
  → snapshot priceAtTime/costAtTime/title/code
  → prisma.order.create status=PENDING
  → PedidosBoard (outra aba) SWR 8s
  → fetchWorkOrderData → GET /api/admin/orders/:id/work-order
  → toWorkOrderData + calculateMaterialsForOrder
  → window.print()
  → completeOrder → status=COMPLETED
```

### Autenticação / autorização / persistência

- **Auth:** JWT (cookie de sessão Auth.js). Comparação de e-mail/senha em texto contra env.
- **Autorização:** binária — autenticado ou não. Sem RBAC.
- **Persistência de negócio:** PostgreSQL.
- **Persistência de sessão:** JWT no cookie (não no banco).
- **Persistência local:** `localStorage` só para IDs de pedidos já auto-impressos (`allativa:auto-printed-orders`).

### Comunicação entre componentes

Não há Context API global nem Redux. Estado é:

- servidor (RSC props);
- local (`useState` / RHF);
- SWR (pedidos pendentes, compartilhado entre badge e board se a mesma URL for usada — o board usa lista, o badge usa `?mode=count`).

---

## 5. BANCO DE DADOS

**Provider:** PostgreSQL (`prisma/schema.prisma`).  
**ORM:** Prisma 6.  
**IDs:** `cuid()` em todas as PKs.  
**Datas:** `DateTime` com `@default(now())`; `updatedAt` onde aplicável.

**URLs (schema, não `.env.example`):**

```
url       = env("POSTGRES_PRISMA_URL")        # pooled (runtime)
directUrl = env("POSTGRES_URL_NON_POOLING")   # direta (migrations)
```

⚠️ `.env.example` documenta `DATABASE_URL`, que **não** é lida pelo `schema.prisma`. Em deploy Vercel Postgres as variáveis `POSTGRES_*` costumam ser injetadas automaticamente. Localmente, sem essas vars, o Prisma não conecta.

Não há procedures, triggers nem funções SQL customizadas nas migrations. Há queries raw no dashboard.

### 5.1 Category

**Finalidade:** seções da vitrine e agrupamento de produtos.

| Campo | Tipo | Obrigatório | Default | Notas |
|---|---|---|---|---|
| id | String (cuid) | PK | cuid() | |
| name | String | sim | | |
| slug | String | sim | | **unique**; gerado por `slugify(name)` |
| order | Int | sim | 0 | ordem de exibição |
| createdAt / updatedAt | DateTime | sim | now / auto | |

**Índice:** `[order]`  
**Relação:** `products Product[]`  
**Delete:** hard delete. Produtos ficam com `categoryId = null` (`onDelete: SetNull`).

### 5.2 Product

**Finalidade:** peça do catálogo / PDV.

| Campo | Tipo | Obrigatório | Default | Notas |
|---|---|---|---|---|
| id | String | PK | cuid() | |
| title | String | sim | | |
| description | String | sim | | pode ser string vazia |
| imageUrl | String | sim | | se vazio no form, placehold.co |
| price | Float | sim | | preço de venda |
| costPrice | Float | sim | 0 | custo; atualizado pela ficha |
| isAvailable | Boolean | sim | true | vitrine + PDV |
| isDeleted | Boolean | sim | false | soft delete |
| productCode | String? | não | null | unique; SKU interno; **não** vai à vitrine |
| totalWeightG | Float? | não | | peso da peça (ficha) |
| pricingStrategy | String? | não | | `markupPercent \| marginPercent \| fixedProfit \| finalPrice` |
| pricingValue | Float? | não | | valor da estratégia |
| categoryId | String? | não | | FK Category SetNull |
| createdAt / updatedAt | DateTime | | | |

**Índices:** categoryId, title, isAvailable, isDeleted, `[isDeleted, isAvailable]`, `[categoryId, title]`  
**Relações:** OrderItem[], CompositionItem[]  
**Delete:** soft (`isDeleted=true`, `isAvailable=false`, `productCode=null`). Motivo: preservar FK em `OrderItem`.

### 5.3 Material

**Finalidade:** cadastro de insumo **usado na BOM** (ficha). Não é a biblioteca visual (Stone/Chain/Wire/Alloy). É preenchido por `upsert` em `saveFichaTecnica`.

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| id | String PK | cuid | |
| name | String | | **unique** — chave do upsert |
| type | String | `"metal"` | `metal \| gema \| componente` |
| purchasePrice | Float | | custo do lote |
| purchaseQuantity | Float | | qtd do lote |
| unit | String | | `g \| ct \| un \| mg \| cm \| par` |
| attrCut, attrColor | String? | | pedra |
| attrSizeMm | Float? | | pedra mm / corrente espessura |
| attrMaterial | String? | | metal/corrente/fio |
| attrMesh | String? | | corrente |
| attrProfile | String? | | fio |
| attrGauge | Float? | | fio bitola |
| weightPerCm | Float? | | corrente/fio |
| purity | Float? | | teor 0–1 |
| pureMetalName, alloyMetalName | String? | | decomposição da liga |
| createdAt / updatedAt | DateTime | | |

**Índices:** type, attrCut, attrColor, attrMaterial, attrProfile  
**Delete de CompositionItem:** `onDelete: Restrict` no Material — não se apaga material ainda referenciado (na prática a ficha dá `deleteMany` das linhas da peça antes de recriar).

### 5.4 CompositionItem

**Finalidade:** BOM da joia (quanto de cada Material entra na peça).

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| id | String PK | | |
| productId | FK Product | Cascade | |
| materialId | FK Material | Restrict | |
| quantityUsed | Float | | |
| sequenceOrder | Int | 0 | ordem de cravação |
| lineKind | String | `"outro"` | `pedra \| metal \| corrente \| fio \| outro` |
| sourcePatternId | FK SupplyPattern? | SetNull | auditoria de Ordem |
| patternQty | Float? | | total de pedras da ordem |
| createdAt | DateTime | now | |

**Unique:** `[productId, materialId]` — duas linhas da mesma peça com o mesmo Material são **somadas** no save.  
**Índices:** productId, materialId, `[productId, sequenceOrder]`, sourcePatternId.

### 5.5 Stone (biblioteca)

Pedras/gemas para composição e ordens.

| Campo | Tipo | Default |
|---|---|---|
| id | PK | cuid |
| name | String | |
| cut | String | `"brilhante"` |
| color | String | `"branco"` |
| sizeMm | Float? | |
| weightCt | Float | 0 |
| unitPrice | Float | 0 |
| createdAt / updatedAt | | |

Índices: name, cut, color, sizeMm, `[cut, color, sizeMm]`.  
FK: `SupplyPatternItem` Restrict.

### 5.6 Chain (biblioteca)

Correntes por cm.

Campos: name, mesh (`veneziana`), material (`Ouro 18k`), thicknessMm, weightPerCm, pricePerCm (default 0).  
FK: SupplyPatternItem Restrict.

### 5.7 Wire (biblioteca)

Fios/chapas. Herdam custo da liga.

| Campo | Notas |
|---|---|
| alloyId | FK MetalAlloy SetNull |
| material | denormalizado (nome da liga) |
| profile | redondo, etc. |
| gauge | mm |
| widthMm | perfil chato |
| weightPerCm | g/cm |
| pricePerCm | cache: `weightPerCm × alloy.pricePerGram` ao salvar |

### 5.8 MetalAlloy (biblioteca)

Liga oficial.

| Campo | Default | Papel |
|---|---|---|
| purity | 0.75 | teor 0–1 |
| pureMetalName | Ouro 24k | |
| pureMetalPricePerG | 0 | referência |
| alloyMetalName | Pré-liga… | |
| alloyMetalPricePerG | 0 | referência |
| **pricePerGram** | 0 | **preço oficial do ERP** (fios, ficha) |

O custo teórico da mistura (`computeAlloy`) é só referência na UI; o valor usado nas contas é `pricePerGram`.

Ao **atualizar** uma liga, a action propaga `material` e `pricePerCm` para todos os `Wire` com aquele `alloyId`.

### 5.9 SupplyPattern / SupplyPatternItem

Ordem/kit reutilizável.

- Pattern: name, description?, isActive (default true).
- Item: itemKind (`pedra|metal|corrente|fio`), quantity (por 1 aplicação), sequenceOrder, exatamente um de stoneId/alloyId/chainId/wireId conforme kind, notes?.
- Delete do pattern: Cascade nos items; CompositionItem.sourcePatternId → SetNull.

### 5.10 Order (`@@map("orders")`)

| Campo | Default | Notas |
|---|---|---|
| customerName | | obrigatório na action |
| customerPhone | | só dígitos |
| sellerName | | mapeado no banco como `waiterName` (`@map`) |
| status | `"PENDING"` | `PENDING \| COMPLETED` (não há enum Prisma; é String) |
| totalAmount | | soma priceAtTime × qty |
| advancePayment | 0 | sinal |
| createdAt | now | **não há updatedAt** |

Índices: createdAt, status, `[status, createdAt]`.  
Não há exclusão de pedido no código.

### 5.11 OrderItem (`@@map("order_items")`)

Snapshot da venda:

- quantity (Int)
- priceAtTime, costAtTime (default 0)
- productTitle, productCode? (histórico independente do cadastro atual)
- productId Restrict (produto não pode ser hard-deleted)

Delete do Order: Cascade nos items.

### Relacionamentos (mapa)

```
Category 1──* Product
Product 1──* CompositionItem *──1 Material
Product 1──* OrderItem *──1 Order
SupplyPattern 1──* SupplyPatternItem
  ├── Stone | MetalAlloy | Chain | Wire
CompositionItem *──? SupplyPattern
Wire *──? MetalAlloy
```

### Como dados são criados / atualizados / excluídos

| Entidade | Create | Update | Delete |
|---|---|---|---|
| Category | createCategory | updateCategory (regenera slug) | hard delete |
| Product | createProduct | updateProduct | soft delete |
| Stone/Chain/Wire/Alloy | save* (upsert por id) | save* | hard delete (Restrict se usado em ordem) |
| SupplyPattern | saveSupplyPattern | update + replace items | hard delete |
| CompositionItem | saveFichaTecnica (deleteMany + create) | idem | some com rewrite da ficha |
| Material | upsert by name na ficha | upsert | sem tela de exclusão |
| Order | createOrder PENDING | completeOrder → COMPLETED | inexistente |
| OrderItem | create aninhado | não atualiza | cascade do order |

### Queries importantes

`lib/dashboard-metrics.ts` (SQL raw):

- receita/custo/qtd de pedidos COMPLETED desde `since`;
- receita por categoria (30 dias);
- catálogo LEFT JOIN vendas (30 dias);
- evolução diária (7 dias, fuso Brasília).

Top 7 produtos: `groupBy` Prisma no **mês civil** de Brasília (diferente do KPI “mês” = 30 dias). Ver seções 11 e 27.

Histórico: `findMany` status COMPLETED, `take: 100`.

Vitrine: categories `orderBy order`, products available e not deleted.

### Migrations

Em `prisma/migrations/` (PostgreSQL):

1. `20260717190000_jewelry_refactor`
2. `20260717193000_jewelry_insumos`
3. `20260717194500_material_requisition_attrs`
4. `20260717201500_product_code`
5. `20260717223000_performance_indexes`
6. `20260722224500_soft_delete_and_order_snapshots`
7. `20260722230000_cost_inheritance_alloy_wire`
8. `20260804200000_ficha_tecnica_structured`
9. `20260804210000_supply_patterns`

O `build` usa `prisma db push`, não `migrate deploy`. ⚠️ Drift entre migrations versionadas e o banco de produção é possível.

Há um `prisma/dev.db` no git status (SQLite?). O schema atual é **PostgreSQL**. ⚠️ Esse arquivo parece residual; o código não aponta SQLite.

---

## 6. LOGIN E AUTENTICAÇÃO

### Tela

- **Rota:** `/admin/login`
- **Arquivos:** `app/admin/login/page.tsx`, `login-form.tsx`, `actions.ts`
- **Acesso:** público. Se já logado, o callback `authorized` redireciona para `/admin`.

### Campos

| Campo | Tipo | Obrigatório | Validação FE | Default |
|---|---|---|---|---|
| E-mail | `type="email"` name=`email` | HTML `required` | tipo email do browser | em **dev**: `admin@allativajoias.com` |
| Senha | `type="password"` name=`password` | HTML `required` | — | em **dev**: `admin123` |

Em desenvolvimento (`NODE_ENV !== "production"`) o form mostra dica e pré-preenche essas strings **hardcoded** (não lê `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Em produção os defaults são `undefined`.

### Botão

**Entrar** — submit. Enquanto pendente: disabled, texto “Entrando...”.

### Fluxo ao clicar em Entrar

1. `useActionState` chama `authenticate(prev, formData)`.
2. `signIn("credentials", { email, password, redirectTo: "/admin" })`.
3. NextAuth `authorize`:
   - lê `ADMIN_EMAIL` e `ADMIN_PASSWORD`;
   - se faltar qualquer um dos quatro valores → `null` (falha);
   - e-mail: `trim().toLowerCase()` vs env `trim().toLowerCase()`;
   - senha: `trim()` vs env `trim()` — **igualdade de string, sem hash**.
4. Sucesso: user `{ id: "admin", name: "Administrador", email: adminEmail }`.
5. Redirect para `/admin` (via throw `NEXT_REDIRECT`, re-lançado na action).
6. Falha `AuthError`: `{ error: "E-mail ou senha inválidos." }` exibido no form.

### Senha

- Armazenada em variável de ambiente em **texto claro**.
- Comparada com `===` após trim.
- Não há bcrypt/argon2.
- Não há “esqueci minha senha”.

### Tokens / sessão / cookies

- Estratégia: **JWT** (`session.strategy: "jwt"`).
- Cookie gerenciado pelo Auth.js (não há código customizado de cookie).
- ⚠️ **maxAge não está configurado.** O padrão do Auth.js/NextAuth para JWT é tipicamente **30 dias**. **Não há expiração de 24h no código.**
- `trustHost: true`.
- Página de sign-in: `/admin/login`.

**LocalStorage/SessionStorage:** não usados no login. (localStorage só na impressão de pedidos.)

### Após o login (técnico)

1. Cookie JWT válido.
2. Middleware (`matcher: ["/admin/:path*"]`) chama `authorized`.
3. Layout `(protected)` chama `auth()` de novo; se não houver user → `redirect("/admin/login")`.
4. Renderiza `AdminShell` (sidebar).

### Logout

Botão **Sair** em `AdminShell`: `signOut({ callbackUrl: "/admin/login" })` (`next-auth/react`). Destrói a sessão Auth.js e redireciona.

### Recuperação de senha

**Não existe.**

### Tratamento de erro

- Credenciais inválidas: mensagem vermelha no form.
- Redirect de sucesso não é capturado como erro (rethrow).
- Se `ADMIN_EMAIL`/`ADMIN_PASSWORD` estiverem ausentes, `authorize` retorna `null` → mesma mensagem de inválidos.

---

## 7. USUÁRIOS E PERMISSÕES

### Perfis existentes (confirmado)

| Nome | Origem | Permissões |
|---|---|---|
| Visitante (anônimo) | ausência de sessão | Só `/`, `/api/file`, assets públicos. Não acessa `/admin*` (exceto login). |
| Administrador | env ADMIN_* | **Todas** as telas e mutações do painel. |

Não há:

- tabela de usuários;
- roles/permissions;
- multi-tenant / `tenant_id`;
- diferença entre vendedor e ourives.

O campo **Vendedor(a)** no PDV é string livre gravada em `Order.sellerName`.

### Onde a permissão é verificada

| Camada | Mecanismo |
|---|---|
| Middleware | `authorized`: `/admin` exige `auth.user`; `/admin/login` libera ou redireciona se logado |
| Layout protegido | `auth()` + redirect |
| Server Actions | `requireAdmin()` — lança `"Não autorizado. Faça login como administrador."` (algumas actions capturam e devolvem “Sessão expirada…”) |
| APIs admin | `auth()` → 401 `{ error: "Não autorizado." }` |
| `/api/file` | **sem auth** (necessário à vitrine) |
| `/api/auth/*` | NextAuth |

---

## 8. TELAS DO SISTEMA

Acesso de todas as telas `/admin/*` (exceto login): **Administrador autenticado**. Visitante só a vitrine.

---

### 8.1 Vitrine pública — Catálogo Digital

**Objetivo:** exibir peças disponíveis por categoria.  
**Rota:** `/`  
**Acesso:** público  
**Arquivos:** `app/page.tsx`, `components/layout/Header.tsx`, `Footer.tsx`, `components/ProductCard.tsx`  
**dynamic:** `force-dynamic`

**Componentes:** Header (menu categorias + scroll spy), seções por categoria, ProductCard, Footer (Instagram, site, WhatsApp, e-mail, horário Seg–Sex 8h–16h).

**Campos:** nenhum formulário.

**Botões:** hamburger (abre Sheet de categorias); “Ler mais/menos” na descrição se > 70 caracteres; links externos no footer.

**Tabelas:** não. Grid de cards.

**APIs:** nenhuma HTTP; query Prisma no RSC.

**Banco:** Category, Product (`isAvailable=true`, `isDeleted=false`). Select **sem** `productCode`.

**Regras:**

- Categorias sem produtos visíveis são omitidas.
- SKU não aparece na vitrine.
- Empty state: “O catálogo está sendo atualizado. Volte em breve!”

**Fluxo:** load categories ordered → filter with products → render. Header usa `useScrollSpy` para destacar a seção visível.

---

### 8.2 Login

Ver seção 6.  
**Rota:** `/admin/login`

---

### 8.3 Dashboard de Vendas

**Rota:** `/admin`  
**Arquivos:** `app/admin/(protected)/page.tsx`, `lib/dashboard-metrics.ts`, `dashboard-charts.tsx`, `catalog-sales-table.tsx`  
**Objetivo:** KPIs e desempenho de vendas **COMPLETED**.

**Componentes:** 3 KPI cards, TopProductsChart, WeeklyEvolutionChart, CategorySalesList, CatalogSalesTable.

**Campos (tabela catálogo):** busca por título/categoria (client); ordenação por Vendas / Receita / Lucro.

**Botões:** ordenação nas colunas da tabela.

**Tabelas:** Catálogo Completo — colunas imagem, título, categoria, quantidade, receita, lucro. Sem paginação.

**APIs:** nenhuma; `getDashboardData` com `unstable_cache` 60s, tag `"dashboard"`.

**Banco:** orders, order_items, Product, Category.

**Regras de período (importante):**

| Bloco | Período real no código |
|---|---|
| Faturamento do Dia | desde meia-noite Brasília |
| Faturamento da Semana | últimos **7 dias** |
| Faturamento do Mês (KPI) | últimos **30 dias** (`subtractDays(today, 30)`), **não** mês civil |
| Top 7 peças | **mês civil** Brasília |
| Evolução semanal | 7 dias |
| Vendas por categoria / catálogo | 30 dias |

Receita = `SUM(priceAtTime * quantity)`; custo = `SUM(costAtTime * quantity)`; lucro = receita − custo; margem = lucro/receita × 100.

**Fluxo:** RSC chama cache → Prisma/SQL → cards e gráficos.

---

### 8.4 Categorias

**Rota:** `/admin/categorias`  
**Arquivos:** `page.tsx`, `category-form-dialog.tsx`, `app/admin/categorias/actions.ts`

**Objetivo:** seções do catálogo.

**Campos do dialog:**

| Nome | Tipo | Obrigatório | Validação | Default | Origem | Ao alterar |
|---|---|---|---|---|---|---|
| Nome | text | sim | trim não vazio no server | categoria existente | form | vira slug |
| Ordem | number min 0 | não | Number.isFinite senão 0 | 0 | form | ordem na vitrine |

**Botões:** Nova Categoria; Editar (ícone); Excluir (confirmação); Criar/Salvar.

**Tabela:** Ordem, Nome, Slug, Produtos (count não deletados), Ações. Sem paginação/filtro.

**APIs:** Server Actions create/update/deleteCategory.

**Banco:** Category.

**Regras:** slug unique; conflito → “Já existe uma categoria com esse nome/slug.”; exclusão não apaga produtos.

---

### 8.5 Produtos

**Rota:** `/admin/produtos`  
**Arquivos:** `page.tsx`, `produtos-table.tsx`, `product-form-sheet.tsx`, `image-upload.tsx`, `app/admin/produtos/actions.ts`

**Objetivo:** CRUD das peças.

**Campos do Sheet:**

| Nome | Tipo | Obrigatório | Validação | Default |
|---|---|---|---|---|
| Título | text | sim | min 1 | |
| Código (SKU) | text | não | max 64 | "" → null |
| Descrição | textarea | não | | |
| Preço de venda | text decimal | sim FE / ≥0 BE | parse `,` ou `.` | |
| Custo | text | não | ≥0 | "0" |
| Categoria | select | sim | | primeira categoria |
| Imagem | upload | não | JPG/PNG/WEBP/GIF ≤4MB | placehold se vazio |
| Disponível | switch | | | true |

**Botões:** Novo Produto (bloqueado se não houver categorias — mostra texto); Editar; Excluir (soft); Salvar.

**Tabela:** Imagem, Código, Título, Categoria, Preço, Status, Ações.  
Filtros: busca nome/SKU, categoria, status. Paginação **client-side 25** (`DEFAULT_PAGE_SIZE`). Sem ordenação por coluna.

**APIs:** actions + `POST /api/upload` via ImageUpload.

**Banco:** Product, Category.

**Regras:** unique SKU → “Já existe um produto com este código”; soft delete zera SKU; indisponível some da vitrine e do PDV.

`toggleProductAvailability` existe na action mas **não é usada pela tabela** (status só via Sheet). Ver seção 27.

---

### 8.6 Biblioteca de Insumos

**Rota:** `/admin/insumos`  
**Arquivos:** `page.tsx`, `insumos-client.tsx`, `insumo-forms.tsx`, `pattern-form.tsx`, actions.

**Objetivo:** cadastros mestres da oficina + Ordens/Kits.

**Abas:** Pedras | Correntes | Fios | Ligas | Ordens (`Tabs`).

#### Pedras

Filtros: busca, lapidação, cor, tamanho. Paginação 25.  
Campos do form (Zod server): name, cut (default brilhante), color (default branco), sizeMm opcional ≥0, weightCt ≥0, unitPrice ≥0.  
Botão extra: **Popular catálogo base** → `POST /api/insumos/seed-pedras` — só se `stones.length === 0`; senão 409. Insere 450 zircônias (9 tamanhos × 5 cortes × 10 cores), weightCt e unitPrice = 0.

#### Correntes

name, mesh, material, thicknessMm, weightPerCm, pricePerCm.

#### Fios

name, **alloyId obrigatório**, profile, gauge, widthMm, weightPerCm.  
`pricePerCm` e `material` vêm da liga: `pricePerCm = weightPerCm * alloy.pricePerGram`.

#### Ligas

name, purity 0–1, metais/preços de referência, **pricePerGram oficial**. Calculadora teórica; botão para copiar custo teórico para pricePerGram.

#### Ordens

name, description, items (kind + insumo + quantity > 0). Mínimo 1 item. isActive default true no schema/action.

**APIs:** save/delete* actions; seed-pedras.  
**Banco:** Stone, Chain, Wire, MetalAlloy, SupplyPattern, SupplyPatternItem.

---

### 8.7 Ficha Técnica

**Rota:** `/admin/ficha-tecnica`  
**Arquivos:** `page.tsx`, `ficha-tecnica-form.tsx` (ativo), `ficha-results.tsx`, `app/admin/ficha-tecnica/actions.ts`  
**Objetivo:** montar BOM, calcular preço, gravar no produto.

**Campos principais:**

| Campo | Tipo | Default | Comportamento |
|---|---|---|---|
| Filtros de peça | busca/categoria/status (disp. e com/sem ficha) | | filtra o select |
| Peça | select | "" | `handleSelectProduct` reidrata composição |
| Peso total (g) | number nullable | do produto | persistido em Product.totalWeightG |
| Pedras/Metais/Correntes/Fios | linhas | [] | escolha da biblioteca preenche attrs e preços |
| Ordens | patternId + totalStones | [] | expandidas via `expandPattern` (preview + save no server) |
| Custos adicionais | label, kind fixed/percent, value | [] | **não persistidos** |
| Estratégia | 4 modos | markupPercent, 100 | persistido pricingStrategy/Value |

Presets de custo: Mão de Obra, Cravação, Banho, Embalagem (isPackaging), Certificado, Taxa de Cartão (%), Comissão (%).

**Botões:** adicionar linhas, reordenar pedras, salvar ficha (exige peça selecionada).

**Resultados (FichaResults):** preço sugerido, margem, markup, composição, simulação de marcação 50/80/100/150/200%, projeção 5/10/25/50 unidades, alertas.

**APIs:** `saveFichaTecnica`.  
**Banco:** Product, Material, CompositionItem, SupplyPattern*.

**Regras-chave:** ver seções 11–12. Custos adicionais **não** voltam ao reabrir a peça (só ficam no estado do form na sessão). Estratégia e composição sim.

---

### 8.8 Novo Pedido (PDV)

**Rota:** `/admin/pedidos/novo`  
**Arquivos:** `page.tsx`, `pdv-client.tsx`

**Campos:**

| Nome | Obrigatório | Validação |
|---|---|---|
| Busca | não | título, SKU, categoria, descrição (normalizado) |
| Filtro categoria / faixa de preço | não | faixas 0–500, 500–1500, 1500–3000, 3000+ |
| Nome do cliente | sim | trim; botão disabled se vazio |
| Vendedor | não | |
| WhatsApp | não | `formatPhone` máscara; server guarda só dígitos |
| Sinal | não | parse moeda; não pode > total |

**Botões:** clique no card adiciona ao carrinho; +/− quantidade; remover linha; Enviar Pedido.

**Disabled Enviar:** pending OU carrinho vazio OU nome vazio OU sinal > total.

**APIs:** `createOrder`.  
**Banco:** Product (leitura), Order, OrderItem.

Sucesso: “Venda registrada! O comprovante é impresso na aba Pedidos.” Limpa carrinho e campos.

---

### 8.9 Pedidos (fila / recepção)

**Rota:** `/admin/pedidos`  
**Arquivo:** `pedidos-board.tsx`

**Objetivo:** listar PENDING, imprimir automaticamente, concluir.

**Estado inicial:** “Recepção de pedidos pausada” + **Iniciar Recepção de Pedidos** (user gesture para `window.print`).

Após iniciar:

- SWR `GET /api/admin/orders/pending` a cada 8s.
- Cards: cliente, vendedor, WhatsApp, #id curto, tempo de espera (vermelho se ≥ 10 min), itens, total, sinal/falta, **Concluir Pedido**.
- Pausar volta ao estado ocioso (para o polling).
- Auto-print só se `canPrintOnCashierPc()` (UA não mobile).
- IDs impressos em `localStorage` `allativa:auto-printed-orders`.

**APIs:** pending, work-order, `completeOrder`.  
**Banco:** Order, OrderItem, Product.compositionItems + Material (na impressão).

Não há cancelar pedido.

---

### 8.10 Histórico de Pedidos

**Rota:** `/admin/pedidos/historico?period=today|week|month|all`  
Default period: `all`.  
**take:** 100 pedidos COMPLETED, `createdAt desc`.

**Tabela:** Pedido (#8 chars), Cliente, Data/Hora Brasília, Produtos (resumo), Total, Reimprimir.

Reimpressão: `useReceiptPrint` — só PC do caixa; senão “Reimpressão disponível apenas no PC do caixa.”

---

## 9. MÓDULOS

### Módulo Catálogo público

- Telas: `/`
- Serviços: Prisma no RSC
- Tabelas: Category, Product
- Dependências: produtos disponíveis com categoria visível

### Módulo Autenticação

- Telas: login
- APIs: `/api/auth/[...nextauth]`
- Sem tabela de usuários
- Dependências: `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### Módulo Dashboard

- `getDashboardData`, gráficos, tabela
- Tabelas: Order, OrderItem, Product, Category
- Cache 60s; invalida ao criar/concluir pedido e ao mudar produto/ficha

### Módulo Categorias

- CRUD Category; impacta vitrine e produtos

### Módulo Produtos

- CRUD Product; ImageUpload; impacta vitrine, PDV, ficha, dashboard

### Módulo Insumos

- Stone, Chain, Wire, MetalAlloy, SupplyPattern
- Seed de pedras
- Consumido pela Ficha e pelas Ordens
- Herança de custo liga → fio

### Módulo Ficha Técnica

- Precificação + BOM
- Tabelas Product, Material, CompositionItem
- Depende de Insumos e Produtos
- Alimenta requisição de materiais nos pedidos

### Módulo Pedidos (PDV + Fila + Histórico)

- createOrder / completeOrder / impressão / requisição
- Tabelas Order, OrderItem
- Depende de Produtos e da composição (Material)

### Módulo Arquivos

- Upload autenticado; leitura pública via proxy
- Vercel Blob

---

## 10. FUNÇÕES E MÉTODOS

Documentadas as funções de domínio. Helpers de UI (`cn`, componentes shadcn) omitidos.

### `requireAdmin()`

- **Local:** `lib/auth-guard.ts`
- **Objetivo:** garantir sessão admin em Server Actions
- **Parâmetros:** nenhum
- **Retorno:** session
- **Processo:** `auth()`; se sem user, throw Error
- **Efeitos:** nenhum no banco
- **Erros:** throw

### `authenticate(_prev, formData)`

- **Local:** `app/admin/login/actions.ts`
- **Objetivo:** login
- **Parâmetros:** FormData com email/password
- **Retorno:** `{ error }` ou redirect
- **Dependências:** `signIn` NextAuth
- **Efeitos:** cria sessão JWT

### `computeMaterialCost(line)`

- **Local:** `lib/pricing.ts`
- **Fórmula:** `(used / packageQuantity) * packagePrice` se packageQuantity > 0; senão 0
- **clamp:** valores não finitos ou ≤0 viram 0 (`clampNonNegative` só aceita `> 0`)

### `computeCompositionCost(materials)`

- Soma de `computeMaterialCost`

### `resolveSellingPrice(baseCost, percentRate, mode, strategyValue)` (interna)

Ver seção 11. Se denominador ≤ 0 → `{ price: 0, isValid: false }`.

### `computePricing(input)`

- **Local:** `lib/pricing.ts`
- **Objetivo:** resultado financeiro completo da ficha
- **Retorno:** `PricingResult` (custos, preço, lucro, margem, markup, rateio, isValid)
- **Sem I/O**

### `buildSimulation` / `buildProjection` / `buildAlerts`

- Simulação de markups padrão; volumes de venda; alertas de margem/embalagem/material dominante/taxas

### `computeAlloy(input)`

- **Local:** `lib/jewelry-math.ts`
- **Fórmulas:** ver §11
- Pura

### `wireCostFromAlloy(weightPerCm, cm, pricePerGram)`

- `weightG = wpc * cm`; `cost = weightG * ppg`; `pricePerCm = wpc * ppg`

### `distributeRoundRobin(total, slotCount)` / `buildStoneSequence` / `expandPattern`

- Distribuição e expansão de Ordens; ver §11

### `calculateMaterialsForOrder(orderItems)`

- **Local:** `lib/material-requisition.ts`
- **Objetivo:** agregar BOM × quantidade do pedido em listas de compra
- **Efeitos:** `console.log` de pedras se `NODE_ENV === "development"`

### `toWorkOrderData(order)`

- **Local:** `lib/receipt.ts`
- Monta payload de impressão + requisição

### `saveFichaTecnica(input)`

- **Local:** `app/admin/ficha-tecnica/actions.ts`
- Expande padrões no servidor; upsert Material por nome; merge unique product+material; reescreve CompositionItem; atualiza price/costPrice/strategy/totalWeightG (arredondados 2 casas)
- **Efeitos:** banco + revalidate paths/tag dashboard
- **Erro:** `{ error: "Não foi possível salvar a ficha técnica." }` + console.error

### `createOrder(input)` / `completeOrder(orderId)`

- **Local:** `app/admin/pedidos/actions.ts`
- Snapshot de preço/custo/título/SKU; status PENDING→COMPLETED
- Merge de itens duplicados no mesmo produto

### `saveAlloy` / `saveWire`

- Herança de custo; transação ao atualizar liga

### `getDashboardData`

- Cache 60s tag `dashboard`

### `handlePrint` / `canPrintOnCashierPc`

- `lib/print.ts` — `window.print()` se UA não for mobile

### `slugify(text)`

- `lib/slugify.ts` — NFD, remove acentos, lowercase, hífens

### `getBrasiliaStartOfDay` / `subtractDays`

- `lib/timezone.ts` — meia-noite Brasília como `YYYY-MM-DDT03:00:00.000Z` (UTC-3 fixo)

---

## 11. CÁLCULOS E FÓRMULAS

Unidades de dinheiro: **BRL**. Pesos: **g**, **ct**. Comprimento: **cm**. Quantidades: **un**, **par**, **mg**.

Valores inválidos/negativos em precificação são clampeados para 0 (`value > 0`).

### 11.1 Custo rateado do material

**Arquivo:** `lib/pricing.ts` → `computeMaterialCost`

```
custoLinha = (quantityUsed / packageQuantity) × packagePrice
```

Se `packageQuantity` clampeado = 0 → custo 0.  
Exemplo: lote R$ 45 / 100 un, usado 12 → 12/100 × 45 = R$ 5,40.

### 11.2 Custos adicionais

Para cada additionalCost:

- `kind === "fixed"`: soma em `additionalFixedCost`; se `isPackaging`, soma também `packagingCost`
- `kind === "percent"`: `additionalPercentRate += value/100`

```
baseCost = compositionCost + additionalFixedCost
```

Percentuais incidem sobre o **preço de venda** (dependência circular resolvida algebricamente).

### 11.3 Resolução do preço de venda

Seja `C = baseCost`, `t = additionalPercentRate` (fração), `v = strategyValue`.

**markupPercent** (v = markup % sobre custo):

```
m = v/100
den = 1 − t × (1 + m)
se den ≤ 0 → inválido
preço = (C × (1 + m)) / den
```

**marginPercent** (v = margem % sobre preço):

```
mg = v/100
se mg ≥ 1 ou den = 1 − t − mg ≤ 0 → inválido
preço = C / (1 − t − mg)
```

**fixedProfit** (v = lucro R$):

```
den = 1 − t
se den ≤ 0 → inválido
preço = (C + v) / den
```

**finalPrice** (v = preço informado):

```
preço = max(v, 0) se finito; isValid se v > 0
```

Depois:

```
additionalPercentCost = sellingPrice × t
totalCost = C + additionalPercentCost
netProfit = sellingPrice − totalCost
marginPercent = sellingPrice > 0 ? netProfit/sellingPrice × 100 : 0
markupPercent = totalCost > 0 ? netProfit/totalCost × 100 : 0
sharePercent da linha = compositionCost > 0 ? cost/compositionCost × 100 : 0
```

**Arredondamento ao salvar ficha:** `round2 = Math.round(value * 100) / 100` em `sellingPrice` e `totalCost` gravados no Product.

Cálculo em tela **não** arredonda até o save.

### 11.4 Simulação e projeção

`buildSimulation`: markups 50, 80, 100, 150, 200% com a mesma álgebra markupPercent.  
`buildProjection`: `revenue = sellingPrice × units`, `profit = profitPerUnit × units` para 5, 10, 25, 50.

### 11.5 Alertas (`buildAlerts`)

- Inválido → danger infinito
- preço ≤ 0 → info preencher composição
- lucro ≤ 0 → prejuízo
- margem < 30% → warning setor joalheiro
- margem ≥ 60% → success
- embalagem > 15% do custo total → warning
- um material > 50% da composição → warning
- taxas percentuais ≥ 20% → warning

### 11.6 Liga metálica

**Arquivo:** `lib/jewelry-math.ts` `computeAlloy`

```
purity ∈ [0, 1]
pureWeight = finalWeight × purity
alloyWeight = finalWeight × (1 − purity)
pureCost = pureWeight × pureMetalPricePerG
alloyCost = alloyWeight × alloyMetalPricePerG
totalCost = pureCost + alloyCost
costPerGram = purity × pureMetalPricePerG + (1 − purity) × alloyMetalPricePerG
```

`karatToPurity(k) = min(k/24, 1)` (se k>0)  
`purityToThousandths = round(purity × 1000)` (ex.: 0.75 → 750)

O ERP **não** usa `costPerGram` automaticamente: o admin informa `MetalAlloy.pricePerGram` (pode copiar o teórico na UI).

### 11.7 Fio / comprimento

```
weightG = weightPerCm × cm
cost = weightG × pricePerGram          // herança da liga
pricePerCm = weightPerCm × pricePerGram
lengthCost = pricePerCm × cm           // corrente (preço direto por cm)
lengthWeight = weightPerCm × cm
```

Na ficha, linha de **fio** com `unit === "cm"` e `weightPerCm > 0` é convertida para gramas antes de precificar/salvar (`resolveLineForPricing`).

### 11.8 Round-robin de pedras

```
base = floor(n / k)
remainder = n % k
slot i recebe base + 1 se i < remainder, senão base
```

Ex.: 17 pedras, 10 slots → `[2,2,2,2,2,2,2,1,1,1]`.

`buildStoneSequence` (legado do sequenciador): percorre `pattern[i % length]` até `total` — equivalente a round-robin por posição do padrão.  
`expandPattern` usa `distributeRoundRobin` nas **linhas de pedra da Ordem** (não na quantidade cadastrada da linha de pedra). A `quantity` da linha pedra na Ordem **não** entra na expansão de pedras.

Metais/correntes/fios da Ordem: `quantityUsed = item.quantity` (1 aplicação). Fio com peso: converte cm→g.

### 11.9 Totais de pedido

PDV / createOrder:

```
totalAmount = Σ (priceAtTime × quantity)
advancePayment = round(raw × 100) / 100
restante = max(0, total − advance)
```

Itens do mesmo productId são somados (`mergeItems`), quantity `max(1, floor(qty))`.

Lucro histórico/dashboard:

```
profit = Σ (priceAtTime − costAtTime) × quantity
```

### 11.10 Requisição de materiais

Por item do pedido, `used = quantityUsed × max(1, floor(orderQty))`.

- Gema: agrupa `base|cut|color|sizeMm`, soma quantidade
- Fio: **somente se** `unit === "cm"` **e** (attrProfile ou attrGauge); cm += used; grams += weightPerCm × used
- Corrente: `unit === "cm"` e attrMesh; idem
- Metal com `0 < purity < 1`:  
  `addMetal(pureName, used × purity)`  
  `addMetal(alloyName, used × (1 − purity))`
- Outro metal: gramas = used, label = attrMaterial ou nome
- Resto: others por nome+unidade

**Comportamento real:** fios salvos pela ficha com conversão para `unit: "g"` **não** entram na seção “fios” da requisição; caem em metais (sem decomposição, pois purity do fio não é setada na expansão). Ver §27.

### 11.11 Formatação de requisição

`trimNumber`: round a 3 casas via EPSILON; inteiros sem decimal.  
Grams max 2 casas; cm 1 casa; pedras 0 casas + `x`.

### 11.12 Tempo de espera do board

Minutos = floor((now − createdAt) / 60000). Card “atrasado” se ≥ 10 min. Relógio local atualiza a cada 30s.

### 11.13 ID de pedido exibido

`id.slice(-8).toUpperCase()`

---

## 12. REGRAS DE NEGÓCIO

### Autenticação

- Um único admin via env.
- Sem roles.
- Rotas `/admin` (exceto login) exigem sessão.

### Catálogo

- Só `isAvailable && !isDeleted`.
- SKU oculto na vitrine.
- Sem categoria com produtos visíveis → categoria some.

### Categorias

- Nome obrigatório; slug derivado; unique.
- Delete não apaga produtos (SetNull).

### Produtos

- Categoria obrigatória no create/update.
- Não cria produto se não existir nenhuma categoria (UI).
- Soft delete: some de listagens; histórico permanece; SKU liberado.
- Imagem vazia → placeholder AllAtiva.

### Insumos

- Fio exige liga existente.
- Atualizar liga atualiza fios vinculados (nome + pricePerCm).
- Seed de pedras: **uma vez**; se count > 0, bloqueio permanente.
- Delete de stone/chain/wire/alloy Restrict se referenciado em SupplyPatternItem (erro genérico na UI).
- Ordem: ≥1 item; kind exige o FK correspondente.

### Ficha técnica

- Save exige productId existente e não deletado.
- Expansão de Ordem no **servidor** é a fonte da verdade.
- Ordem só de pedras com totalStones ≤ 0 é ignorada; se houver metal/fio/corrente, ainda expande.
- Linhas avulsas com `sourcePatternId` são ignoradas no save (evita duplicar).
- Material unique por `name`; gemas recebem nome composto `root · cut · color · size` para não colidir cores.
- Unique BOM product+material → soma quantityUsed.
- Preço/custo do produto **são sobrescritos** pelo cálculo ao salvar.
- Custos adicionais (MO, taxa, etc.) **não são gravados**.
- Default estratégia ao criar form: markup 100%.

### Pedidos

- Cliente obrigatório.
- ≥1 item.
- Produtos devem estar available e not deleted no momento do create; senão erro.
- Snapshot de preço/custo/título/código.
- Sinal ≥ 0 e ≤ total (tolerância 0.001).
- Status só PENDING ou COMPLETED (não há cancelado/pago/produção).
- Concluir não valida impressão prévia.
- Histórico limitado a 100.
- Requisição usa composição **atual** do produto, não snapshot da BOM no pedido. ⚠️ Se a ficha mudar depois da venda, a reimpressão reflete a ficha nova.

### Dashboard

- Só COMPLETED.
- Cache 60s.
- Fuso Brasília para cortes de dia.

### Impressão

- Auto-print requer clique em “Iniciar Recepção” + desktop UA.
- Comentário no código: Chrome `--kiosk-printing` para silenciar diálogo.
- Mobile: não imprime.

### Seed

- `prisma/seed.ts` **apaga** Product, Category, Chain, Wire, MetalAlloy e recria demos. **Não apaga Stone** (trava permanente). ⚠️ Pode apagar dados reais se rodado em produção.

---

## 13. APIs E ENDPOINTS

Autenticação das rotas `/api/admin/*` e upload: cookie de sessão Auth.js (`auth()`). **Não** passam pelo middleware (matcher só `/admin/:path*`).

### `GET` / `POST` `/api/auth/[...nextauth]`

- NextAuth handlers.
- Headers/cookies padrão Auth.js.
- Usado pelo login e `signOut`.

### `POST` `/api/upload`

- **Auth:** sessão obrigatória (401).
- **Body:** multipart `file`
- **Regras:** jpeg/png/webp/gif; máx 4 MB; exige `BLOB_READ_WRITE_TOKEN` (500 se ausente)
- **Ação:** `put(..., { access: "private", addRandomSuffix: true })`
- **Resposta 200:** `{ url: "/api/file?pathname=..." }`
- **Erros:** 400 arquivo/formato/tamanho; 500 Blob
- **Uso:** ImageUpload no cadastro de produto

### `GET` `/api/file?pathname=`

- **Auth:** **nenhuma** (público)
- **Query:** pathname obrigatório
- **Ação:** `get` Blob private + ETag / 304
- **Cache-Control:** `public, max-age=0, must-revalidate`
- **Erros:** 400, 404, 500
- **Uso:** `<Image>` da vitrine e admin

### `GET` `/api/admin/orders/pending`

- **Auth:** 401 se não logado
- **Query:** `mode=count` → `{ count, orders: [] }`
- Default: lista PENDING `createdAt asc` **sem** compositionItems (array vazio)
- **500:** `{ error, count: 0, orders: [] }`
- **Uso:** badge 10s; board 8s

### `GET` `/api/admin/orders/[id]/work-order`

- **Auth:** 401
- **Params:** id
- **400** id vazio; **404** não encontrado; **500** erro montagem
- **200:** `WorkOrderData` (JSON)
- **Uso:** auto-print do board

### `POST` `/api/insumos/seed-pedras`

- **Auth:** 401
- **Body:** vazio
- **409:** já existem pedras
- **200:** `{ ok, insertedCount, message }`
- **500:** falha
- **Uso:** botão na aba Pedras

### APIs externas

| Serviço | Objetivo | Auth | Dados |
|---|---|---|---|
| Vercel Blob | armazenar imagens privadas | `BLOB_READ_WRITE_TOKEN` | arquivo in; pathname/stream out |
| Google Fonts | Manrope, Playfair | — | CSS/fontes |
| images.unsplash.com / placehold.co | imagens seed/placeholder | — | GET imagens |
| Instagram / allativa.com.br / wa.me | links do footer | — | navegação |

Não há webhooks de entrada.

### Server Actions (mutações, não REST)

| Função | Arquivo |
|---|---|
| authenticate | login/actions.ts |
| create/update/deleteCategory | categorias/actions.ts |
| create/update/deleteProduct, toggleProductAvailability | produtos/actions.ts |
| save/delete Stone, Chain, Wire, Alloy | insumos/actions.ts |
| save/deleteSupplyPattern | insumos/pattern-actions.ts |
| saveFichaTecnica | ficha-tecnica/actions.ts |
| createOrder, completeOrder | pedidos/actions.ts |

---

## 14. FLUXOS COMPLETOS

### 14.1 Login

1. Acessa `/admin` sem cookie → middleware → `/admin/login`
2. Preenche e-mail/senha → Entrar
3. `authenticate` → `signIn` → `authorize` compara env
4. JWT cookie → redirect `/admin`
5. Layout confirma sessão → Dashboard

### 14.2 Criar categoria

1. Nova Categoria → nome + ordem
2. `createCategory` → slugify → insert
3. Revalidate categorias, produtos, `/`
4. Dialog fecha no success

### 14.3 Criar produto

1. Precisa existir categoria
2. Sheet: dados + upload opcional (`/api/upload` → `/api/file?...`)
3. Zod FE + Zod BE
4. Insert Product
5. Aparece na listagem; se available, na vitrine e PDV

### 14.4 Popular pedras

1. Aba Pedras vazia → Popular
2. POST seed-pedras → count==0 → createMany 450
3. Segunda tentativa: 409 / toast de bloqueio

### 14.5 Cadastrar liga e fio (herança)

1. Liga com pricePerGram oficial
2. Fio escolhe liga → pricePerCm calculado no server
3. Update da liga → transação atualiza todos os fios

### 14.6 Salvar ficha técnica

1. Seleciona peça → reidrata BOM/ordens
2. Edita linhas / aplica biblioteca / adiciona ordem + totalStones
3. `computePricing` em tempo real (inclui expansão client para preview)
4. Salvar → server expande ordens de novo → upsert materials → replace composition → update product price/cost
5. Custos adicionais **não** vão ao banco
6. Revalidate ficha, produtos, home, dashboard

### 14.7 Venda no PDV

1. Filtra/clica peças → carrinho
2. Nome cliente; opcional vendedor/WhatsApp/sinal
3. Enviar → createOrder PENDING + snapshots
4. Mensagem de sucesso; carrinho limpo
5. Board (se recepção ativa) detecta ID novo → work-order → print
6. Concluir → COMPLETED → some da fila → entra no histórico/dashboard

### 14.8 Impressão térmica

1. HTML 80mm duas vias (cliente + requisição)
2. `window.print()` após ~500ms de render
3. afterprint ou fallback 4,5s libera a fila
4. Se print lançar, desativa recepção e pede novo clique

---

## 15. VALIDAÇÕES

### Frontend vs backend

| Campo | FE | BE | Mensagem típica |
|---|---|---|---|
| Login email/senha | required HTML | authorize null | E-mail ou senha inválidos |
| Categoria nome | required | trim vazio | Informe o nome da categoria |
| Produto título | Zod min 1 | Zod min 1 | Informe o título |
| Produto SKU | max 64 | max 64 + unique | código longo / já existe |
| Produto preço | min 1 string | number ≥ 0 | Informe o preço / válido |
| Produto categoria | min 1 | min 1 | Selecione uma categoria |
| Upload tipo/tamanho | client | server | Formato inválido / máx 4 MB |
| Pedra nome | form | Zod min 1 | Informe o nome da pedra |
| Fio liga | select | liga deve existir | Liga base não encontrada |
| Liga purity | 0–1 | 0–1 | |
| Ordem items | min 1, qty > 0 | superRefine FK | Adicione ao menos um insumo / Selecione a pedra… |
| PDV cliente | disabled se vazio | trim vazio | Informe o nome do cliente |
| PDV carrinho | disabled se vazio | items merge vazios | Adicione pelo menos uma peça |
| PDV sinal | parse + aviso | finite ≥0 ≤ total | sinal inválido / maior que total |
| Ficha save | productId no client | product existe | Selecione uma peça / Peça não encontrada |

Valores de preço aceitam vírgula no parse de produto (`parsePrice`). PDV sinal: remove `.` de milhar e troca `,` por `.`.

Invalid FE: mensagem sob o campo, submit bloqueado (RHF). Invalid BE: `state.error` / toast, sem crash.

---

## 16. ERROS E EXCEÇÕES

### Mensagens conhecidas (amostra)

- Não autorizado / Sessão expirada. Faça login novamente.
- E-mail ou senha inválidos.
- Já existe uma categoria com esse nome/slug.
- Já existe um produto com este código (Ref / SKU).
- Um ou mais produtos não estão disponíveis.
- Tabelas de pedidos não encontradas no banco… (Prisma P2021/P2022)
- Ação bloqueada: Existem pedras cadastradas…
- Armazenamento não configurado (Blob)
- Reimpressão disponível apenas no PC do caixa
- A impressão automática foi bloqueada pelo navegador…

### Tratamentos

- Muitas actions: try/catch genérico, return `{ error }` (sem stack ao cliente).
- `createOrder` / `saveFichaTecnica` / pending / work-order: `console.error`.
- Histórico: catch → mensagem de banco desatualizado, lista vazia.
- DeleteConfirmDialog: mostra `result.error` e não fecha.
- Optimistic complete no board: se falhar, restaura o card.

### Empty / loading

- Tabelas: “Nenhum … cadastrado / corresponde aos filtros”
- PDV: “Nenhuma peça encontrada” / “Clique em uma peça…”
- Board: spinner “Carregando pedidos…”; vazio “Nenhum pedido pendente”
- Dashboard gráficos: “Sem vendas concluídas neste mês”
- Upload: overlay spinner “Enviando imagem...”
- Login: “Entrando...”

### Timeout

⚠️ Não há timeout explícito de fetch/SWR além dos defaults. Polling continua enquanto a recepção estiver ativa.

### Logs

- Prisma: `error` sempre; `warn` em development (`lib/prisma.ts`)
- Requisição de pedras: console.log em development

---

## 17. IMPRESSÕES, ARQUIVOS E RELATÓRIOS

### Impressão térmica (não é PDF)

- CSS em `app/globals.css` `@media print`: `@page { size: 80mm auto }`, esconde o app, mostra `.work-order-receipt`.
- Componente: `OrderAndRequisitionReceipt` — via cliente (pedido, peças, total/sinal/falta) + corte + requisição agregada.
- Automática: `PedidosBoard` após iniciar recepção.
- Manual: Histórico (botão impressora).
- `lib/print.ts` documenta upgrade futuro QZ Tray + Epson ESC/POS — **não implementado**.

### Upload

- Produto: drag-and-drop / clique; store Blob **privada**; URL relativa `/api/file?pathname=`.

### Download / Excel / CSV / PDF / e-mail

**Não existem.**

### Relatórios

Dashboard é o único “relatório” (HTML). Sem exportação.

---

## 18. CONFIGURAÇÕES

### Variáveis de ambiente

Documentadas em `.env.example` e/ou usadas no código. **Valores reais omitidos.**

| Variável | Obrigatória para | Notas |
|---|---|---|
| `POSTGRES_PRISMA_URL` | Prisma runtime | schema.prisma `url` |
| `POSTGRES_URL_NON_POOLING` | migrations | schema `directUrl` |
| `DATABASE_URL` | citada só no `.env.example` | ⚠️ **não** está no schema Prisma |
| `AUTH_SECRET` | NextAuth | gerar com `npx auth secret` |
| `ADMIN_EMAIL` | login | comparado após trim/lower |
| `ADMIN_PASSWORD` | login | texto claro, trim |
| `BLOB_READ_WRITE_TOKEN` | upload | 500 se ausente no POST /api/upload |
| `NODE_ENV` | logs, dica de login, console requisition | |

### Portas / URLs

- Next default: `localhost:3000` (não hardcoded).
- `next.config.mjs` remotePatterns: `images.unsplash.com`, `placehold.co`, `*.public.blob.vercel-storage.com`.

### Produção vs desenvolvimento

- Login: defaults hardcoded só fora de production.
- Prisma log: warn+error em dev; só error em prod.
- `build` faz `db push --accept-data-loss`.

### Chaves

Nunca commitar `.env`. Não há secrets no código além dos **placeholders de UX** `admin@allativajoias.com` / `admin123` no form de **desenvolvimento**.

---

## 19. SEGURANÇA

### O que existe

- Proteção de `/admin` no Edge (middleware) + defesa no layout + `requireAdmin` nas actions + `auth()` nas APIs mutáveis.
- Upload: auth, allowlist MIME, limite 4 MB, Blob privada.
- Vitrine não seleciona SKU.
- Zod em várias mutações.
- `trustHost: true` (necessário em proxy/Vercel).

### Pontos sensíveis (documentar, não corrigir)

1. **Senha admin em texto claro na env**, comparação `===` (timing leak teórico).
2. **Sem hash, sem 2FA, sem lockout, sem rate limit no login.**
3. **Um único par de credenciais** compartilhado = sem auditoria por pessoa.
4. **Sessão JWT sem maxAge custom** — não expira em 24h.
5. **`/api/file` público:** quem conhecer o `pathname` lê a imagem. Pathnames têm suffix aleatório (mitiga enumeração).
6. **Middleware não cobre `/api/admin`** — a API se protege sozinha; uma rota nova sem `auth()` ficaria aberta.
7. **Credenciais de dev hardcoded no client bundle** se o build for `NODE_ENV=development` (em production os defaults são undefined; ainda assim as strings existem no source).
8. **Sem sanitização HTML explícita** além de React (XSS de texto tende a ser escapado). `imageUrl` vai para `next/image` — se um admin gravar URL arbitrária, só hosts do `remotePatterns` são otimizados; URL `/api/file?...` é same-origin.
9. **`prisma db push --accept-data-loss` no build.**
10. **Não há `tenant_id`.** O sistema é single-tenant. Se no futuro for multi-loja, todas as queries precisariam de isolamento.
11. **SQL raw** no dashboard usa parâmetros Prisma (`${since}`, `${BRASILIA_TZ}`) — não concatenação de input de usuário. Risco de injeção baixo **neste uso**.
12. CSRF: mutações via Server Actions (Next) e cookies SameSite típicos do Auth.js. ⚠️ detalhes exatos do cookie não estão customizados no repo.

---

## 20. DEPENDÊNCIAS ENTRE MÓDULOS

```
Categorias ← Produtos ← Ficha Técnica ← Insumos (Stone/Chain/Wire/Alloy/Pattern)
                ↑              ↓
              PDV          Material + CompositionItem
                ↓
              Pedidos PENDING → impressão (BOM atual) → COMPLETED
                ↓
         Dashboard / Histórico
```

| Alterar | Impacto |
|---|---|
| Categoria (slug/order) | âncoras da vitrine |
| Delete categoria | produtos “Sem categoria” |
| Preço produto | próximas vendas; pedidos antigos usam snapshot |
| Ficha (composição) | custo/preço do produto; **requisições futuras e reimpressões** |
| pricePerGram da liga | fios vinculados; fichas novas/reabertas se reaplicarem a liga |
| Soft delete produto | some PDV/vitrine; pedidos antigos Restrict no productId |
| Apagar Ordem | sourcePatternId SetNull; ficha reidrata folhas como avulsos se o pattern não estiver mais ativo na lista |
| Seed `db:seed` | **apaga** catálogo e insumos (exceto pedras) |

---

## 21. COMPONENTES REUTILIZÁVEIS

| Nome | Local | Função | Uso |
|---|---|---|---|
| AdminShell | `components/admin/admin-shell.tsx` | sidebar, logout, nav | layout protegido |
| ProductCard | `components/ProductCard.tsx` | card peça; `onClick` no PDV; `compact` | vitrine, PDV |
| ImageUpload | `image-upload.tsx` | upload 4MB | ProductFormSheet |
| DeleteConfirmDialog | `delete-confirm-dialog.tsx` | confirma exclusão | categorias, produtos, insumos, ordens |
| HelpButton | `help-button.tsx` | Sheet de ajuda (`help-content.ts`) | produtos, insumos, ficha, PDV |
| DataTableToolbar | | busca + reset + contagem | produtos, insumos, PDV, ficha |
| DataTableFacetedFilter | | multi-select com counts | vários |
| DataTablePagination | pageSize 25 | produtos, pedras | |
| PendingOrdersBadge | | SWR count | shell → Pedidos |
| OrderAndRequisitionReceipt | | HTML 80mm | board, histórico |
| OrderPeriodFilter | links `?period=` | histórico | |
| CatalogSalesTable | sort/search | dashboard | |
| dashboard-charts | Recharts | dashboard | |
| UI shadcn | `components/ui/*` | primitivos | todo admin |
| WireChainBuilder, StoneSequencer, AlloyBuilder | `piece-builders.tsx` | construtores da ficha antiga | **só** `ficha-tecnica-client.tsx` (não montado) |
| Header / Footer | layout | vitrine | |

Props relevantes estão nos próprios arquivos (interfaces exportadas: `ProductCardData`, `HelpButton`, `DeleteConfirmDialog`, etc.).

---

## 22. ESTADOS E FLUXO DE DADOS

### Global

Não há Context/Redux/Zustand.

### Cache servidor

- `unstable_cache` dashboard 60s, tag `dashboard`
- RSC `force-dynamic` na maioria das páginas admin e na home (sem cache estático de página)

### SWR

- Count: `/pending?mode=count`, 10s, revalidateOnFocus
- Lista: `/pending`, 8s, só se recepção ligada (`enabled`)

### Local

- Formulários: RHF
- PDV: useState carrinho/cliente
- Board: hiddenIds (optimistic), print queue refs, localStorage IDs impressos
- Ficha: form state; additionalCosts sobrevivem à troca de peça (`getValues("additionalCosts")`) mas **não** ao reload da página

### Persistência

PostgreSQL + cookie JWT + localStorage de impressão.

---

## 23. EVENTOS E AUTOMAÇÕES

| Mecanismo | Quando | O quê |
|---|---|---|
| SWR refreshInterval | 8s/10s | pedidos pendentes / badge |
| setInterval 30s | board ativo | atualiza “tempo de espera” |
| Auto-print | novos IDs não listados no localStorage | fetch work-order + print |
| afterprint | fim da impressão | próxima da fila |
| fallback 4s | se afterprint falhar | destrava fila |
| Toast 4–6s | insumos / board | some sozinho |
| IntersectionObserver | vitrine | scroll spy |
| revalidatePath/Tag | após mutações | RSC fresco |
| Cron / jobs / webhooks / websockets | — | **não existem** |
| Seed pedras | POST manual | uma vez |

Não há `afterprint` automático de concluir pedido.

---

## 24. INTEGRAÇÕES EXTERNAS

1. **PostgreSQL** (Neon/Vercel/Supabase conforme env) — persistência.
2. **Vercel Blob** — imagens.
3. **Auth.js** — sessão (biblioteca, não SaaS externo de IdP; sem Google/GitHub OAuth no código).
4. **Unsplash / placehold.co** — URLs de seed/placeholder.
5. **Links footer:** Instagram, site, WhatsApp, mailto — não são APIs.

Não há ERP fiscal, pagamento, correios, WhatsApp API oficial.

---

## 25. COMPORTAMENTOS IMPORTANTES

- **SKU** só admin/PDV.
- **Placeholder** de imagem se URL vazia.
- **Soft delete** de produto + SKU null.
- **sellerName** no banco é coluna `waiterName` (legado).
- **Custos adicionais da ficha não persistem.**
- **Save da ficha sobrescreve preço e custo** do produto mesmo que o usuário os tenha editado em Produtos.
- **Ordens:** pedras ignoram `quantity` da linha e usam totalStones round-robin.
- **Preview client vs save server:** ambos chamam `expandPattern`; o servidor recarrega o pattern do banco (`isActive: true`). Pattern inativo não expande no save.
- **Reidratar ficha:** agrupa sourcePatternId de volta em uma linha de Ordem se o pattern ainda existe na lista ativa.
- **Merge de Material pelo nome** + unique BOM.
- **Recepção pausada:** polling desligado; pedidos PENDING continuam no banco.
- **Auto-print marca o ID antes do fetch** para evitar duplicata Strict Mode; se o fetch falhar, remove o ID e tenta de novo.
- **Dashboard “mês” = 30 dias**; gráfico top 7 = mês civil.
- **getBrasiliaStartOfDay** assume UTC-3 fixo (`T03:00:00.000Z`). Brasil sem horário de verão atual: ok.
- **Histórico 100 registros.**
- **Requisição na reimpressão usa BOM atual**, não a da data da venda.
- **Dev login** pré-preenchido.
- **Chrome kiosk-printing** mencionado só em comentário.

---

## 26. LIMITAÇÕES E PONTOS DE ATENÇÃO

- Single-tenant, single-admin.
- Sem estoque físico (não decrementa insumos/produtos).
- Sem status rico de pedido (produção, enviado, cancelado, pago).
- Sem persistência de custos adicionais da ficha → preço salvo **inclui** esses custos naquele momento, mas ao reabrir a ficha o `computePricing` **não** os reconstitui; `pricingValue` + composição podem **não** reproduzir o mesmo `sellingPrice` se os adicionais eram necessários.
- Duas fontes de insumos: biblioteca (Stone…) vs `Material` da BOM.
- `db push --accept-data-loss` no build.
- `ficha-tecnica-client.tsx` e builders associados mortos em relação à rota.
- Paginação só client-side; insumos/produtos carregam **lista inteira** no RSC (não escala a milhões de linhas).
- Histórico take 100 sem paginação de servidor.
- Float para dinheiro (imprecisão IEEE; mitigação pontual no sinal com round 2 casas).
- Sem testes automatizados no `package.json`.
- README.md contém apenas `# CatalogoAllAtivaJoias`.

---

## 27. BUGS OU COMPORTAMENTOS SUSPEITOS

**Não corrigidos — apenas registrados.**

### 27.1 `ficha-tecnica-client.tsx` não utilizado

- **Local:** `app/admin/(protected)/ficha-tecnica/ficha-tecnica-client.tsx`
- **Observado:** `page.tsx` importa `FichaTecnicaForm`.
- **Por que suspeito:** código morto (~780 linhas) com WireChainBuilder/StoneSequencer/AlloyBuilder.
- **Impacto:** manutenção duplicada; alguém pode editar o arquivo errado.

### 27.2 `toggleProductAvailability` nunca chamada

- **Local:** `app/admin/produtos/actions.ts`
- **Impacto:** função morta; a tabela não tem switch rápido de disponibilidade.

### 27.3 Fios na requisição de materiais

- **Local:** `expandPattern` / `resolveLineForPricing` gravam fio em **gramas**; `isWire()` exige `unit === "cm"`.
- **Efeito:** seção “Fios” do recibo frequentemente vazia; gramas vão para “Metais” pelo nome da liga, **sem** decomposição por teor.
- **Impacto:** lista de compra do joalheiro pode não mostrar cm/bitola de fio.

### 27.4 KPI “Faturamento do Mês” vs Top 7

- KPI/catálogo/categorias: 30 dias.
- Top 7 e texto “mês civil atual”: mês calendário.
- **Impacto:** números do dashboard não são comparáveis entre cards.

### 27.5 `.env.example` vs schema Prisma

- Example: `DATABASE_URL`
- Schema: `POSTGRES_PRISMA_URL` + `POSTGRES_URL_NON_POOLING`
- **Impacto:** setup local falha se seguir só o example.

### 27.6 Custos adicionais vs preço persistido

- Save grava `sellingPrice` já com taxas/MO.
- Reload não traz additionalCosts.
- Recalcular e salvar de novo **sem** reabrir os adicionais **altera** preço/custo.

### 27.7 Seed destrutivo

- `prisma/seed.ts` deleteMany de produtos/categorias/correntes/fios/ligas.

### 27.8 Credenciais de desenvolvimento no source

- `login-form.tsx` strings `admin@allativajoias.com` / `admin123`.
- Podem não coincidir com `ADMIN_PASSWORD` real → form pré-preenchido que falha.

### 27.9 Pedidos sem cancelamento / COMPLETED irreversível na UI

- Não há action para voltar a PENDING ou excluir.

### 27.10 Unique `CompositionItem [productId, materialId]`

- Duas linhas visuais que upsertam o mesmo `Material.name` viram uma só (qty somada). Pode surpreender se o usuário quiser a mesma liga em duas linhas separadas.

### 27.11 `piece-builders` só no client morto

- Construtores ricos (sequenciador visual, liga demo) não aparecem na ficha atual (que usa selects por linha + ordens).

### 27.12 Help content vs UI atual

- `lib/help-content.ts` ainda descreve sequenciador/construtor de correntes como se estivessem na ficha; a tela viva é `ficha-tecnica-form`.

### 27.13 `prisma/dev.db`

- Arquivo SQLite no status git; schema é PostgreSQL. Possível artefato legado.

### 27.14 Comparação de senha e sessão 30 dias

- Divergem de uma política rígida de 24h/hash (não implementada).

---

## 28. O QUE NÃO DEVE SER ALTERADO

Ao evoluir o sistema, preservar (ou migrar com extremo cuidado):

1. **Álgebra de `resolveSellingPrice`** — taxas percentuais sobre o preço; mudar a fórmula altera todos os preços sugeridos.
2. **Snapshots de `OrderItem`** (`priceAtTime`, `costAtTime`, `productTitle`, `productCode`) — histórico financeiro independe do cadastro atual.
3. **Soft delete de Product** — hard delete quebra Restrict de OrderItem.
4. **Unique Material.name + upsert na ficha** — e o `resolveMaterialName` para gemas (evita bug de cor sobrescrita, comentado no próprio action).
5. **Expansão de Ordem no servidor** em `saveFichaTecnica` — não confiar só no client.
6. **Trava do seed de pedras** (`count > 0` → não inserir).
7. **Herança liga → `Wire.pricePerCm`** na atualização da liga (transação).
8. **Proxy `/api/file`** para Blob privada — URLs diretas do Blob não funcionam.
9. **Separação `auth.config.ts` (Edge) vs Prisma** — importar Prisma no middleware quebra o Edge.
10. **Mapa `sellerName` → coluna `waiterName`** — rename descuidado quebra SQL.
11. **CSS `@media print` 80mm** — layout do comprovante.
12. **Callback `authorized` do NextAuth** — login vs resto do admin.

---

## 29. MAPA GERAL DO SISTEMA

```
ALLATIVA JOIAS
│
├── Vitrine pública (/)
│   ├── Header + scroll-spy
│   ├── Seções por Category
│   └── ProductCard (sem SKU)
│
├── Autenticação
│   ├── /admin/login (Credentials)
│   ├── JWT cookie
│   ├── middleware /admin/:path*
│   └── requireAdmin / auth()
│
├── Dashboard (/admin)
│   ├── KPIs (dia / 7d / 30d)
│   ├── Gráficos
│   └── Catálogo × vendas 30d
│
├── Categorias (/admin/categorias)
│
├── Produtos (/admin/produtos)
│   ├── Sheet CRUD + ImageUpload
│   └── Soft delete
│
├── Insumos (/admin/insumos)
│   ├── Pedras (+ seed 450)
│   ├── Correntes
│   ├── Fios (herança liga)
│   ├── Ligas (pricePerGram oficial)
│   └── Ordens/Kits
│
├── Ficha Técnica (/admin/ficha-tecnica)
│   ├── Linhas avulsas + Ordens
│   ├── computePricing
│   └── save → Material + CompositionItem + Product.price/cost
│
├── Pedidos
│   ├── PDV (/admin/pedidos/novo)
│   ├── Fila (/admin/pedidos) + auto-print
│   └── Histórico (/admin/pedidos/historico)
│
├── Banco PostgreSQL (Prisma)
│   ├── Category, Product
│   ├── Stone, Chain, Wire, MetalAlloy
│   ├── SupplyPattern, SupplyPatternItem
│   ├── Material, CompositionItem
│   └── Order, OrderItem
│
├── APIs
│   ├── /api/auth/[...nextauth]
│   ├── /api/upload  /  /api/file
│   ├── /api/admin/orders/pending
│   ├── /api/admin/orders/[id]/work-order
│   └── /api/insumos/seed-pedras
│
└── Integrações
    ├── Vercel Blob
    └── PostgreSQL (Vercel/Neon/etc.)
```

---

## 30. CONTEXTO PARA IA

### O que é o sistema

ERP + vitrine da joalheria AllAtiva: catálogo público sem checkout, painel admin com um único login (`ADMIN_EMAIL`/`ADMIN_PASSWORD`), precificação de joias, PDV e impressão térmica de comprovante + lista de compra de insumos.

### Como funciona

Next.js 15 App Router, React 19, Prisma/PostgreSQL, Auth.js v5 JWT Credentials, Server Actions para mutações, poucos Route Handlers. Sem filas, e-mail, PDF, estoque ou multi-usuário.

### Principais módulos

Categorias, Produtos, Insumos (biblioteca + ordens), Ficha Técnica, PDV, Fila de pedidos, Histórico, Dashboard, Upload Blob.

### Principais regras

- Soft delete de produto; snapshot na venda.
- Ficha grava BOM em `Material`/`CompositionItem` e **sobrescreve** `Product.price` e `costPrice`.
- Ordens: pedras por round-robin de `totalStones`; outros insumos pela quantity da linha.
- Seed de pedras irreversível se já houver registros.
- Pedido nasce PENDING e só vai a COMPLETED.
- Requisição de materiais lê a ficha **atual** do produto.

### Banco

12 models: Category, Product, Material, CompositionItem, Stone, Chain, Wire, MetalAlloy, SupplyPattern, SupplyPatternItem, Order, OrderItem.  
Env de conexão: `POSTGRES_PRISMA_URL` / `POSTGRES_URL_NON_POOLING`, não `DATABASE_URL` do example.

### APIs

Auth NextAuth; upload/file Blob; pending orders; work-order; seed-pedras. Resto é Server Action.

### Autenticação

Um admin. Sem RBAC. Middleware só em `/admin/:path*`. APIs admin autenticam internamente.

### Cálculos importantes

- Custo material: `(usado/lote)*preçoLote`
- Preço com taxas % sobre venda: fórmulas em `lib/pricing.ts` (`markupPercent`, `marginPercent`, `fixedProfit`, `finalPrice`)
- Liga: `P` nobre + `(1-P)` pré-liga; oficial = `pricePerGram` cadastrado
- Fio: `g = cm × weightPerCm`; custo `g × pricePerGram`
- Pedras ordem: `distributeRoundRobin`
- Liga na requisição: decompõe gramas por `purity`

### Dependências críticas

Produto depende de Categoria. Ficha depende de Produto + biblioteca. Pedido depende de Produto disponível. Impressão/requisição depende da composição. Dashboard depende de COMPLETED + snapshots.

### Cuidados ao modificar

- Não quebrar álgebra de preço nem snapshots de pedido.
- Não hard-delete de Product com vendas.
- Recalcular expansão de Pattern no servidor.
- Não importar Prisma no middleware.
- Ficha ativa é `ficha-tecnica-form.tsx`, não `ficha-tecnica-client.tsx`.
- Custos adicionais não persistem — qualquer recálculo precisa decidir se isso é desejado.
- `db push --accept-data-loss` é perigoso.
- Testar requisição de fios (unidade cm vs g) antes de mudar BOM.
- Preservar unique de gema por nome composto (`resolveMaterialName`).

### Arquivos âncora para implementar features

| Tema | Começar por |
|---|---|
| Auth | `auth.config.ts`, `middleware.ts`, `lib/auth-guard.ts` |
| Precificação | `lib/pricing.ts` |
| Ourivesaria | `lib/jewelry-math.ts`, `lib/supply-pattern-expand.ts` |
| Requisição | `lib/material-requisition.ts`, `lib/receipt.ts` |
| Schema | `prisma/schema.prisma` |
| Pedidos | `app/admin/pedidos/actions.ts`, `pdv-client.tsx`, `pedidos-board.tsx` |
| Ficha | `ficha-tecnica-form.tsx`, `app/admin/ficha-tecnica/actions.ts` |

---

*Fim da documentação gerada a partir do código-fonte. Nenhuma alteração foi feita em outros arquivos do projeto.*
