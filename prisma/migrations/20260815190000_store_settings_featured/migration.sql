-- AlterTable: destaque de produtos na vitrine (default seguro para registros existentes)
ALTER TABLE "Product" ADD COLUMN "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: configuração global da vitrine (singleton)
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroTitle" TEXT NOT NULL DEFAULT '',
    "heroSubtitle" TEXT NOT NULL DEFAULT '',
    "footerText" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: destaques por categoria + filtros de publicação
CREATE INDEX "Product_categoryId_isFeatured_isDeleted_isAvailable_idx" ON "Product"("categoryId", "isFeatured", "isDeleted", "isAvailable");
