import { Decimal, roundTo, toNonNegativeDecimal } from "@/lib/decimal";

export const UNITS = ["g", "mg", "ct", "un", "cm", "par"] as const;
export type Unit = (typeof UNITS)[number];

export const MATERIAL_TYPES = ["metal", "gema", "componente"] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export type PricingMode =
  | "markupPercent"
  | "marginPercent"
  | "fixedProfit"
  | "finalPrice";

export type MaterialLine = {
  name: string;
  packagePrice: number;
  packageQuantity: number;
  unit: Unit;
  quantityUsed: number;
};

export type AdditionalCostKind = "fixed" | "percent";

export type AdditionalCost = {
  label: string;
  kind: AdditionalCostKind;
  value: number;
  isPackaging?: boolean;
};

export type PricingInput = {
  materials: MaterialLine[];
  additionalCosts: AdditionalCost[];
  mode: PricingMode;
  strategyValue: number;
};

export type MaterialCost = {
  name: string;
  quantityUsed: number;
  unit: Unit;
  cost: number;
  sharePercent: number;
};

export type PricingResult = {
  compositionCost: number;
  additionalFixedCost: number;
  additionalPercentRate: number;
  additionalPercentCost: number;
  packagingCost: number;
  totalCost: number;
  sellingPrice: number;
  netProfit: number;
  marginPercent: number;
  markupPercent: number;
  materialCosts: MaterialCost[];
  costliestMaterial: string | null;
  isValid: boolean;
};

const ZERO = new Decimal(0);
const HUNDRED = new Decimal(100);
const MONEY_PLACES = 4;
const PERCENT_PLACES = 4;

function d(value: unknown): Decimal {
  return toNonNegativeDecimal(value);
}

function money(value: Decimal): number {
  return roundTo(value, MONEY_PLACES).toNumber();
}

function pct(value: Decimal): number {
  return roundTo(value, PERCENT_PLACES).toNumber();
}

/** Custo rateado: (usado / lote) × preço do lote. */
export function computeMaterialCost(line: MaterialLine): number {
  return money(computeMaterialCostD(line));
}

function computeMaterialCostD(line: MaterialLine): Decimal {
  const packageQuantity = d(line.packageQuantity);
  if (packageQuantity.lte(0)) return ZERO;
  const used = d(line.quantityUsed);
  const price = d(line.packagePrice);
  return used.div(packageQuantity).mul(price);
}

export function computeCompositionCost(materials: MaterialLine[]): number {
  return money(
    materials.reduce((sum, line) => sum.add(computeMaterialCostD(line)), ZERO)
  );
}

function resolveSellingPrice(
  baseCost: Decimal,
  percentRate: Decimal,
  mode: PricingMode,
  strategyValue: unknown
): { price: Decimal; isValid: boolean } {
  let value: Decimal;
  try {
    value = new Decimal(String(strategyValue ?? 0));
    if (!value.isFinite()) value = ZERO;
  } catch {
    value = ZERO;
  }

  switch (mode) {
    case "markupPercent": {
      const m = value.div(HUNDRED);
      const denominator = new Decimal(1).minus(percentRate.mul(new Decimal(1).plus(m)));
      if (denominator.lte(0)) return { price: ZERO, isValid: false };
      return {
        price: baseCost.mul(new Decimal(1).plus(m)).div(denominator),
        isValid: true,
      };
    }
    case "marginPercent": {
      const mg = value.div(HUNDRED);
      const denominator = new Decimal(1).minus(percentRate).minus(mg);
      if (mg.gte(1) || denominator.lte(0)) {
        return { price: ZERO, isValid: false };
      }
      return { price: baseCost.div(denominator), isValid: true };
    }
    case "fixedProfit": {
      const denominator = new Decimal(1).minus(percentRate);
      if (denominator.lte(0)) return { price: ZERO, isValid: false };
      return {
        price: baseCost.plus(d(value)).div(denominator),
        isValid: true,
      };
    }
    case "finalPrice": {
      const price = d(value);
      return { price, isValid: price.gt(0) };
    }
    default:
      return { price: ZERO, isValid: false };
  }
}

