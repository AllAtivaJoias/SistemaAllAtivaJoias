"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import type { MaterialType, PricingMode, Unit } from "@/lib/pricing";
import type { InsumoAttrs } from "@/lib/material-requisition";
import {
  expandPattern,
  type ExpandablePattern,
} from "@/lib/supply-pattern-expand";
import { roundMoney2, roundMoney4, roundQty4, asClient } from "@/lib/decimal";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { buildStoneName } from "@/lib/stone";

export type FichaActionState = {
  error?: string;
  success?: boolean;
};

export type FichaLineKind =
  | "pedra"
  | "metal"
  | "corrente"
  | "fio"
  | "outro";

export type SaveFichaMaterial = {
  materialId?: string;
  name: string;
  type: MaterialType;
  packagePrice: number;
  packageQuantity: number;
  unit: Unit;
  quantityUsed: number;
  sequenceOrder?: number;
  lineKind?: FichaLineKind;
  sourcePatternId?: string | null;
  patternQty?: number | null;
} & InsumoAttrs;

export type SaveFichaPatternApplied = {
  patternId: string;
  /** Quantidade total de pedras (round-robin nas cores da Ordem). */
  totalStones: number;
  sequenceOrder?: number;
};

export type SaveFichaInput = {
  productId: string;
  mode: PricingMode;
  strategyValue: number;
  sellingPrice: number;
  totalCost: number;
  totalWeightG?: number | null;
  expectedVersion?: number;
  materials: SaveFichaMaterial[];
  patternsApplied?: SaveFichaPatternApplied[];
  additionalCosts?: {
    label: string;
    kind: "fixed" | "percent";
    value: number;
    isPackaging?: boolean;
  }[];
};

const PATTERN_INCLUDE = {
  items: {
    orderBy: { sequenceOrder: "asc" as const },
    include: {
      stone: true,
      alloy: true,
      chain: true,
      wire: {
        include: {
          alloy: { select: { id: true, name: true, pricePerGram: true } },
        },
      },
    },
  },
} as const;

const round2 = (value: number): number => roundMoney2(value);

/**
 * Nome único de Material para gemas: evita que pedras com o mesmo nome comercial
 * e cores/lapidações diferentes colidam no upsert por `name` e sobrescrevam
 * o attrColor (bug que fazia todas as pedras saírem com a cor da última salva).
 */
function resolveMaterialName(line: SaveFichaMaterial): string {
  const raw = line.name.trim();
  if (line.type !== "gema") return raw;

  const cut = line.attrCut?.trim() || "";
  const color = line.attrColor?.trim() || "";
  if (cut || color || line.attrSizeMm != null) {
    return buildStoneName({
      cut,
      color,
      widthMm: line.attrSizeMm,
      lengthMm: line.attrLengthMm,
    });
  }
  return raw;
}

function toSaveLine(
  leaf: ReturnType<typeof expandPattern>[number]
): SaveFichaMaterial {
  return {
    name: leaf.name,
    type: leaf.type,
    packagePrice: leaf.packagePrice,
    packageQuantity: leaf.packageQuantity,
    unit: leaf.unit,
    quantityUsed: leaf.quantityUsed,
    sequenceOrder: leaf.sequenceOrder,
    lineKind: leaf.lineKind,
    sourcePatternId: leaf.sourcePatternId,
    patternQty: leaf.patternQty,
    attrCut: leaf.attrCut,
    attrColor: leaf.attrColor,
    attrSizeMm: leaf.attrSizeMm,
    attrLengthMm: leaf.attrLengthMm,
    attrMaterial: leaf.attrMaterial,
    attrMesh: leaf.attrMesh,
    attrProfile: leaf.attrProfile,
    attrGauge: leaf.attrGauge,
    weightPerCm: leaf.weightPerCm,
    purity: leaf.purity,
    pureMetalName: leaf.pureMetalName,
    alloyMetalName: leaf.alloyMetalName,
  };
}

