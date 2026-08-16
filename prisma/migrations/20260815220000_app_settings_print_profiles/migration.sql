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