export function computePricing(input: PricingInput): PricingResult {
  const compositionCost = (input.materials ?? []).reduce(
    (sum, line) => sum.add(computeMaterialCostD(line)),
    ZERO
  );

  let additionalFixedCost = ZERO;
  let additionalPercentRate = ZERO;
  let packagingCost = ZERO;

  for (const cost of input.additionalCosts ?? []) {
    const value = d(cost.value);
    if (cost.kind === "fixed") {
      additionalFixedCost = additionalFixedCost.plus(value);
      if (cost.isPackaging) packagingCost = packagingCost.plus(value);
    } else {
      additionalPercentRate = additionalPercentRate.plus(value.div(HUNDRED));
    }
  }

  const baseCost = compositionCost.plus(additionalFixedCost);
  const { price, isValid } = resolveSellingPrice(
    baseCost,
    additionalPercentRate,
    input.mode,
    input.strategyValue
  );

  const sellingPrice = d(price);
  const additionalPercentCost = sellingPrice.mul(additionalPercentRate);
  const totalCost = baseCost.plus(additionalPercentCost);
  const netProfit = sellingPrice.minus(totalCost);

  const marginPercent = sellingPrice.gt(0)
    ? netProfit.div(sellingPrice).mul(HUNDRED)
    : ZERO;
  const markupPercent = totalCost.gt(0)
    ? netProfit.div(totalCost).mul(HUNDRED)
    : ZERO;

  const materialCosts: MaterialCost[] = (input.materials ?? []).map((line) => {
    const cost = computeMaterialCostD(line);
    return {
      name: (line.name ?? "").trim() || "Material",
      quantityUsed: d(line.quantityUsed).toNumber(),
      unit: line.unit,
      cost: money(cost),
      sharePercent: compositionCost.gt(0)
        ? pct(cost.div(compositionCost).mul(HUNDRED))
        : 0,
    };
  });

  const costliest = materialCosts.reduce<MaterialCost | null>(
    (max, item) => (max === null || item.cost > max.cost ? item : max),
    null
  );

  return {
    compositionCost: money(compositionCost),
    additionalFixedCost: money(additionalFixedCost),
    additionalPercentRate: additionalPercentRate.toNumber(),
    additionalPercentCost: money(additionalPercentCost),
    packagingCost: money(packagingCost),
    totalCost: money(totalCost),
    sellingPrice: money(sellingPrice),
    netProfit: money(netProfit),
    marginPercent: pct(marginPercent),
    markupPercent: pct(markupPercent),
    materialCosts,
    costliestMaterial: costliest && costliest.cost > 0 ? costliest.name : null,
    isValid,
  };
}

export type SimulationRow = {
  markupPercent: number;
  sellingPrice: number;
  netProfit: number;
  marginPercent: number;
};

export function buildSimulation(
  baseCost: number,
  percentRate: number,
  scenarios: number[] = [50, 80, 100, 150, 200]
): SimulationRow[] {
  const base = d(baseCost);
  const rate = d(percentRate);
  return scenarios.map((markup) => {
    const { price } = resolveSellingPrice(base, rate, "markupPercent", markup);
    const totalCost = base.plus(price.mul(rate));
    const netProfit = price.minus(totalCost);
    const marginPercent = price.gt(0)
      ? netProfit.div(price).mul(HUNDRED)
      : ZERO;
    return {
      markupPercent: markup,
      sellingPrice: money(price),
      netProfit: money(netProfit),
      marginPercent: pct(marginPercent),
    };
  });
}

export type ProjectionRow = {
  units: number;
  revenue: number;
  profit: number;
};

export function buildProjection(
  sellingPrice: number,
  profitPerUnit: number,
  volumes: number[] = [5, 10, 25, 50]
): ProjectionRow[] {
  const price = d(sellingPrice);
  const profit = new Decimal(String(profitPerUnit ?? 0));
  return volumes.map((units) => ({
    units,
    revenue: money(price.mul(units)),
    profit: money(profit.mul(units)),
  }));
}

export type FinancialAlert = {
  level: "danger" | "warning" | "info" | "success";
  message: string;
};

export function buildAlerts(result: PricingResult): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];

  if (!result.isValid) {
    alerts.push({
      level: "danger",
      message:
        "A combinação de custos percentuais e estratégia é inviável (o preço tenderia ao infinito). Ajuste a margem ou as taxas.",
    });
    return alerts;
  }

  if (result.sellingPrice <= 0) {
    alerts.push({
      level: "info",
      message: "Preencha a composição da joia para calcular o preço de venda.",
    });
    return alerts;
  }

  if (result.netProfit <= 0) {
    alerts.push({
      level: "danger",
      message:
        "Prejuízo: o preço de venda não cobre o custo total. Reveja a precificação.",
    });
  } else if (result.marginPercent < 30) {
    alerts.push({
      level: "warning",
      message:
        "Margem enxuta para o setor joalheiro (abaixo de 30%). Avalie mão de obra, cravação e taxas.",
    });
  } else if (result.marginPercent >= 60) {
    alerts.push({
      level: "success",
      message: "Excelente margem de lucro. Confira se o preço está competitivo.",
    });
  }

  if (
    result.packagingCost > 0 &&
    result.totalCost > 0 &&
    result.packagingCost / result.totalCost > 0.15
  ) {
    alerts.push({
      level: "warning",
      message:
        "A embalagem de luxo representa mais de 15% do custo total. Reavalie o fornecedor.",
    });
  }

  const costliest = result.materialCosts.reduce<
    (typeof result.materialCosts)[number] | null
  >((max, item) => (max === null || item.cost > max.cost ? item : max), null);

  if (
    costliest &&
    result.compositionCost > 0 &&
    costliest.cost / result.compositionCost > 0.5
  ) {
    alerts.push({
      level: "warning",
      message: `O material "${costliest.name}" concentra mais da metade do custo da peça. Avalie fornecedores ou o peso empregado.`,
    });
  }

  if (result.additionalPercentRate >= 0.2) {
    alerts.push({
      level: "warning",
      message:
        "Taxas percentuais (cartão/comissão) somam 20% ou mais do preço. Isso reduz bastante o lucro líquido.",
    });
  }

  return alerts;
}
