-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroSubtitle" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "productCode" TEXT,
    "totalWeightG" DECIMAL(14,4),
    "pricingStrategy" TEXT,
    "pricingValue" DECIMAL(14,4),
    "version" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAdditionalCost" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "isPackaging" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAdditionalCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'metal',
    "purchasePrice" DECIMAL(14,4) NOT NULL,
    "purchaseQuantity" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "attrCut" TEXT,
    "attrColor" TEXT,
    "attrSizeMm" DECIMAL(14,4),
    "attrLengthMm" DECIMAL(14,4),
    "attrMaterial" TEXT,
    "attrMesh" TEXT,
    "attrProfile" TEXT,
    "attrGauge" DECIMAL(14,4),
    "weightPerCm" DECIMAL(14,4),
    "purity" DECIMAL(8,6),
    "pureMetalName" TEXT,
    "alloyMetalName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompositionItem" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantityUsed" DECIMAL(14,4) NOT NULL,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
    "lineKind" TEXT NOT NULL DEFAULT 'outro',
    "sourcePatternId" TEXT,
    "patternQty" DECIMAL(14,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompositionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cut" TEXT NOT NULL DEFAULT 'brilhante',
    "color" TEXT NOT NULL DEFAULT 'branco',
    "widthMm" DECIMAL(14,4),
    "lengthMm" DECIMAL(14,4),
    "weightCt" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mesh" TEXT NOT NULL DEFAULT 'veneziana',
    "material" TEXT NOT NULL DEFAULT 'Ouro 18k',
    "thicknessMm" DECIMAL(14,4),
    "weightPerCm" DECIMAL(14,4),
    "pricePerCm" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wire" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" TEXT NOT NULL DEFAULT 'Ouro 18k',
    "profile" TEXT NOT NULL DEFAULT 'redondo',
    "gauge" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "widthMm" DECIMAL(14,4),
    "weightPerCm" DECIMAL(14,4),
    "pricePerCm" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "alloyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetalAlloy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purity" DECIMAL(8,6) NOT NULL DEFAULT 0.75,
    "pureMetalName" TEXT NOT NULL DEFAULT 'Ouro 24k',
    "pureMetalPricePerG" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "alloyMetalName" TEXT NOT NULL DEFAULT 'Pr├®-liga (Prata/Cobre)',
    "alloyMetalPricePerG" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "pricePerGram" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetalAlloy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplyPatternItem" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "itemKind" TEXT NOT NULL,
    "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
    "quantity" DECIMAL(14,4) NOT NULL,
    "stoneId" TEXT,
    "alloyId" TEXT,
    "chainId" TEXT,
    "wireId" TEXT,
    "notes" TEXT,

    CONSTRAINT "SupplyPatternItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "waiterName" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "advancePayment" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtTime" DECIMAL(14,2) NOT NULL,
    "costAtTime" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "productTitle" TEXT NOT NULL,
    "productCode" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItemBomLine" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantityUsed" DECIMAL(14,4) NOT NULL,
    "attrCut" TEXT,
    "attrColor" TEXT,
    "attrSizeMm" DECIMAL(14,4),
    "attrLengthMm" DECIMAL(14,4),
    "attrMaterial" TEXT,
    "attrMesh" TEXT,
    "attrProfile" TEXT,
    "attrGauge" DECIMAL(14,4),
    "weightPerCm" DECIMAL(14,4),
    "purity" DECIMAL(8,6),
    "pureMetalName" TEXT,
    "alloyMetalName" TEXT,

    CONSTRAINT "OrderItemBomLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "LoginAttempt"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_order_idx" ON "Category"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_title_idx" ON "Product"("title");

-- CreateIndex
CREATE INDEX "Product_isAvailable_idx" ON "Product"("isAvailable");

-- CreateIndex
CREATE INDEX "Product_isDeleted_idx" ON "Product"("isDeleted");

-- CreateIndex
CREATE INDEX "Product_isDeleted_isAvailable_idx" ON "Product"("isDeleted", "isAvailable");

-- CreateIndex
CREATE INDEX "Product_categoryId_title_idx" ON "Product"("categoryId", "title");

-- CreateIndex
CREATE INDEX "Product_categoryId_isFeatured_isDeleted_isAvailable_idx" ON "Product"("categoryId", "isFeatured", "isDeleted", "isAvailable");

-- CreateIndex
CREATE INDEX "ProductAdditionalCost_productId_sortOrder_idx" ON "ProductAdditionalCost"("productId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Material_name_key" ON "Material"("name");

-- CreateIndex
CREATE INDEX "Material_type_idx" ON "Material"("type");

-- CreateIndex
CREATE INDEX "Material_attrCut_idx" ON "Material"("attrCut");

-- CreateIndex
CREATE INDEX "Material_attrColor_idx" ON "Material"("attrColor");

-- CreateIndex
CREATE INDEX "Material_attrMaterial_idx" ON "Material"("attrMaterial");

-- CreateIndex
CREATE INDEX "Material_attrProfile_idx" ON "Material"("attrProfile");

-- CreateIndex
CREATE INDEX "CompositionItem_productId_idx" ON "CompositionItem"("productId");

-- CreateIndex
CREATE INDEX "CompositionItem_materialId_idx" ON "CompositionItem"("materialId");

-- CreateIndex
CREATE INDEX "CompositionItem_productId_sequenceOrder_idx" ON "CompositionItem"("productId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "CompositionItem_sourcePatternId_idx" ON "CompositionItem"("sourcePatternId");

-- CreateIndex
CREATE UNIQUE INDEX "CompositionItem_productId_materialId_key" ON "CompositionItem"("productId", "materialId");

-- CreateIndex
CREATE INDEX "Stone_name_idx" ON "Stone"("name");

-- CreateIndex
CREATE INDEX "Stone_cut_idx" ON "Stone"("cut");

-- CreateIndex
CREATE INDEX "Stone_color_idx" ON "Stone"("color");

-- CreateIndex
CREATE INDEX "Stone_widthMm_idx" ON "Stone"("widthMm");

-- CreateIndex
CREATE INDEX "Stone_cut_color_widthMm_lengthMm_idx" ON "Stone"("cut", "color", "widthMm", "lengthMm");

CREATE UNIQUE INDEX "Stone_identity_key"
  ON "Stone" (LOWER("cut"), LOWER("color"), "widthMm", COALESCE("lengthMm", -1));

-- CreateIndex
CREATE INDEX "Chain_name_idx" ON "Chain"("name");

-- CreateIndex
CREATE INDEX "Chain_mesh_idx" ON "Chain"("mesh");

-- CreateIndex
CREATE INDEX "Chain_material_idx" ON "Chain"("material");

-- CreateIndex
CREATE INDEX "Wire_name_idx" ON "Wire"("name");

-- CreateIndex
CREATE INDEX "Wire_profile_idx" ON "Wire"("profile");

-- CreateIndex
CREATE INDEX "Wire_material_idx" ON "Wire"("material");

-- CreateIndex
CREATE INDEX "Wire_gauge_idx" ON "Wire"("gauge");

-- CreateIndex
CREATE INDEX "Wire_alloyId_idx" ON "Wire"("alloyId");

-- CreateIndex
CREATE INDEX "Wire_profile_material_gauge_idx" ON "Wire"("profile", "material", "gauge");

-- CreateIndex
CREATE INDEX "MetalAlloy_name_idx" ON "MetalAlloy"("name");

-- CreateIndex
CREATE INDEX "SupplyPattern_name_idx" ON "SupplyPattern"("name");

-- CreateIndex
CREATE INDEX "SupplyPattern_isActive_idx" ON "SupplyPattern"("isActive");

-- CreateIndex
CREATE INDEX "SupplyPatternItem_patternId_sequenceOrder_idx" ON "SupplyPatternItem"("patternId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "SupplyPatternItem_stoneId_idx" ON "SupplyPatternItem"("stoneId");

-- CreateIndex
CREATE INDEX "SupplyPatternItem_alloyId_idx" ON "SupplyPatternItem"("alloyId");

-- CreateIndex
CREATE INDEX "SupplyPatternItem_chainId_idx" ON "SupplyPatternItem"("chainId");

-- CreateIndex
CREATE INDEX "SupplyPatternItem_wireId_idx" ON "SupplyPatternItem"("wireId");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE INDEX "OrderItemBomLine_orderItemId_idx" ON "OrderItemBomLine"("orderItemId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAdditionalCost" ADD CONSTRAINT "ProductAdditionalCost_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionItem" ADD CONSTRAINT "CompositionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionItem" ADD CONSTRAINT "CompositionItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompositionItem" ADD CONSTRAINT "CompositionItem_sourcePatternId_fkey" FOREIGN KEY ("sourcePatternId") REFERENCES "SupplyPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wire" ADD CONSTRAINT "Wire_alloyId_fkey" FOREIGN KEY ("alloyId") REFERENCES "MetalAlloy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyPatternItem" ADD CONSTRAINT "SupplyPatternItem_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "SupplyPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyPatternItem" ADD CONSTRAINT "SupplyPatternItem_stoneId_fkey" FOREIGN KEY ("stoneId") REFERENCES "Stone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyPatternItem" ADD CONSTRAINT "SupplyPatternItem_alloyId_fkey" FOREIGN KEY ("alloyId") REFERENCES "MetalAlloy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyPatternItem" ADD CONSTRAINT "SupplyPatternItem_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyPatternItem" ADD CONSTRAINT "SupplyPatternItem_wireId_fkey" FOREIGN KEY ("wireId") REFERENCES "Wire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemBomLine" ADD CONSTRAINT "OrderItemBomLine_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "AiPromptTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiPromptTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "AiPromptOnTag" (
    "promptId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "AiPromptOnTag_pkey" PRIMARY KEY ("promptId","tagId")
);

-- CreateIndex
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

-- AddForeignKey
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

-- AppSettings + PrintProfile
-- Configuracoes do ERP + perfis de impressao (recibo 80mm / ordem de producao A4).

CREATE TYPE "PrintFormat" AS ENUM ('THERMAL_80MM', 'A4');

CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeName" TEXT NOT NULL DEFAULT 'AllAtiva Joias',
    "legalName" TEXT NOT NULL DEFAULT '',
    "tradeName" TEXT NOT NULL DEFAULT '',
    "documentNumber" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "instagram" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "addressNumber" TEXT NOT NULL DEFAULT '',
    "complement" TEXT NOT NULL DEFAULT '',
    "neighborhood" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "state" TEXT NOT NULL DEFAULT '',
    "postalCode" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT 'BR',
    "businessHours" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "logoDarkUrl" TEXT NOT NULL DEFAULT '',
    "faviconUrl" TEXT NOT NULL DEFAULT '',
    "primaryColor" TEXT NOT NULL DEFAULT '#034742',
    "defaultPrintFormat" "PrintFormat" NOT NULL DEFAULT 'THERMAL_80MM',
    "pricingDefaultMode" TEXT NOT NULL DEFAULT 'markupPercent',
    "pricingDefaultValue" DECIMAL(14,4) NOT NULL DEFAULT 100,
    "weightDecimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "productionDefaultDueDays" INTEGER NOT NULL DEFAULT 15,
    "productionShowProcessChecklist" BOOLEAN NOT NULL DEFAULT true,
    "productionTrackLoss" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrintProfile" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "format" "PrintFormat" NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showPrices" BOOLEAN NOT NULL DEFAULT true,
    "showCustomerData" BOOLEAN NOT NULL DEFAULT true,
    "showMaterials" BOOLEAN NOT NULL DEFAULT true,
    "showStoreHeader" BOOLEAN NOT NULL DEFAULT true,
    "showOrderNumber" BOOLEAN NOT NULL DEFAULT true,
    "showDate" BOOLEAN NOT NULL DEFAULT true,
    "showSeller" BOOLEAN NOT NULL DEFAULT true,
    "showNotes" BOOLEAN NOT NULL DEFAULT true,
    "showTotals" BOOLEAN NOT NULL DEFAULT true,
    "showPayment" BOOLEAN NOT NULL DEFAULT true,
    "showProductionData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrintProfile_code_key" ON "PrintProfile"("code");
CREATE INDEX "PrintProfile_format_isActive_idx" ON "PrintProfile"("format", "isActive");
CREATE INDEX "PrintProfile_kind_idx" ON "PrintProfile"("kind");

INSERT INTO "AppSettings" (
  "id", "storeName", "email", "phone", "whatsapp", "website", "instagram",
  "businessHours", "defaultPrintFormat", "pricingDefaultMode", "pricingDefaultValue",
  "weightDecimalPlaces", "productionDefaultDueDays", "productionShowProcessChecklist",
  "productionTrackLoss", "createdAt", "updatedAt"
) VALUES (
  'singleton',
  'AllAtiva Joias',
  'contato@allativa.com.br',
  '11936211188',
  '11936211188',
  'https://www.allativa.com.br/',
  'allativajoias',
  'Seg. à Sex. 8h às 16h',
  'THERMAL_80MM',
  'markupPercent',
  100,
  2,
  15,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

INSERT INTO "PrintProfile" (
  "id", "code", "name", "kind", "format", "isSystem", "isActive",
  "showPrices", "showCustomerData", "showMaterials", "showStoreHeader",
  "showOrderNumber", "showDate", "showSeller", "showNotes", "showTotals",
  "showPayment", "showProductionData", "createdAt", "updatedAt"
) VALUES
(
  'pp_receipt_thermal',
  'receipt_thermal',
  'Recibo de venda (80mm)',
  'RECEIPT',
  'THERMAL_80MM',
  true, true,
  true, true, true, true,
  true, true, true, true, true,
  true, false,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
  'pp_production_a4',
  'production_a4',
  'Ordem de Produção (A4)',
  'PRODUCTION_ORDER',
  'A4',
  true, true,
  false, true, true, true,
  true, true, true, true, false,
  false, true,
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
