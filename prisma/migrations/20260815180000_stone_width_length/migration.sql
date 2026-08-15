-- Pedras: sizeMm legado (medida única) vira widthMm (diâmetro ou largura).
-- lengthMm entra para lapidações fantasia (largura x comprimento).
-- Dados existentes: sizeMm → widthMm. Nenhuma linha é apagada.

ALTER TABLE "Stone" ADD COLUMN IF NOT EXISTS "widthMm" DECIMAL(14,4);
ALTER TABLE "Stone" ADD COLUMN IF NOT EXISTS "lengthMm" DECIMAL(14,4);

UPDATE "Stone"
SET "widthMm" = "sizeMm"
WHERE "widthMm" IS NULL AND "sizeMm" IS NOT NULL;

DROP INDEX IF EXISTS "Stone_sizeMm_idx";
DROP INDEX IF EXISTS "Stone_cut_color_sizeMm_idx";

ALTER TABLE "Stone" DROP COLUMN IF EXISTS "sizeMm";

CREATE INDEX IF NOT EXISTS "Stone_widthMm_idx" ON "Stone"("widthMm");
CREATE INDEX IF NOT EXISTS "Stone_cut_color_widthMm_lengthMm_idx"
  ON "Stone"("cut", "color", "widthMm", "lengthMm");

-- Identidade lógica: cut + color + width + length (NULL de redonda = um único vazio).
-- Só cria o unique se não houver duplicatas históricas.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM (
      SELECT LOWER("cut"), LOWER("color"), "widthMm", COALESCE("lengthMm", -1)
      FROM "Stone"
      GROUP BY 1, 2, 3, 4
      HAVING COUNT(*) > 1
    ) dupes
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS "Stone_identity_key"
      ON "Stone" (LOWER("cut"), LOWER("color"), "widthMm", COALESCE("lengthMm", -1));
  END IF;
END $$;

-- Comprimento da gema no material/BOM (não confundir 3x5 com 3x6).
ALTER TABLE "Material" ADD COLUMN IF NOT EXISTS "attrLengthMm" DECIMAL(14,4);
ALTER TABLE "OrderItemBomLine" ADD COLUMN IF NOT EXISTS "attrLengthMm" DECIMAL(14,4);
