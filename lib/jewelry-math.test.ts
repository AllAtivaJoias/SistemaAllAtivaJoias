import { describe, expect, it } from "vitest";

import {
  computeAlloy,
  karatToPurity,
  lengthCost,
  wireCostFromAlloy,
} from "@/lib/jewelry-math";
import { canTransition } from "@/lib/order-status";
import { calculateMaterialsForOrder } from "@/lib/material-requisition";

describe("liga", () => {
  it("18k: 0.75g nobre + 0.25g pré-liga por grama", () => {
    const r = computeAlloy({
      finalWeight: 10,
      purity: 0.75,
      pureMetalPricePerG: 400,
      alloyMetalPricePerG: 8,
    });
    expect(r.pureWeight).toBeCloseTo(7.5, 4);
    expect(r.alloyWeight).toBeCloseTo(2.5, 4);
    expect(r.costPerGram).toBeCloseTo(0.75 * 400 + 0.25 * 8, 4);
    expect(r.totalCost).toBeCloseTo(r.costPerGram * 10, 3);
  });

  it("karatToPurity(18) = 0.75", () => {
    expect(karatToPurity(18)).toBeCloseTo(0.75, 6);
  });
});

describe("fio", () => {
  it("custo = cm × g/cm × R$/g", () => {
    const r = wireCostFromAlloy(0.06, 12, 380);
    expect(r.weightG).toBeCloseTo(0.72, 4);
    expect(r.cost).toBeCloseTo(0.72 * 380, 2);
    expect(r.pricePerCm).toBeCloseTo(0.06 * 380, 2);
  });

  it("lengthCost de corrente", () => {
    expect(lengthCost(42, 40)).toBe(1680);
  });
});

describe("máquina de estados do pedido", () => {
  it("PENDING → COMPLETED e CANCELLED", () => {
    expect(canTransition("PENDING", "COMPLETED")).toBe(true);
    expect(canTransition("PENDING", "CANCELLED")).toBe(true);
  });

  it("COMPLETED e CANCELLED são terminais", () => {
    expect(canTransition("COMPLETED", "PENDING")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "PENDING")).toBe(false);
  });
});

describe("requisição — fio em gramas", () => {
  it("converte g de volta para cm quando weightPerCm existe", () => {
    const result = calculateMaterialsForOrder([
      {
        quantity: 1,
        compositionItems: [
          {
            quantityUsed: 0.72,
            material: {
              name: "Fio chato 0.45",
              type: "metal",
              unit: "g",
              attrCut: null,
              attrColor: null,
              attrSizeMm: null,
              attrMaterial: "Ouro 18k (Au750)",
              attrMesh: null,
              attrProfile: "chato/laminado",
              attrGauge: 0.45,
              weightPerCm: 0.06,
              purity: null,
              pureMetalName: null,
              alloyMetalName: null,
            },
          },
        ],
      },
    ]);
    expect(result.wires).toHaveLength(1);
    expect(result.wires[0]?.cm).toBeCloseTo(12, 4);
    expect(result.wires[0]?.grams).toBeCloseTo(0.72, 4);
    expect(result.metals).toHaveLength(0);
  });

  it("decompõe liga 18k em metais base", () => {
    const result = calculateMaterialsForOrder([
      {
        quantity: 2,
        compositionItems: [
          {
            quantityUsed: 4,
            material: {
              name: "Ouro 18k",
              type: "metal",
              unit: "g",
              attrCut: null,
              attrColor: null,
              attrSizeMm: null,
              attrMaterial: "Ouro 18k",
              attrMesh: null,
              attrProfile: null,
              attrGauge: null,
              weightPerCm: null,
              purity: 0.75,
              pureMetalName: "Ouro 24k",
              alloyMetalName: "Pré-liga",
            },
          },
        ],
      },
    ]);
    const ouro = result.metals.find((m) => m.label === "Ouro 24k");
    const pre = result.metals.find((m) => m.label === "Pré-liga");
    expect(ouro?.grams).toBeCloseTo(8 * 0.75, 4);
    expect(pre?.grams).toBeCloseTo(8 * 0.25, 4);
  });
});
