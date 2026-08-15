-- Fase 3: custos adicionais da ficha técnica (mão de obra, taxas, etc.)

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

CREATE INDEX "ProductAdditionalCost_productId_sortOrder_idx" ON "ProductAdditionalCost"("productId", "sortOrder");

ALTER TABLE "ProductAdditionalCost"
  ADD CONSTRAINT "ProductAdditionalCost_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
