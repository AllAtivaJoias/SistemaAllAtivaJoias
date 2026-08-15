import { describe, expect, it } from "vitest";

import {
  buildZirconiaMatrix,
  seedStonesLibrary,
  zirconiaCatalogSize,
  ZIRCONIA_SEED_COLORS,
  ZIRCONIA_SEED_CUTS,
  ZIRCONIA_SEED_SIZES_MM,
} from "@/prisma/stones-library";
import { partitionStoneBatch, type StoneIdentity } from "@/lib/stone";

describe("catálogo base de zircônias", () => {
  it("tamanho = 3 lapidações × 9 tamanhos × N cores", () => {
    const expected =
      ZIRCONIA_SEED_CUTS.length *
      ZIRCONIA_SEED_SIZES_MM.length *
      ZIRCONIA_SEED_COLORS.length;
    expect(zirconiaCatalogSize()).toBe(expected);
    expect(buildZirconiaMatrix()).toHaveLength(expected);
  });

  it("somente Estrela, Redonda e Quadrada em 1D", () => {
    const rows = buildZirconiaMatrix();
    const cuts = new Set(rows.map((row) => row.cut));
    expect([...cuts].sort()).toEqual(["Estrela", "Quadrada", "Redonda"]);
    expect(rows.every((row) => row.lengthMm == null)).toBe(true);
    expect(rows.some((row) => String(row.cut).toLowerCase().includes("gota"))).toBe(
      false
    );
    expect(rows.some((row) => String(row.cut).toLowerCase().includes("oval"))).toBe(
      false
    );
  });

  it("seed é idempotente", async () => {
    const store: StoneIdentity[] = [];
    const db = {
      stone: {
        findMany: async () => store.map((row) => ({ ...row })),
        createMany: async ({
          data,
        }: {
          data: Array<{
            cut?: string;
            color?: string;
            widthMm?: unknown;
            lengthMm?: unknown;
          }>;
        }) => {
          const incoming = data.map((row) => ({
            cut: String(row.cut),
            color: String(row.color),
            widthMm: Number(row.widthMm),
            lengthMm: row.lengthMm == null ? null : Number(row.lengthMm),
          }));
          const { toCreate } = partitionStoneBatch(store, incoming);
          store.push(...toCreate);
          return { count: toCreate.length };
        },
      },
    };

    const first = await seedStonesLibrary(db);
    const second = await seedStonesLibrary(db);
    const third = await seedStonesLibrary(db);

    expect(first.insertedCount).toBe(zirconiaCatalogSize());
    expect(second.insertedCount).toBe(0);
    expect(third.insertedCount).toBe(0);
    expect(store).toHaveLength(zirconiaCatalogSize());
  });
});
