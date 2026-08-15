import { NextResponse } from "next/server";

import { requireAdmin, AuthError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Short-polling de pedidos pendentes.
 *
 * Query params:
 * - `mode=count` → só `{ count }` (badge da sidebar; query leve).
 * - default → lista para o painel (SEM composição — impressão busca sob demanda).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return NextResponse.json({ error: "Não autorizado." }, { status });
  }

  const mode = new URL(request.url).searchParams.get("mode");

  try {
    if (mode === "count") {
      const count = await prisma.order.count({
        where: { status: "PENDING" },
      });
      return NextResponse.json({ count, orders: [] });
    }

    // Lista leve: título da peça basta para o board; a requisição de materiais
    // é carregada só no momento da impressão (/work-order).
    const orders = await prisma.order.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        sellerName: true,
        createdAt: true,
        totalAmount: true,
        advancePayment: true,
        items: {
          select: {
            quantity: true,
            priceAtTime: true,
            productTitle: true,
            product: { select: { title: true } },
          },
        },
      },
    });

    const serialized = orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      sellerName: order.sellerName,
      createdAt: order.createdAt.toISOString(),
      totalAmount: order.totalAmount,
      advancePayment: order.advancePayment,
      items: order.items.map((item) => ({
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
        product: {
          title: item.productTitle?.trim() || item.product.title,
          compositionItems: [] as const,
        },
      })),
    }));

    return NextResponse.json({ count: serialized.length, orders: serialized });
  } catch (error) {
    logger.error("pending_orders.failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro ao consultar pedidos.", count: 0, orders: [] },
      { status: 500 }
    );
  }
}
