import { describe, expect, it } from "vitest";

import {
  buildStoneName,
  formatStoneDimension,
  isDiameterCut,
  isSymmetricCut,
  normalizeColors,
  normalizeCutDisplay,
  normalizeStoneDimensions,
  partitionStoneBatch,
  stoneBatchSchema,
  stoneIdentityKey,
} from "@/lib/stone";

describe("formatStoneDimension", () => {
  it("width=2, length=null → 2mm", () => {
    expect(formatStoneDimension({ widthMm: 2, lengthMm: null })).toBe("2mm");
  });

  it("width=3, length=5 → 3x5mm", () => {
    expect(formatStoneDimension({ widthMm: 3, lengthMm: 5 })).toBe("3x5mm");
  });

  it("não inventa valor sem medida", () => {
    expect(formatStoneDimension({ widthMm: null, lengthMm: null })).toBe(
      "Sem medida"
    );
  });

  it("remove zeros à direita", () => {
    expect(formatStoneDimension({ widthMm: 2.5, lengthMm: null })).toBe("2.5mm");
    expect(formatStoneDimension({ widthMm: 2.0, lengthMm: null })).toBe("2mm");
  });
});

describe("buildStoneName", () => {
  it("Redonda 4mm - Branco", () => {
    expect(
      buildStoneName({
        cut: "redonda",
        color: "branco",
        widthMm: 4,
        lengthMm: null,
      })
    ).toBe("Redonda 4mm - Branco");
  });

  it("Gota 4x6mm - Rubi", () => {
    expect(
      buildStoneName({
        cut: "gota",
        color: "Rubi",
        widthMm: 4,
        lengthMm: 6,
      })
    ).toBe("Gota 4x6mm - Rubi");
  });

  it("lapidação personalizada", () => {
    expect(
      buildStoneName({
        cut: "Flor Imperial",
        color: "Esmeralda",
        widthMm: 5,
        lengthMm: 8,
      })
    ).toBe("Flor Imperial 5x8mm - Esmeralda");
  });
});

describe("normalizeStoneDimensions", () => {
  it("1D válido", () => {
    expect(normalizeStoneDimensions({ widthMm: 4, lengthMm: null })).toEqual({
      ok: true,
      widthMm: 4,
      lengthMm: null,
    });
  });

  it("2D válido", () => {
    expect(normalizeStoneDimensions({ widthMm: 4, lengthMm: 6 })).toEqual({
      ok: true,
      widthMm: 4,
      lengthMm: 6,
    });
  });

  it("rejeita 0, negativo, NaN e Infinity", () => {
    expect(normalizeStoneDimensions({ widthMm: 0 }).ok).toBe(false);
    expect(normalizeStoneDimensions({ widthMm: -4 }).ok).toBe(false);
    expect(normalizeStoneDimensions({ widthMm: Number.NaN }).ok).toBe(false);
    expect(
      normalizeStoneDimensions({ widthMm: Number.POSITIVE_INFINITY }).ok
    ).toBe(false);
  });

  it("comprimento sem largura", () => {
    const result = normalizeStoneDimensions({ widthMm: null, lengthMm: 6 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.path).toBe("widthMm");
  });
});

describe("validação de lote", () => {
  it("Redonda 4mm", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "Redonda",
      widthMm: 4,
      lengthMm: null,
      colors: ["branco"],
      weightCt: 0.03,
      unitPrice: 1.5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.lengthMm).toBeNull();
      expect(parsed.data.cut).toBe("Redonda");
    }
  });

  it("Quadrada 5mm (1D)", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "quadrada",
      widthMm: 5,
      lengthMm: null,
      colors: ["Branco"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.lengthMm).toBeNull();
  });

  it("Estrela 6mm", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "Estrela",
      widthMm: 6,
      colors: ["Branco"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("Gota 4x6mm", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "gota",
      widthMm: 4,
      lengthMm: 6,
      colors: ["Rubi"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("Oval 5x7mm", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "Oval",
      widthMm: 5,
      lengthMm: 7,
      colors: ["Esmeralda"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("lapidação customizada 5x8mm", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "Flor Imperial",
      widthMm: 5,
      lengthMm: 8,
      colors: ["Esmeralda"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.cut).toBe("Flor Imperial");
  });

  it("Gota só com largura é válida (comprimento opcional)", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "gota",
      widthMm: 4,
      lengthMm: null,
      colors: ["Rubi"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
  });

  it("width <= 0, NaN e Infinity", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "Redonda",
        widthMm: 0,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
    expect(
      stoneBatchSchema.safeParse({
        cut: "Redonda",
        widthMm: Number.NaN,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
    expect(
      stoneBatchSchema.safeParse({
        cut: "Redonda",
        widthMm: Number.POSITIVE_INFINITY,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
  });

  it("length <= 0", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "oval",
        widthMm: 4,
        lengthMm: 0,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
  });

  it("lapidação vazia", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "  ",
        widthMm: 4,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
  });

  it("cores vazias, duplicadas e com espaços", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "Redonda",
        widthMm: 2,
        colors: [],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);

    const parsed = stoneBatchSchema.safeParse({
      cut: "Redonda",
      widthMm: 2,
      colors: [" Rubi ", "rubi", "RUBI", "Safira"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.colors).toEqual(["Rubi", "Safira"]);
    }
  });
});

describe("partitionStoneBatch", () => {
  it("separa novas e duplicadas", () => {
    const existing = [
      { cut: "navete", color: "Rubi", widthMm: 3, lengthMm: 5 },
    ];
    const incoming = [
      { cut: "Navete", color: "Rubi", widthMm: 3, lengthMm: 5 },
      { cut: "navete", color: "Safira", widthMm: 3, lengthMm: 5 },
    ];
    const { toCreate, skipped } = partitionStoneBatch(existing, incoming);
    expect(skipped).toHaveLength(1);
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0]?.color).toBe("Safira");
  });

  it("identidade ignora caixa da cor e da lapidação", () => {
    expect(
      stoneIdentityKey({
        cut: "Gota",
        color: "RUBI",
        widthMm: 4,
        lengthMm: 6,
      })
    ).toBe(
      stoneIdentityKey({
        cut: "gota",
        color: "Rubi",
        widthMm: 4,
        lengthMm: 6,
      })
    );
  });
});

describe("lapidação e cores", () => {
  it("simétricas: redonda, quadrada, estrela, brilhante", () => {
    expect(isSymmetricCut("Redonda")).toBe(true);
    expect(isSymmetricCut("Quadrada")).toBe(true);
    expect(isSymmetricCut("Estrela")).toBe(true);
    expect(isDiameterCut("brilhante")).toBe(true);
    expect(isSymmetricCut("gota")).toBe(false);
  });

  it("preserva grafia personalizada e mapeia aliases", () => {
    expect(normalizeCutDisplay("  gota ")).toBe("Gota");
    expect(normalizeCutDisplay("Flor Imperial")).toBe("Flor Imperial");
  });

  it("normaliza cores", () => {
    expect(normalizeColors(["  rubi ", "", "Rubi", "safira"])).toEqual([
      "Rubi",
      "Safira",
    ]);
  });
});
