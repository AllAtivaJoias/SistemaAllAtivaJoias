import {
  calculateMaterialsForOrder,
  type MaterialRequisition,
  type RequisitionCompositionItem,
  type RequisitionMaterial,
} from "@/lib/material-requisition";

export type WorkOrderItem = {
  quantity: number;
  title: string;
  unitPrice: number;
};

export type WorkOrderData = {
  orderId: string;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  createdAt: string;
  totalAmount: number;
  advancePayment: number;
  items: WorkOrderItem[];
  requisition: MaterialRequisition;
};

type BomSnapshotLine = {
  quantityUsed: number;
  name: string;
  type: string;
  unit: string;
  attrCut?: string | null;
  attrColor?: string | null;
  attrSizeMm?: number | null;
  attrLengthMm?: number | null;
  attrMaterial?: string | null;
  attrMesh?: string | null;
  attrProfile?: string | null;
  attrGauge?: number | null;
  weightPerCm?: number | null;
  purity?: number | null;
  pureMetalName?: string | null;
  alloyMetalName?: string | null;
};

type OrderForReceipt = {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  sellerName?: string | null;
  createdAt: Date;
  totalAmount: number;
  advancePayment?: number | null;
  items: {
    quantity: number;
    priceAtTime: number;
    productTitle?: string | null;
    bomLines?: BomSnapshotLine[];
    product: {
      title: string;
      compositionItems?: RequisitionCompositionItem[];
    };
  }[];
};

function snapshotToComposition(
  lines: BomSnapshotLine[]
): RequisitionCompositionItem[] {
  return lines.map((line) => ({
    quantityUsed: Number(line.quantityUsed),
    material: {
      name: line.name,
      type: line.type,
      unit: line.unit,
      attrCut: line.attrCut ?? null,
      attrColor: line.attrColor ?? null,
      attrSizeMm: line.attrSizeMm ?? null,
      attrLengthMm: line.attrLengthMm ?? null,
      attrMaterial: line.attrMaterial ?? null,
      attrMesh: line.attrMesh ?? null,
      attrProfile: line.attrProfile ?? null,
      attrGauge: line.attrGauge ?? null,
      weightPerCm: line.weightPerCm ?? null,
      purity: line.purity ?? null,
      pureMetalName: line.pureMetalName ?? null,
      alloyMetalName: line.alloyMetalName ?? null,
    } satisfies RequisitionMaterial,
  }));
}

export function toWorkOrderData(order: OrderForReceipt): WorkOrderData {
  return {
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone ?? null,
    sellerName: order.sellerName ?? null,
    createdAt: order.createdAt.toISOString(),
    totalAmount: Number(order.totalAmount),
    advancePayment: Number(order.advancePayment ?? 0),
    items: order.items.map(
      (item): WorkOrderItem => ({
        quantity: item.quantity,
        title: item.productTitle?.trim() || item.product.title,
        unitPrice: Number(item.priceAtTime),
      })
    ),
    requisition: calculateMaterialsForOrder(
      order.items.map((item) => {
        const fromSnapshot =
          item.bomLines && item.bomLines.length > 0
            ? snapshotToComposition(item.bomLines)
            : (item.product.compositionItems ?? []);
        return {
          quantity: item.quantity,
          compositionItems: fromSnapshot,
        };
      })
    ),
  };
}
