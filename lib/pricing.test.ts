import { describe, expect, it } from "vitest";

import {
  buildAlerts,
  buildProjection,
  buildSimulation,
  computeCompositionCost,
  computeMaterialCost,
  computePricing,
} from "@/lib/pricing";

describe("computeMaterialCost", () => {
  it("rateia o lote: 12 de 100 a R$ 45 = 5.40", () => {
    expect(
      computeMaterialCost({
        name: "Zircônia",
        packagePrice: 45,
        packageQuantity: 100,
        unit: "un",
        quantityUsed: 12,
      })
    ).toBeCloseTo(5.4, 4);
  });

  it("lote zero retorna 0", () => {
    expect(
      computeMaterialCost({
        name: "x",
        packagePrice: 10,
        packageQuantity: 0,
        unit: "g",
        quantityUsed: 1,
      })
    ).toBe(0);
  });

  it("negativos viram 0", () => {
    expect(
      computeMaterialCost({
        name: "x",
        packagePrice: -10,
        packageQuantity: 1,
        unit: "g",
        quantityUsed: 1,
      })
    ).toBe(0);
  });
});

describe("computePricing — markup com taxa", () => {
  const base = {
    materials: [
      {
        name: "Ouro 18k",
        packagePrice: 380,
        packageQuantity: 1,
        unit: "g" as const,
        quantityUsed: 2,
      },
    ],
    additionalCosts: [
      { label: "Mão de Obra (Ourives)", kind: "fixed" as const, value: 80 },
      { label: "Cravação (por pedra)", kind: "fixed" as const, value: 40 },
      { label: "Banho (Ródio/Ouro)", kind: "fixed" as const, value: 25 },
      {
        label: "Embalagem de Luxo",
        kind: "fixed" as const,
        value: 15,
        isPackaging: true,
      },
      { label: "Certificado de Garantia", kind: "fixed" as const, value: 10 },
      { label: "Taxa de Cartão", kind: "percent" as const, value: 3.5 },
      { label: "Comissão", kind: "percent" as const, value: 5 },
    ],
    mode: "markupPercent" as const,
    strategyValue: 100,
  };

  it("custo de metal 2g × 380 = 760", () => {
    expect(computeCompositionCost(base.materials)).toBe(760);
  });

  it("resolve preço com taxas percentuais sobre a venda", () => {
    const result = computePricing(base);
    expect(result.isValid).toBe(true);
    expect(result.additionalFixedCost).toBe(170);
    expect(result.packagingCost).toBe(15);
    expect(result.additionalPercentRate).toBeCloseTo(0.085, 6);
    const baseCost = 760 + 170;
    const expectedPrice = (baseCost * 2) / (1 - 0.085 * 2);
    expect(result.sellingPrice).toBeCloseTo(expectedPrice, 2);
    expect(result.netProfit).toBeGreaterThan(0);
  });

  it("margem e markup são consistentes", () => {
    const result = computePricing(base);
    expect(result.marginPercent).toBeCloseTo(
      (result.netProfit / result.sellingPrice) * 100,
      2
    );
    expect(result.markupPercent).toBeCloseTo(
      (result.netProfit / result.totalCost) * 100,
      2
    );
  });
});

describe("estratégias", () => {
  const materials = [
    {
      name: "Prata",
      packagePrice: 6,
      packageQuantity: 1,
      unit: "g" as const,
      quantityUsed: 10,
    },
  ];

  it("marginPercent 50% sem taxas: preço = custo / 0.5", () => {
    const result = computePricing({
      materials,
      additionalCosts: [],
      mode: "marginPercent",
      strategyValue: 50,
    });
    expect(result.sellingPrice).toBeCloseTo(120, 2);
  });

  it("fixedProfit 100 sem taxas: preço = custo + 100", () => {
    const result = computePricing({
      materials,
      additionalCosts: [],
      mode: "fixedProfit",
      strategyValue: 100,
    });
    expect(result.sellingPrice).toBeCloseTo(160, 2);
  });

  it("finalPrice usa o valor informado", () => {
    const result = computePricing({
      materials,
      additionalCosts: [],
      mode: "finalPrice",
      strategyValue: 250,
    });
    expect(result.sellingPrice).toBe(250);
    expect(result.isValid).toBe(true);
  });

  it("margem 100% é inválida", () => {
    const result = computePricing({
      materials,
      additionalCosts: [],
      mode: "marginPercent",
      strategyValue: 100,
    });
    expect(result.isValid).toBe(false);
    expect(result.sellingPrice).toBe(0);
  });

  it("taxa 100% + markup é inválida", () => {
    const result = computePricing({
      materials,
      additionalCosts: [{ label: "taxa", kind: "percent", value: 100 }],
      mode: "markupPercent",
      strategyValue: 50,
    });
    expect(result.isValid).toBe(false);
  });

  it("sem materiais e preço 0 gera alerta info", () => {
    const result = computePricing({
      materials: [],
      additionalCosts: [],
      mode: "markupPercent",
      strategyValue: 100,
    });
    const alerts = buildAlerts(result);
    expect(alerts[0]?.level).toBe("info");
  });
});

describe("simulação e projeção", () => {
  it("simula markups padrão", () => {
    const rows = buildSimulation(100, 0);
    expect(rows).toHaveLength(5);
    expect(rows[0]?.markupPercent).toBe(50);
    expect(rows[0]?.sellingPrice).toBeCloseTo(150, 2);
  });

  it("projeta volumes", () => {
    const rows = buildProjection(100, 40);
    expect(rows.find((r) => r.units === 10)?.revenue).toBe(1000);
    expect(rows.find((r) => r.units === 10)?.profit).toBe(400);
  });
});

describe("casas decimais de ouro", () => {
  it("não perde centavos de R$/g em 3 casas", () => {
    const cost = computeMaterialCost({
      name: "Au",
      packagePrice: 380.125,
      packageQuantity: 1,
      unit: "g",
      quantityUsed: 1.3333,
    });
    expect(cost).toBeCloseTo(380.125 * 1.3333, 3);
  });
});

describe("limites e combinações inválidas", () => {
  it("quantidade usada zero gera custo zero", () => {
    expect(
      computeMaterialCost({
        name: "x",
        packagePrice: 100,
        packageQuantity: 10,
        unit: "g",
        quantityUsed: 0,
      })
    ).toBe(0);
  });

  it("valor extremamente alto permanece finito", () => {
    const result = computePricing({
      materials: [
        {
          name: "Au",
          packagePrice: 1_000_000,
          packageQuantity: 1,
          unit: "g",
          quantityUsed: 1000,
        },
      ],
      additionalCosts: [],
      mode: "markupPercent",
      strategyValue: 50,
    });
    expect(result.isValid).toBe(true);
    expect(Number.isFinite(result.sellingPrice)).toBe(true);
    expect(result.sellingPrice).toBeGreaterThan(1_000_000_000);
  });
});
