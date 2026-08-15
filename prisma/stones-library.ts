import type { Prisma } from "@prisma/client";

import {
  buildStoneName,
  normalizeCutDisplay,
  partitionStoneBatch,
  stoneIdentityKey,
  type StoneIdentity,
} from "@/lib/stone";

export const ZIRCONIA_SEED_SIZES_MM = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const ZIRCONIA_SEED_CUTS = ["Estrela", "Redonda", "Quadrada"] as const;

export const ZIRCONIA_SEED_COLORS = [
  "Branco",
  "Amarelo",
  "Água marinho",
  "Vermelho",
  "Roxo",
  "Safira azul",
  "Preto",
  "Laranja",
  "Rosa",
  "Verde",
] as const;

export function zirconiaCatalogSize(): number {
  return (
    ZIRCONIA_SEED_CUTS.length *
    ZIRCONIA_SEED_SIZES_MM.length *
    ZIRCONIA_SEED_COLORS.length
  );
}

export type SeedStonesResult = {
  status: "seeded";
  insertedCount: number;
  skippedCount: number;
  catalogSize: number;
};

function toIdentity(row: {
  cut: string;
  color: string;
  widthMm: unknown;
  lengthMm: unknown;
}): StoneIdentity {
  return {
    cut: row.cut,
    color: row.color,
    widthMm: Number(row.widthMm),
    lengthMm: row.lengthMm == null ? null : Number(row.lengthMm),
  };
}

/**
 * Catálogo base: 3 lapidações simétricas × 9 tamanhos × N cores.
 * Sempre 1D (lengthMm = null). Não gera Gota/Oval/Navete.
 */
export function buildZirconiaMatrix(): Prisma.StoneCreateManyInput[] {
  return ZIRCONIA_SEED_SIZES_MM.flatMap((widthMm) =>
    ZIRCONIA_SEED_CUTS.flatMap((cutLabel) =>
      ZIRCONIA_SEED_COLORS.map((color) => {
        const cut = normalizeCutDisplay(cutLabel);
        return {
          name: buildStoneName({
            cut,
            color,
            widthMm,
            lengthMm: null,
          }),
          cut,
          color,
          widthMm,
          lengthMm: null,
          weightCt: 0,
          unitPrice: 0,
        };
      })
    )
  );
}

type StoneSeedRow = {
  cut: string;
  color: string;
  widthMm: unknown;
  lengthMm: unknown;
};

type StoneSeedDb = {
  stone: {
    findMany: (args: {
      select: {
        cut: true;
        color: true;
        widthMm: true;
        lengthMm: true;
      };
    }) => Promise<StoneSeedRow[]>;
    createMany: (args: {
      data: Prisma.StoneCreateManyInput[];
    }) => Promise<{ count: number }>;
  };
};

/**
 * Idempotente: insere só combinações ausentes. Rodar N vezes não duplica.
 */
export async function seedStonesLibrary(db: StoneSeedDb): Promise<SeedStonesResult> {
  const catalog = buildZirconiaMatrix();
  const incoming: StoneIdentity[] = catalog.map((row) => ({
    cut: String(row.cut),
    color: String(row.color),
    widthMm: Number(row.widthMm),
    lengthMm: row.lengthMm == null ? null : Number(row.lengthMm),
  }));

  const existingRows = await db.stone.findMany({
    select: { cut: true, color: true, widthMm: true, lengthMm: true },
  });
  const { toCreate, skipped } = partitionStoneBatch(
    existingRows.map(toIdentity),
    incoming
  );

  if (toCreate.length === 0) {
    return {
      status: "seeded",
      insertedCount: 0,
      skippedCount: skipped.length,
      catalogSize: catalog.length,
    };
  }

  const byKey = new Map(
    catalog.map((row) => [stoneIdentityKey(toIdentity({
      cut: String(row.cut),
      color: String(row.color),
      widthMm: row.widthMm,
      lengthMm: row.lengthMm,
    })), row])
  );

  const data = toCreate.map(
    (item) =>
      byKey.get(stoneIdentityKey(item)) ?? {
        name: buildStoneName(item),
        cut: item.cut,
        color: item.color,
        widthMm: item.widthMm,
        lengthMm: null,
        weightCt: 0,
        unitPrice: 0,
      }
  );

  const result = await db.stone.createMany({ data });
  return {
    status: "seeded",
    insertedCount: result.count,
    skippedCount: skipped.length,
    catalogSize: catalog.length,
  };
}