export async function saveFichaTecnica(
  input: SaveFichaInput
): Promise<FichaActionState> {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  if (!input.productId) {
    return { error: "Selecione uma peça para salvar a ficha técnica." };
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId, isDeleted: false },
    select: {
      id: true,
      version: true,
      price: true,
      costPrice: true,
      pricingStrategy: true,
      pricingValue: true,
    },
  });
  if (!product) {
    return { error: "Peça não encontrada." };
  }

  if (
    typeof input.expectedVersion === "number" &&
    input.expectedVersion !== product.version
  ) {
    return {
      error:
        "Esta ficha foi alterada por outra sessão. Recarregue a peça e tente novamente.",
    };
  }

  // Expande Ordens no servidor (fonte da verdade — não confiar só no client).
  const patternLines: SaveFichaMaterial[] = [];
  const applied = input.patternsApplied ?? [];
  if (applied.length > 0) {
    const ids = [...new Set(applied.map((a) => a.patternId).filter(Boolean))];
    const patterns = await prisma.supplyPattern.findMany({
      where: { id: { in: ids }, isActive: true },
      include: PATTERN_INCLUDE,
    });
    const byId = new Map(patterns.map((p) => [p.id, p]));

    for (const app of applied) {
      const pattern = byId.get(app.patternId);
      if (!pattern) continue;

      const stones = Math.max(0, Math.floor(Number(app.totalStones) || 0));
      const hasNonStone = pattern.items.some(
        (item) => item.itemKind !== "pedra"
      );
      // Pedras exigem total > 0; ordens só com metal/fio ainda expandem.
      if (stones <= 0 && !hasNonStone) continue;

      const expandable: ExpandablePattern = {
        id: pattern.id,
        name: pattern.name,
        items: asClient(pattern.items),
      };
      for (const leaf of expandPattern(expandable, stones)) {
        patternLines.push(toSaveLine(leaf));
      }
    }
  }

  // Avulsos: ignora linhas que já vieram marcadas como padrão (evita duplicar
  // se o client também enviou folhas expandidas).
  const avulsoLines = input.materials.filter(
    (line) =>
      line.name.trim() &&
      line.quantityUsed > 0 &&
      !line.sourcePatternId
  );

  const validLines = [...avulsoLines, ...patternLines];

  try {
    const usedByMaterial = new Map<
      string,
      {
        quantityUsed: number;
        sequenceOrder: number;
        lineKind: string;
        sourcePatternId: string | null;
        patternQty: number | null;
      }
    >();

    for (const [index, line] of validLines.entries()) {
      const name = resolveMaterialName(line);

      const attrs = {
        attrCut: line.attrCut?.trim() || null,
        attrColor: line.attrColor?.trim() || null,
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
      };

      const material = await prisma.material.upsert({
        where: { name },
        update: {
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
          ...attrs,
        },
        create: {
          name,
          type: line.type,
          purchasePrice: line.packagePrice,
          purchaseQuantity: line.packageQuantity,
          unit: line.unit,
          ...attrs,
        },
        select: { id: true },
      });

      const sequenceOrder =
        typeof line.sequenceOrder === "number" && Number.isFinite(line.sequenceOrder)
          ? Math.max(0, Math.floor(line.sequenceOrder))
          : index;
      const lineKind = line.lineKind ?? "outro";
      const sourcePatternId = line.sourcePatternId?.trim() || null;
      const patternQty =
        line.patternQty !== null &&
        line.patternQty !== undefined &&
        Number.isFinite(line.patternQty)
          ? line.patternQty
          : null;

      const existing = usedByMaterial.get(material.id);
      if (existing) {
        existing.quantityUsed += line.quantityUsed;
        existing.sequenceOrder = Math.min(existing.sequenceOrder, sequenceOrder);
        // Mantém o padrão de origem se todas as linhas mergeadas forem do mesmo.
        if (
          existing.sourcePatternId &&
          sourcePatternId &&
          existing.sourcePatternId !== sourcePatternId
        ) {
          existing.sourcePatternId = null;
          existing.patternQty = null;
        }
      } else {
        usedByMaterial.set(material.id, {
          quantityUsed: line.quantityUsed,
          sequenceOrder,
          lineKind,
          sourcePatternId,
          patternQty,
        });
      }
    }

    const totalWeightG =
      input.totalWeightG === null || input.totalWeightG === undefined
        ? null
        : Number.isFinite(input.totalWeightG) && input.totalWeightG >= 0
          ? input.totalWeightG
          : null;

    const additionalCosts = (input.additionalCosts ?? [])
      .filter((cost) => cost.label.trim() && Number(cost.value) > 0)
      .map((cost, index) => ({
        productId: input.productId,
        label: cost.label.trim().slice(0, 120),
        kind: cost.kind === "percent" ? "percent" : "fixed",
        value: roundMoney4(cost.value),
        isPackaging: Boolean(cost.isPackaging),
        sortOrder: index,
      }));

    await prisma.$transaction([
      prisma.compositionItem.deleteMany({
        where: { productId: input.productId },
      }),
      ...[...usedByMaterial.entries()].map(
        ([
          materialId,
          { quantityUsed, sequenceOrder, lineKind, sourcePatternId, patternQty },
        ]) =>
          prisma.compositionItem.create({
            data: {
              productId: input.productId,
              materialId,
              quantityUsed: roundQty4(quantityUsed),
              sequenceOrder,
              lineKind,
              sourcePatternId,
              patternQty: patternQty != null ? roundQty4(patternQty) : null,
            },
          })
      ),
      prisma.productAdditionalCost.deleteMany({
        where: { productId: input.productId },
      }),
      ...(additionalCosts.length > 0
        ? [
            prisma.productAdditionalCost.createMany({
              data: additionalCosts,
            }),
          ]
        : []),
      prisma.product.update({
        where: { id: input.productId, version: product.version },
        data: {
          price: round2(input.sellingPrice),
          costPrice: round2(input.totalCost),
          pricingStrategy: input.mode,
          pricingValue: roundMoney4(input.strategyValue),
          totalWeightG,
          version: { increment: 1 },
        },
      }),
    ]);

    await writeAuditLog({
      userId: session.user.id,
      action: "FICHA_SAVE",
      entity: "Product",
      entityId: input.productId,
      before: {
        price: product.price,
        costPrice: product.costPrice,
        pricingStrategy: product.pricingStrategy,
        pricingValue: product.pricingValue,
      },
      after: {
        price: round2(input.sellingPrice),
        costPrice: round2(input.totalCost),
        pricingStrategy: input.mode,
        pricingValue: input.strategyValue,
        additionalCosts: additionalCosts.length,
      },
    });
  } catch (error) {
    logger.error("ficha.save_failed", {
      productId: input.productId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível salvar a ficha técnica." };
  }

  revalidatePath("/admin/ficha-tecnica");
  revalidatePath("/admin/produtos");
  revalidatePath("/");
  revalidateTag("dashboard");

  return { success: true };
}
