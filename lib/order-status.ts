import type { OrderStatus } from "@prisma/client";

export const ORDER_STATUSES = ["PENDING", "COMPLETED", "CANCELLED"] as const;

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Transição de pedido inválida: ${from} → ${to}.`
    );
  }
}
