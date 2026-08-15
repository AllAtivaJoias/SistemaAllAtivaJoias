"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { asClient } from "@/lib/decimal";
import { logger } from "@/lib/logger";
import { buildProductSpec, type ProductSpec } from "@/lib/product-spec";

export type ProductSpecResult =
  | { status: "ok"; spec: ProductSpec }
  | { status: "not_found" }
  | { status: "unauthorized" }
  | { status: "error" };

/**
 * Carrega a especificação completa de uma peça para consulta/auditoria.
 * Requer administrador; nunca expõe detalhes internos em caso de erro.
 * `select` enxuto: só os campos usados na especificação (evita overfetching).
 */
export async function getProductSpec(
  productId: string
): Promise<ProductSpecResult> {
  try {
    await requireAdmin();
  } catch {
    return { status: "unauthorized" };
  }

  const id = typeof productId === "string" ? productId.trim() : "";
  if (!id) return { status: "not_found" };

  try {
    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        productCode: true,
        price: true,
        costPrice: true,
        totalWeightG: true,
        isAvailable: true,
        category: { select: { id: true, name: true } },
        compositionItems: {
          orderBy: [{ sequenceOrder: "asc" }, { createdAt: "asc" }],
          select: {
            quantityUsed: true,
            sequenceOrder: true,
            lineKind: true,
            material: {
              select: {
                id: true,
                name: true,
                type: true,
                unit: true,
                purchasePrice: true,
                purchaseQuantity: true,
                attrCut: true,
                attrColor: true,
                attrSizeMm: true,
                attrLengthMm: true,
                attrMaterial: true,
                attrMesh: true,
                attrProfile: true,
                attrGauge: true,
                weightPerCm: true,
                purity: true,
                pureMetalName: true,
                alloyMetalName: true,
              },
            },
          },
        },
      },
    });

    if (!product) return { status: "not_found" };

    return { status: "ok", spec: buildProductSpec(asClient(product)) };
  } catch (error) {
    logger.error("product_spec.load_failed", {
      productId: id,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { status: "error" };
  }
}
