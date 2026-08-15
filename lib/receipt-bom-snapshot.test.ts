import { describe, expect, it } from "vitest";

import { toWorkOrderData } from "@/lib/receipt";

describe("snapshot da BOM na requisição", () => {
  const soldAtDay1 = {
    quantityUsed: 2,
    name: "Ouro 18k",
    type: "metal",
    unit: "g",
  };

  const liveBomDay10 = [
    {
      quantityUsed: 1.5,
      material: {
        name: "Ouro 18k",
        type: "metal",
        unit: "g",
        attrCut: null,
        attrColor: null,
        attrSizeMm: null,
        attrLengthMm: null,
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
  ];

  it("usa o snapshot da venda, não a BOM atual do produto", () => {
    const work = toWorkOrderData({
      id: "ord_1",
      customerName: "Maria",
      createdAt: new Date("2026-08-01T12:00:00.000Z"),
      totalAmount: 1000,
      advancePayment: 0,
      items: [
        {
          quantity: 1,
          priceAtTime: 1000,
          productTitle: "Anel X",
          bomLines: [soldAtDay1],
          product: {
            title: "Anel X",
            compositionItems: liveBomDay10,
          },
        },
      ],
    });

    const metal = work.requisition.metals.find((m) => m.label === "Ouro 18k");
    expect(metal?.grams).toBeCloseTo(2, 4);
  });

  it("pedidos antigos sem snapshot caem na composição atual (legado)", () => {
    const work = toWorkOrderData({
      id: "ord_legacy",
      customerName: "João",
      createdAt: new Date("2026-07-01T12:00:00.000Z"),
      totalAmount: 500,
      items: [
        {
          quantity: 1,
          priceAtTime: 500,
          productTitle: "Anel legado",
          bomLines: [],
          product: {
            title: "Anel legado",
            compositionItems: liveBomDay10,
          },
        },
      ],
    });

    const pure = work.requisition.metals.find((m) => m.label === "Ouro 24k");
    const alloy = work.requisition.metals.find((m) => m.label === "Pré-liga");
    expect(pure?.grams).toBeCloseTo(1.5 * 0.75, 4);
    expect(alloy?.grams).toBeCloseTo(1.5 * 0.25, 4);
  });
});
