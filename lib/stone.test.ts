import { describe, expect, it } from "vitest";

import {
  buildStoneName,
  formatStoneDimension,
  isDiameterCut,
  normalizeColors,
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
  it("Brilhante 2mm - Rubi", () => {
    expect(
      buildStoneName({
        cut: "brilhante",
        color: "rubi",
        widthMm: 2,
        lengthMm: null,
      })
    ).toBe("Brilhante 2mm - Rubi");
  });

  it("Navete 3x5mm - Rubi", () => {
    expect(
      buildStoneName({
        cut: "navete",
        color: "Rubi",
        widthMm: 3,
        lengthMm: 5,
      })
    ).toBe("Navete 3x5mm - Rubi");
  });
});

describe("validação de lote", () => {
  it("Brilhante + diâmetro válido", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "brilhante",
      widthMm: 2.5,
      lengthMm: null,
      colors: ["branco"],
      weightCt: 0.03,
      unitPrice: 1.5,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.lengthMm).toBeNull();
      expect(parsed.data.cut).toBe("brilhante");
    }
  });

  it("Brilhante + length inválido", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "brilhante",
      widthMm: 3,
      lengthMm: 5,
      colors: ["branco"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("Navete + width e length válidos", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "navete",
      widthMm: 3,
      lengthMm: 5,
      colors: ["Rubi", "Safira"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.colors).toEqual(["Rubi", "Safira"]);
    }
  });

  it("Navete sem length", () => {
    const parsed = stoneBatchSchema.safeParse({
      cut: "navete",
      widthMm: 3,
      lengthMm: null,
      colors: ["branco"],
      weightCt: 0,
      unitPrice: 0,
    });
    expect(parsed.success).toBe(false);
  });

  it("width <= 0, NaN e Infinity", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "brilhante",
        widthMm: 0,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
    expect(
      stoneBatchSchema.safeParse({
        cut: "brilhante",
        widthMm: Number.NaN,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
    expect(
      stoneBatchSchema.safeParse({
        cut: "brilhante",
        widthMm: Number.POSITIVE_INFINITY,
        colors: ["branco"],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);
  });

  it("length <= 0 em fantasia", () => {
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

  it("cores vazias, duplicadas e com espaços", () => {
    expect(
      stoneBatchSchema.safeParse({
        cut: "brilhante",
        widthMm: 2,
        colors: [],
        weightCt: 0,
        unitPrice: 0,
      }).success
    ).toBe(false);

    const parsed = stoneBatchSchema.safeParse({
      cut: "brilhante",
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
      { cut: "navete", color: "Rubi", widthMm: 3, lengthMm: 5 },
      { cut: "navete", color: "Safira", widthMm: 3, lengthMm: 5 },
    ];
    const { toCreate, skipped } = partitionStoneBatch(existing, incoming);
    expect(skipped).toHaveLength(1);
    expect(toCreate).toHaveLength(1);
    expect(toCreate[0]?.color).toBe("Safira");
  });

  it("identidade ignora caixa da cor", () => {
    expect(
      stoneIdentityKey({
        cut: "Navete",
        color: "RUBI",
        widthMm: 3,
        lengthMm: 5,
      })
    ).toBe(
      stoneIdentityKey({
        cut: "navete",
        color: "Rubi",
        widthMm: 3,
        lengthMm: 5,
      })
    );
  });
});

describe("isDiameterCut / normalizeColors", () => {
  it("brilhante e redonda são diâmetro", () => {
    expect(isDiameterCut("brilhante")).toBe(true);
    expect(isDiameterCut("Redonda")).toBe(true);
    expect(isDiameterCut("navete")).toBe(false);
  });

  it("normaliza cores", () => {
    expect(normalizeColors(["  rubi ", "", "Rubi", "safira"])).toEqual([
      "Rubi",
      "Safira",
    ]);
  });
});
