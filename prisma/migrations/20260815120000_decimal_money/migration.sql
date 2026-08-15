-- Fase 1: Float → Decimal. Conversão com ROUND para reduzir artefatos binários.
-- Não remove colunas. Não apaga dados.

-- Product
ALTER TABLE "Product" ALTER COLUMN "price" TYPE DECIMAL(14,2) USING ROUND("price"::numeric, 2);
ALTER TABLE "Product" ALTER COLUMN "costPrice" TYPE DECIMAL(14,2) USING ROUND("costPrice"::numeric, 2);
ALTER TABLE "Product" ALTER COLUMN "totalWeightG" TYPE DECIMAL(14,4) USING ROUND("totalWeightG"::numeric, 4);
ALTER TABLE "Product" ALTER COLUMN "pricingValue" TYPE DECIMAL(14,4) USING ROUND("pricingValue"::numeric, 4);

-- Material
ALTER TABLE "Material" ALTER COLUMN "purchasePrice" TYPE DECIMAL(14,4) USING ROUND("purchasePrice"::numeric, 4);
ALTER TABLE "Material" ALTER COLUMN "purchaseQuantity" TYPE DECIMAL(14,4) USING ROUND("purchaseQuantity"::numeric, 4);
ALTER TABLE "Material" ALTER COLUMN "attrSizeMm" TYPE DECIMAL(14,4) USING ROUND("attrSizeMm"::numeric, 4);
ALTER TABLE "Material" ALTER COLUMN "attrGauge" TYPE DECIMAL(14,4) USING ROUND("attrGauge"::numeric, 4);
ALTER TABLE "Material" ALTER COLUMN "weightPerCm" TYPE DECIMAL(14,4) USING ROUND("weightPerCm"::numeric, 4);
ALTER TABLE "Material" ALTER COLUMN "purity" TYPE DECIMAL(8,6) USING ROUND("purity"::numeric, 6);

-- CompositionItem
ALTER TABLE "CompositionItem" ALTER COLUMN "quantityUsed" TYPE DECIMAL(14,4) USING ROUND("quantityUsed"::numeric, 4);
ALTER TABLE "CompositionItem" ALTER COLUMN "patternQty" TYPE DECIMAL(14,4) USING ROUND("patternQty"::numeric, 4);

-- Stone
ALTER TABLE "Stone" ALTER COLUMN "sizeMm" TYPE DECIMAL(14,4) USING ROUND("sizeMm"::numeric, 4);
ALTER TABLE "Stone" ALTER COLUMN "weightCt" TYPE DECIMAL(14,4) USING ROUND("weightCt"::numeric, 4);
ALTER TABLE "Stone" ALTER COLUMN "unitPrice" TYPE DECIMAL(14,4) USING ROUND("unitPrice"::numeric, 4);

-- Chain
ALTER TABLE "Chain" ALTER COLUMN "thicknessMm" TYPE DECIMAL(14,4) USING ROUND("thicknessMm"::numeric, 4);
ALTER TABLE "Chain" ALTER COLUMN "weightPerCm" TYPE DECIMAL(14,4) USING ROUND("weightPerCm"::numeric, 4);
ALTER TABLE "Chain" ALTER COLUMN "pricePerCm" TYPE DECIMAL(14,4) USING ROUND("pricePerCm"::numeric, 4);

-- Wire
ALTER TABLE "Wire" ALTER COLUMN "gauge" TYPE DECIMAL(14,4) USING ROUND("gauge"::numeric, 4);
ALTER TABLE "Wire" ALTER COLUMN "widthMm" TYPE DECIMAL(14,4) USING ROUND("widthMm"::numeric, 4);
ALTER TABLE "Wire" ALTER COLUMN "weightPerCm" TYPE DECIMAL(14,4) USING ROUND("weightPerCm"::numeric, 4);
ALTER TABLE "Wire" ALTER COLUMN "pricePerCm" TYPE DECIMAL(14,4) USING ROUND("pricePerCm"::numeric, 4);

-- MetalAlloy
ALTER TABLE "MetalAlloy" ALTER COLUMN "purity" TYPE DECIMAL(8,6) USING ROUND("purity"::numeric, 6);
ALTER TABLE "MetalAlloy" ALTER COLUMN "pureMetalPricePerG" TYPE DECIMAL(14,4) USING ROUND("pureMetalPricePerG"::numeric, 4);
ALTER TABLE "MetalAlloy" ALTER COLUMN "alloyMetalPricePerG" TYPE DECIMAL(14,4) USING ROUND("alloyMetalPricePerG"::numeric, 4);
ALTER TABLE "MetalAlloy" ALTER COLUMN "pricePerGram" TYPE DECIMAL(14,4) USING ROUND("pricePerGram"::numeric, 4);

-- SupplyPatternItem
ALTER TABLE "SupplyPatternItem" ALTER COLUMN "quantity" TYPE DECIMAL(14,4) USING ROUND("quantity"::numeric, 4);

-- orders / order_items
ALTER TABLE "orders" ALTER COLUMN "totalAmount" TYPE DECIMAL(14,2) USING ROUND("totalAmount"::numeric, 2);
ALTER TABLE "orders" ALTER COLUMN "advancePayment" TYPE DECIMAL(14,2) USING ROUND("advancePayment"::numeric, 2);
ALTER TABLE "order_items" ALTER COLUMN "priceAtTime" TYPE DECIMAL(14,2) USING ROUND("priceAtTime"::numeric, 2);
ALTER TABLE "order_items" ALTER COLUMN "costAtTime" TYPE DECIMAL(14,2) USING ROUND("costAtTime"::numeric, 2);
