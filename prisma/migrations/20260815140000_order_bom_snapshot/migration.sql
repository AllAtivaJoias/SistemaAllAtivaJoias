-- Fase 4: snapshot imutável da BOM no item do pedido.

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

CREATE INDEX "OrderItemBomLine_orderItemId_idx" ON "OrderItemBomLine"("orderItemId");

ALTER TABLE "OrderItemBomLine"
  ADD CONSTRAINT "OrderItemBomLine_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
