import { NextResponse } from "next/server";

import { requireAdmin, AuthError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { toWorkOrderData } from "@/lib/receipt";
import { asClient } from "@/lib/decimal";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return NextResponse.json({ error: "Não autorizado." }, { status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
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
            bomLines: true,
            product: { select: { title: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      toWorkOrderData(
        asClient({
          ...order,
          items: order.items.map((item) => ({
            ...item,
            product: { title: item.product.title, compositionItems: [] },
          })),
        })
      )
    );
  } catch (error) {
    logger.error("work_order.failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro ao montar a requisição de materiais." },
      { status: 500 }
    );
  }
}
