"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { roundMoney2 } from "@/lib/decimal";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { assertTransition } from "@/lib/order-status";
import { REQUISITION_MATERIAL_SELECT } from "@/lib/material-requisition";

export type OrderActionState = {
  error?: string;
  success?: boolean;
  orderId?: string;
};

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone?: string;
  sellerName?: string;
  advancePayment?: number;
  items: CreateOrderItemInput[];
};

function normalizePhone(value?: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

function mergeItems(items: CreateOrderItemInput[]): CreateOrderItemInput[] {
  const merged = new Map<string, number>();

  for (const item of items) {
    const quantity = Math.max(1, Math.floor(item.quantity));
    merged.set(item.productId, (merged.get(item.productId) ?? 0) + quantity);
  }

  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function revalidateOrders() {
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/pedidos/historico");
  revalidateTag("dashboard");
}

export async function createOrder(
  input: CreateOrderInput
): Promise<OrderActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const name = input.customerName.trim();
  if (!name) {
    return { error: "Informe o nome do cliente." };
  }

  const sellerName = input.sellerName?.trim() || null;
  const customerPhone = normalizePhone(input.customerPhone);

  const mergedItems = mergeItems(input.items);
  if (mergedItems.length === 0) {
    return { error: "Adicione pelo menos uma peça à venda." };
  }

  const productIds = mergedItems.map((item) => item.productId);

  let products;
  try {
    products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isAvailable: true,
        isDeleted: false,
      },
      include: {
        compositionItems: {
          select: {
            quantityUsed: true,
            material: { select: REQUISITION_MATERIAL_SELECT },
          },
        },
      },
    });
  } catch (error) {
    logger.error("order.create_find_products", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Erro ao consultar produtos. Tente novamente." };
  }

  if (products.length !== productIds.length) {
    return { error: "Um ou mais produtos não estão disponíveis." };
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  const orderItems = mergedItems.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      priceAtTime: roundMoney2(product.price),
      costAtTime: roundMoney2(product.costPrice),
      productTitle: product.title,
      productCode: product.productCode,
      bomLines: {
        create: product.compositionItems.map((comp) => ({
          name: comp.material.name,
          type: comp.material.type,
          unit: comp.material.unit,
          quantityUsed: Number(comp.quantityUsed),
          attrCut: comp.material.attrCut,
          attrColor: comp.material.attrColor,
          attrSizeMm: comp.material.attrSizeMm,
          attrLengthMm: comp.material.attrLengthMm,
          attrMaterial: comp.material.attrMaterial,
          attrMesh: comp.material.attrMesh,
          attrProfile: comp.material.attrProfile,
          attrGauge: comp.material.attrGauge,
          weightPerCm: comp.material.weightPerCm,
          purity: comp.material.purity,
          pureMetalName: comp.material.pureMetalName,
          alloyMetalName: comp.material.alloyMetalName,
        })),
      },
    };
  });

  const totalAmount = roundMoney2(
    orderItems.reduce((sum, item) => sum + item.priceAtTime * item.quantity, 0)
  );

  const rawAdvance = Number(input.advancePayment ?? 0);
  if (!Number.isFinite(rawAdvance) || rawAdvance < 0) {
    return { error: "O valor do sinal é inválido." };
  }
  const advancePayment = roundMoney2(rawAdvance);
  if (advancePayment - totalAmount > 0.001) {
    return { error: "O sinal não pode ser maior que o total do pedido." };
  }

  try {
    const order = await prisma.order.create({
      data: {
        customerName: name,
        customerPhone,
        sellerName,
        status: "PENDING",
        totalAmount,
        advancePayment,
        items: { create: orderItems },
      },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "ORDER_CREATE",
      entity: "Order",
      entityId: order.id,
      after: { totalAmount, itemCount: orderItems.length },
    });

    revalidateOrders();

    return { success: true, orderId: order.id };
  } catch (error) {
    logger.error("order.create_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2021" || error.code === "P2022")
    ) {
      return {
        error:
          "Tabelas de pedidos não encontradas no banco. Aguarde o deploy concluir e tente novamente.",
      };
    }

    return { error: "Não foi possível enviar o pedido." };
  }
}

export async function completeOrder(orderId: string): Promise<OrderActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (!orderId) {
    return { error: "Pedido inválido." };
  }

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, version: true },
    });
    if (!existing) return { error: "Pedido não encontrado." };

    assertTransition(existing.status, "COMPLETED");

    const updated = await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING", version: existing.version },
      data: { status: "COMPLETED", version: { increment: 1 } },
    });

    if (updated.count !== 1) {
      return {
        error:
          "Não foi possível concluir o pedido (já alterado por outra sessão).",
      };
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "ORDER_COMPLETE",
      entity: "Order",
      entityId: orderId,
      before: { status: existing.status },
      after: { status: "COMPLETED" },
    });

    revalidateOrders();

    return { success: true, orderId };
  } catch (error) {
    logger.error("order.complete_failed", {
      orderId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível concluir o pedido." };
  }
}

export async function cancelOrder(
  orderId: string,
  reason?: string
): Promise<OrderActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (!orderId) return { error: "Pedido inválido." };

  const cancelReason = (reason ?? "").trim().slice(0, 240) || "Cancelado pelo administrador.";

  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, version: true },
    });
    if (!existing) return { error: "Pedido não encontrado." };

    assertTransition(existing.status, "CANCELLED");

    const updated = await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING", version: existing.version },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason,
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      return { error: "Não foi possível cancelar o pedido." };
    }

    await writeAuditLog({
      userId: session.user.id,
      action: "ORDER_CANCEL",
      entity: "Order",
      entityId: orderId,
      before: { status: existing.status },
      after: { status: "CANCELLED", cancelReason },
    });

    revalidateOrders();
    return { success: true, orderId };
  } catch (error) {
    logger.error("order.cancel_failed", {
      orderId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível cancelar o pedido." };
  }
}
