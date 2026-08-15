import { prisma } from "@/lib/prisma";
import {
  buildOrderDateRange,
  parseDateParam,
  formatDateParam,
} from "@/lib/date-range";
import { HistoricoTable } from "@/components/admin/historico-table";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { ADMIN_HISTORY_MAX } from "@/lib/list-limits";
import { asClient } from "@/lib/decimal";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

interface HistoricoPageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function HistoricoPedidosPage({
  searchParams,
}: HistoricoPageProps) {
  const params = (await searchParams) ?? {};

  // Normaliza os parâmetros: só ecoa de volta datas válidas para o picker.
  const parsedFrom = parseDateParam(params.from);
  const parsedTo = parseDateParam(params.to);
  const dateFilter = buildOrderDateRange(params.from, params.to);
  const fromValue = parsedFrom ? formatDateParam(parsedFrom) : undefined;
  const toValue = parsedTo ? formatDateParam(parsedTo) : fromValue;

  let serializedOrders: Parameters<typeof HistoricoTable>[0]["orders"] = [];
  let loadError: string | null = null;

  try {
    const orders = await prisma.order.findMany({
      where: {
        status: "COMPLETED",
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: ADMIN_HISTORY_MAX,
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

    serializedOrders = orders.map((order) => ({
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      sellerName: order.sellerName,
      createdAt: order.createdAt.toISOString(),
      totalAmount: Number(order.totalAmount),
      advancePayment: Number(order.advancePayment),
      items: order.items.map((item) => ({
        quantity: item.quantity,
        priceAtTime: Number(item.priceAtTime),
        bomLines: asClient(item.bomLines),
        product: {
          title: item.productTitle?.trim() || item.product.title,
          compositionItems: [],
        },
      })),
    }));
  } catch (error) {
    logger.error("historico.load_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    loadError =
      "Não foi possível carregar o histórico. Verifique se o banco de dados está atualizado.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-800">
          Histórico de Pedidos
        </h1>
        <p className="mt-1 text-stone-500">
          Consulte as vendas finalizadas por período (até {ADMIN_HISTORY_MAX}{" "}
          mais recentes).
        </p>
      </div>

      <DateRangePicker from={fromValue} to={toValue} />

      {loadError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </p>
      )}

      <HistoricoTable orders={serializedOrders} />
    </div>
  );
}
