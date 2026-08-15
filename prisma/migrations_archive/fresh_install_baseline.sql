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
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
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

