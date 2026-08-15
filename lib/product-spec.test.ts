import { describe, expect, it } from "vitest";

import {
  buildProductSpec,
  classifySpecItem,
  formatWeightG,
  type SpecCompositionItem,
  type SpecMaterial,
  type SpecProductSource,
} from "@/lib/product-spec";

function material(overrides: Partial<SpecMaterial>): SpecMaterial {
  return {
    id: overrides.id ?? "mat_1",
    name: overrides.name ?? "Material",
    type: overrides.type ?? "metal",
    unit: overrides.unit ?? "g",
    purchasePrice: overrides.purchasePrice ?? 0,
    purchaseQuantity: overrides.purchaseQuantity ?? 1,
    attrCut: overrides.attrCut ?? null,
    attrColor: overrides.attrColor ?? null,
    attrSizeMm: overrides.attrSizeMm ?? null,
    attrLengthMm: overrides.attrLengthMm ?? null,
    attrMaterial: overrides.attrMaterial ?? null,
    attrMesh: overrides.attrMesh ?? null,
    attrProfile: overrides.attrProfile ?? null,
    attrGauge: overrides.attrGauge ?? null,
    weightPerCm: overrides.weightPerCm ?? null,
    purity: overrides.purity ?? null,
    pureMetalName: overrides.pureMetalName ?? null,
    alloyMetalName: overrides.alloyMetalName ?? null,
  };
}

function item(
  m: SpecMaterial,
  quantityUsed: number,
  extra: Partial<SpecCompositionItem> = {}
): SpecCompositionItem {
  return {
    quantityUsed,
    sequenceOrder: extra.sequenceOrder ?? 0,
    lineKind: extra.lineKind ?? "outro",
    material: m,
  };
}

function product(items: SpecCompositionItem[]): SpecProductSource {
  return {
    id: "prod_1",
    title: "Anel Solitário Ouro 18k",
    description: "",
    imageUrl: "",
    productCode: "ANEL-001",
    price: 1000,
    costPrice: 400,
    totalWeightG: 5.45,
    isAvailable: true,
    category: { id: "cat_1", name: "Anéis" },
    compositionItems: items,
  };
}

describe("classifySpecItem", () => {
  it("usa o lineKind persistido quando presente", () => {
    const m = material({ type: "metal" });
    expect(classifySpecItem(item(m, 1, { lineKind: "pedra" }))).toBe("pedra");
  });

  it("deduz corrente por attrMesh quando lineKind é outro", () => {
    const m = material({ type: "componente", attrMesh: "veneziana" });
    expect(classifySpecItem(item(m, 1))).toBe("corrente");
  });

  it("deduz fio por attrProfile", () => {
    const m = material({ type: "componente", attrProfile: "redondo" });
    expect(classifySpecItem(item(m, 1))).toBe("fio");
  });

  it("deduz pedra por type gema", () => {
    const m = material({ type: "gema" });
    expect(classifySpecItem(item(m, 1))).toBe("pedra");
  });
});

describe("buildProductSpec — metais", () => {
  it("calcula peso e custo do metal", () => {
    const gold = material({
      id: "gold",
      name: "Ouro 18k",
      type: "metal",
      unit: "g",
      purchasePrice: 100,
      purchaseQuantity: 1,
      attrMaterial: "Ouro 18k",
      purity: 0.75,
    });
    const spec = buildProductSpec(product([item(gold, 4.25, { lineKind: "metal" })]));

    expect(spec.metals.rows).toHaveLength(1);
    expect(spec.metals.rows[0].weightG).toBe(4.25);
    expect(spec.metals.rows[0].totalCost).toBe(425);
    expect(spec.metals.rows[0].purityPercent).toBe(75);
    expect(spec.metals.totalWeightG).toBe(4.25);
    expect(spec.metals.totalCost).toBe(425);
    // Peça só de metal: demais seções vazias, sem erro.
    expect(spec.stones.rows).toHaveLength(0);
    expect(spec.wires.rows).toHaveLength(0);
    expect(spec.chains.rows).toHaveLength(0);
    expect(spec.stones.totalQuantity).toBe(0);
  });
});

