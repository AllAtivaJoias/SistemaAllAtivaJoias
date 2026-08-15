import { describe, expect, it } from "vitest";

import { computePricing } from "@/lib/pricing";

/**
 * Garante que custos adicionais fazem parte da fonte de verdade do preço.
 * Persistência em si é testada via o contrato SaveFichaInput (campos obrigatórios).
 */
describe("ficha — reprodução do preço", () => {
  const materials = [
    {
      name: "Ouro",
      packagePrice: 380,
      packageQuantity: 1,
      unit: "g" as const,
      quantityUsed: 3,
    },
  ];

  const additionalCosts = [
    { label: "Mão de Obra (Ourives)", kind: "fixed" as const, value: 90 },
    { label: "Taxa de Cartão", kind: "percent" as const, value: 4 },
  ];

  it("salvar e recalcular com os mesmos custos produz o mesmo preço", () => {
    const first = computePricing({
      materials,
      additionalCosts,
      mode: "markupPercent",
      strategyValue: 80,
    });
    const second = computePricing({
      materials,
      additionalCosts: additionalCosts.map((c) => ({ ...c })),
      mode: "markupPercent",
      strategyValue: 80,
    });
    expect(second.sellingPrice).toBe(first.sellingPrice);
    expect(second.totalCost).toBe(first.totalCost);
    expect(second.netProfit).toBe(first.netProfit);
  });

  it("omitir custos adicionais altera o preço (regressão que a persistência evita)", () => {
    const withCosts = computePricing({
      materials,
      additionalCosts,
      mode: "markupPercent",
      strategyValue: 80,
    });
    const without = computePricing({
      materials,
      additionalCosts: [],
      mode: "markupPercent",
      strategyValue: 80,
    });
    expect(without.sellingPrice).not.toBe(withCosts.sellingPrice);
  });
});
