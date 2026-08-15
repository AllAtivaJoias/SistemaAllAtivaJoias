-- Biblioteca de Prompts de IA: taxonomia + prompts + tags + busca trigram.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE "AiPromptCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPromptPurpose" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptPurpose_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPromptTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPrompt" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "purposeId" TEXT NOT NULL,
    "tool" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'pt-BR',
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPrompt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiPromptOnTag" (
    "promptId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "AiPromptOnTag_pkey" PRIMARY KEY ("promptId","tagId")
);

CREATE UNIQUE INDEX "AiPromptCategory_slug_key" ON "AiPromptCategory"("slug");
CREATE INDEX "AiPromptCategory_order_idx" ON "AiPromptCategory"("order");
CREATE INDEX "AiPromptCategory_isActive_idx" ON "AiPromptCategory"("isActive");

CREATE UNIQUE INDEX "AiPromptPurpose_slug_key" ON "AiPromptPurpose"("slug");
CREATE INDEX "AiPromptPurpose_order_idx" ON "AiPromptPurpose"("order");
CREATE INDEX "AiPromptPurpose_isActive_idx" ON "AiPromptPurpose"("isActive");

CREATE UNIQUE INDEX "AiPromptTag_slug_key" ON "AiPromptTag"("slug");

CREATE INDEX "AiPrompt_categoryId_idx" ON "AiPrompt"("categoryId");
CREATE INDEX "AiPrompt_purposeId_idx" ON "AiPrompt"("purposeId");
CREATE INDEX "AiPrompt_createdAt_idx" ON "AiPrompt"("createdAt");
CREATE INDEX "AiPrompt_updatedAt_idx" ON "AiPrompt"("updatedAt");
CREATE INDEX "AiPrompt_isFavorite_idx" ON "AiPrompt"("isFavorite");
CREATE INDEX "AiPrompt_isActive_idx" ON "AiPrompt"("isActive");
CREATE INDEX "AiPrompt_tool_idx" ON "AiPrompt"("tool");
CREATE INDEX "AiPrompt_usageCount_idx" ON "AiPrompt"("usageCount");
CREATE INDEX "AiPrompt_authorId_idx" ON "AiPrompt"("authorId");
CREATE INDEX "AiPrompt_isActive_createdAt_idx" ON "AiPrompt"("isActive", "createdAt");
CREATE INDEX "AiPrompt_isActive_isFavorite_createdAt_idx" ON "AiPrompt"("isActive", "isFavorite", "createdAt");

CREATE INDEX "AiPrompt_title_trgm_idx" ON "AiPrompt" USING gin ("title" gin_trgm_ops);
CREATE INDEX "AiPrompt_description_trgm_idx" ON "AiPrompt" USING gin ("description" gin_trgm_ops);
CREATE INDEX "AiPrompt_content_trgm_idx" ON "AiPrompt" USING gin ("content" gin_trgm_ops);

CREATE INDEX "AiPromptOnTag_tagId_idx" ON "AiPromptOnTag"("tagId");

ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AiPromptCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "AiPromptPurpose"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AiPrompt" ADD CONSTRAINT "AiPrompt_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiPromptOnTag" ADD CONSTRAINT "AiPromptOnTag_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "AiPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiPromptOnTag" ADD CONSTRAINT "AiPromptOnTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "AiPromptTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AiPromptCategory" ("id", "name", "slug", "description", "isActive", "order", "createdAt", "updatedAt") VALUES
('aic_geral', 'Geral', 'geral', 'Prompts de uso geral, institucionais ou mistos.', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_aneis', 'Anéis', 'aneis', 'Anéis e solitários.', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_aliancas', 'Alianças', 'aliancas', 'Alianças e pares.', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_brincos', 'Brincos', 'brincos', 'Brincos e argolas.', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_colares', 'Colares', 'colares', 'Colares e correntes com pingente.', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_gargantilhas', 'Gargantilhas', 'gargantilhas', 'Gargantilhas e chokers.', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_pulseiras', 'Pulseiras', 'pulseiras', 'Pulseiras e braceletes.', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_pingentes', 'Pingentes', 'pingentes', 'Pingentes avulsos.', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_pedras', 'Pedras/Gemas', 'pedras-gemas', 'Pedras, gemas e cravação.', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_relogios', 'Relógios', 'relogios', 'Relógios e pulseiras de relógio.', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_embalagens', 'Embalagens', 'embalagens', 'Estojos, embalagens e unboxing.', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aic_fotografia', 'Fotografia', 'fotografia', 'Direção de fotografia e estúdio.', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "AiPromptPurpose" ("id", "name", "slug", "description", "isActive", "order", "createdAt", "updatedAt") VALUES
('aip_imagem_catalogo', 'Imagem de Catálogo', 'imagem-de-catalogo', 'Fotos profissionais para catálogo.', true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_imagem_produto', 'Imagem de Produto', 'imagem-de-produto', 'Produto isolado para e-commerce.', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_marketing', 'Marketing', 'marketing', 'Peças e textos de marketing.', true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_redes_sociais', 'Redes Sociais', 'redes-sociais', 'Posts, stories e reels.', true, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_promocao', 'Promoção', 'promocao', 'Ofertas e campanhas promocionais.', true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_publicidade', 'Publicidade', 'publicidade', 'Anúncios pagos e banners.', true, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_descricao', 'Descrição de Produto', 'descricao-de-produto', 'Textos de ficha e vitrine.', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_ecommerce', 'E-commerce', 'e-commerce', 'Conteúdo para loja online.', true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_campanha', 'Campanha', 'campanha', 'Campanhas sazonais e institucionais.', true, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_banner', 'Banner', 'banner', 'Banners e peças horizontais.', true, 9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_fotografia', 'Fotografia', 'fotografia', 'Briefing de foto e iluminação.', true, 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_seo', 'SEO', 'seo', 'Títulos, meta e palavras-chave.', true, 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aip_atendimento', 'Atendimento', 'atendimento', 'Respostas e scripts de atendimento.', true, 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
