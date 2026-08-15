import type { Prisma } from "@prisma/client";

import { buildStoneName, isDiameterCut, normalizeCut } from "@/lib/stone";

const ZIRCONIA_SIZES_MM = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const ZIRCONIA_CUTS = [
  "Redonda",
  "Oval",
  "Gota",
  "Estrela",
  "Carré",
] as const;

const ZIRCONIA_COLORS = [
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

export type SeedStonesResult =
  | { status: "blocked"; existingCount: number }
  | { status: "seeded"; insertedCount: number };

/**
 * Gera em memória todas as combinações (9 × 5 × 10 = 450 registros).
 * Nunca acessa o banco — só monta o array tipado para createMany.
 */
export function buildZirconiaMatrix(): Prisma.StoneCreateManyInput[] {
  return ZIRCONIA_SIZES_MM.flatMap((sizeMm) =>
    ZIRCONIA_CUTS.flatMap((cut) =>
      ZIRCONIA_COLORS.map((color) => {
        const cutValue = normalizeCut(cut);
        const lengthMm = isDiameterCut(cutValue) ? null : sizeMm;
        return {
          name: buildStoneName({
            cut: cutValue,
            color,
            widthMm: sizeMm,
            lengthMm,
          }),
          cut: cutValue,
          color,
          widthMm: sizeMm,
          lengthMm,
          weightCt: 0,
          unitPrice: 0,
        };
      })
    )
  );
}

/**
 * Popula a tabela Stone UMA ÚNICA VEZ.
 * Trava absoluta: se já existir qualquer pedra, interrompe sem inserir nada.
 */
export async function seedStonesLibrary(db: {
  stone: {
    count: () => Promise<number>;
    createMany: (args: {
      data: Prisma.StoneCreateManyInput[];
    }) => Promise<{ count: number }>;
  };
}): Promise<SeedStonesResult> {
  const existingCount = await db.stone.count();
  if (existingCount > 0) {
    console.log(
      `⛔ Cadastro de pedras ignorado (bloqueado): já existem ${existingCount} pedra(s) cadastrada(s). Nenhuma inserção será feita.`
    );
    return { status: "blocked", existingCount };
  }

  const data = buildZirconiaMatrix();
  console.log(
    `💎 Inserindo biblioteca inicial de zircônias (${data.length} combinações) via createMany…`
  );

  const result = await db.stone.createMany({ data });
  console.log(`✅ ${result.count} pedras inseridas com sucesso.`);
  return { status: "seeded", insertedCount: result.count };
}
