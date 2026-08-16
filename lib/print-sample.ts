import type { WorkOrderData } from "@/lib/receipt";

export const SAMPLE_WORK_ORDER: WorkOrderData = {
  orderId: "preview000000000000000001",
  customerName: "Cliente Exemplo",
  customerPhone: "11999999999",
  sellerName: "Atendente",
  createdAt: new Date().toISOString(),
  totalAmount: 2450,
  advancePayment: 500,
  items: [
    { quantity: 1, title: "Anel Solitário Ouro 18k", unitPrice: 2450 },
  ],
  requisition: {
    isEmpty: false,
    stones: [
      {
        key: "s1",
        label: "Zircônia redonda branca 2 mm",
        quantity: 12,
      },
    ],
    metals: [
      { key: "m1", label: "Ouro 18k (Au750)", grams: 5.2 },
    ],
    chains: [],
    wires: [],
    others: [
      { key: "o1", label: "Tarracha", quantity: 1, unit: "par" },
    ],
  },
};