describe("buildProductSpec — pedras", () => {
  it("formata dimensão 1D e conta o total de pedras", () => {
    const stone = material({
      id: "z1",
      name: "Redonda 2mm - Branco",
      type: "gema",
      unit: "un",
      purchasePrice: 30,
      purchaseQuantity: 1,
      attrCut: "Redonda",
      attrColor: "Branco",
      attrSizeMm: 2,
      attrLengthMm: null,
    });
    const spec = buildProductSpec(product([item(stone, 3, { lineKind: "pedra" })]));

    expect(spec.stones.rows[0].dimension).toBe("2mm");
    expect(spec.stones.rows[0].dimension).not.toContain("null");
    expect(spec.stones.totalQuantity).toBe(3);
    expect(spec.stones.rows[0].totalCost).toBe(90);
  });

  it("formata dimensão 2D como largura x comprimento", () => {
    const stone = material({
      id: "z2",
      name: "Gota",
      type: "gema",
      unit: "un",
      attrCut: "Gota",
      attrColor: "Rubi",
      attrSizeMm: 4,
      attrLengthMm: 6,
    });
    const spec = buildProductSpec(product([item(stone, 2, { lineKind: "pedra" })]));

    expect(spec.stones.rows[0].dimension).toBe("4x6mm");
    expect(spec.stones.totalQuantity).toBe(2);
  });

  it("soma quantidades de pedras distintas (não conta linhas)", () => {
    const a = material({ id: "a", type: "gema", attrCut: "Gota", attrSizeMm: 4, attrLengthMm: 6 });
    const b = material({ id: "b", type: "gema", attrCut: "Redonda", attrSizeMm: 2 });
    const spec = buildProductSpec(
      product([
        item(a, 2, { lineKind: "pedra", sequenceOrder: 0 }),
        item(b, 3, { lineKind: "pedra", sequenceOrder: 1 }),
      ])
    );
    expect(spec.stones.rows).toHaveLength(2);
    expect(spec.stones.totalQuantity).toBe(5);
  });
});

describe("buildProductSpec — fios e correntes", () => {
  it("deriva comprimento do fio a partir do peso/cm", () => {
    const wire = material({
      id: "w1",
      name: "Fio Ouro",
      type: "metal",
      unit: "g",
      purchasePrice: 200,
      purchaseQuantity: 1,
      attrMaterial: "Ouro 18k",
      attrProfile: "redondo",
      attrGauge: 0.8,
      weightPerCm: 0.1,
    });
    const spec = buildProductSpec(product([item(wire, 2.35, { lineKind: "fio" })]));

    expect(spec.wires.rows).toHaveLength(1);
    expect(spec.wires.rows[0].weightG).toBe(2.35);
    expect(spec.wires.rows[0].lengthCm).toBe(23.5);
    expect(spec.wires.rows[0].profile).toBe("redondo");
    expect(spec.wires.rows[0].gaugeMm).toBe(0.8);
  });

  it("calcula peso da corrente pelo comprimento em cm", () => {
    const chain = material({
      id: "c1",
      name: "Corrente Veneziana",
      type: "metal",
      unit: "cm",
      purchasePrice: 5,
      purchaseQuantity: 1,
      attrMesh: "veneziana",
      attrSizeMm: 0.6,
      weightPerCm: 0.05,
    });
    const spec = buildProductSpec(product([item(chain, 45, { lineKind: "corrente" })]));

    expect(spec.chains.rows).toHaveLength(1);
    expect(spec.chains.rows[0].lengthCm).toBe(45);
    expect(spec.chains.rows[0].weightG).toBe(2.25);
    expect(spec.chains.rows[0].mesh).toBe("veneziana");
  });
});

describe("buildProductSpec — resumo", () => {
  it("calcula margem e contagem de itens", () => {
    const gold = material({ id: "g", type: "metal", unit: "g", purchasePrice: 100 });
    const spec = buildProductSpec(product([item(gold, 4, { lineKind: "metal" })]));
    expect(spec.itemCount).toBe(1);
    expect(spec.marginPercent).toBe(60);
  });

  it("margem é null quando o preço é zero", () => {
    const base = product([]);
    const spec = buildProductSpec({ ...base, price: 0 });
    expect(spec.marginPercent).toBeNull();
  });

  it("peça sem composição não quebra", () => {
    const spec = buildProductSpec(product([]));
    expect(spec.composition).toHaveLength(0);
    expect(spec.metals.rows).toHaveLength(0);
    expect(spec.stones.totalQuantity).toBe(0);
  });
});

describe("formatWeightG", () => {
  it("formata gramas em pt-BR", () => {
    expect(formatWeightG(4.25)).toBe("4,25 g");
  });
  it("retorna traço para valores nulos", () => {
    expect(formatWeightG(null)).toBe("—");
  });
});
