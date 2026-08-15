import { computeMaterialCost, type Unit } from "@/lib/pricing";
import { buildStoneName, formatStoneDimension } from "@/lib/stone";

/**
 * Camada de leitura da "Especificação Completa da Peça".
 *
 * Fonte da verdade: `Product.compositionItems[].material` — a mesma BOM
 * materializada pela Ficha Técnica. Aqui apenas classificamos e agregamos
 * para exibição/auditoria; nenhum campo é inventado e nenhuma regra de
 * negócio é duplicada (custo por linha reutiliza `computeMaterialCost`).
 */

/** Campos do Material realmente necessários para a especificação. */
export interface SpecMaterial {
  id: string;
  name: string;
  type: string;
  unit: string;
  purchasePrice: number;
  purchaseQuantity: number;
  attrCut: string | null;
  attrColor: string | null;
  attrSizeMm: number | null;
  attrLengthMm: number | null;
  attrMaterial: string | null;
  attrMesh: string | null;
  attrProfile: string | null;
  attrGauge: number | null;
  weightPerCm: number | null;
  purity: number | null;
  pureMetalName: string | null;
  alloyMetalName: string | null;
}

export interface SpecCompositionItem {
  quantityUsed: number;
  sequenceOrder: number;
  lineKind: string;
  material: SpecMaterial;
}

export interface SpecProductSource {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productCode: string | null;
  price: number;
  costPrice: number;
  totalWeightG: number | null;
  isAvailable: boolean;
  category: { id: string; name: string } | null;
  compositionItems: SpecCompositionItem[];
}

export type SpecKind = "metal" | "pedra" | "fio" | "corrente" | "outro";

export interface MetalSpecRow {
  key: string;
  material: string;
  /** Liga/teor legível (ex.: "Ouro 24k · 75%"), ou null. */
  alloy: string | null;
  purityPercent: number | null;
  quantity: number;
  unit: string;
  weightG: number | null;
  unitCost: number;
  totalCost: number;
}

export interface StoneSpecRow {
  key: string;
  label: string;
  material: string;
  color: string | null;
  cut: string | null;
  widthMm: number | null;
  lengthMm: number | null;
  /** Dimensão formatada canônica: "4mm", "4x6mm" ou "Sem medida". */
  dimension: string;
  quantity: number;
  totalCost: number;
}

export interface WireSpecRow {
  key: string;
  name: string;
  material: string | null;
  profile: string | null;
  gaugeMm: number | null;
  quantity: number;
  unit: string;
  weightG: number | null;
  lengthCm: number | null;
  totalCost: number;
}

export interface ChainSpecRow {
  key: string;
  name: string;
  mesh: string | null;
  material: string | null;
  thicknessMm: number | null;
  quantity: number;
  unit: string;
  weightG: number | null;
  lengthCm: number | null;
  totalCost: number;
}

export interface OtherSpecRow {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  totalCost: number;
}

export interface CompositionRow {
  key: string;
  name: string;
  kind: SpecKind;
  categoryLabel: string;
  quantityLabel: string;
  detailLabel: string;
  totalCost: number;
}

export interface ProductSpec {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productCode: string | null;
  price: number;
  costPrice: number;
  isAvailable: boolean;
  categoryName: string | null;
  totalWeightG: number | null;
  itemCount: number;
  /** Custo total apurado (Ficha Técnica) menos o custo dos insumos da BOM. */
  compositionCost: number;
  /** Margem sobre o preço (preço − custo) / preço, em %. Null se preço ≤ 0. */
  marginPercent: number | null;
  metals: {
    rows: MetalSpecRow[];
    totalWeightG: number;
    totalCost: number;
  };
  stones: {
    rows: StoneSpecRow[];
    totalQuantity: number;
    totalCost: number;
  };
  wires: {
    rows: WireSpecRow[];
    totalCost: number;
  };
  chains: {
    rows: ChainSpecRow[];
    totalCost: number;
  };
  others: {
    rows: OtherSpecRow[];
    totalCost: number;
  };
  composition: CompositionRow[];
}

const KIND_LABELS: Record<SpecKind, string> = {
  metal: "Metal",
  pedra: "Pedra",
  fio: "Fio",
  corrente: "Corrente",
  outro: "Componente",
};

function num(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/**
 * Classificação idêntica à `inferLineKind` da Ficha Técnica: usa o `lineKind`
 * persistido e, na ausência, deduz pelos atributos do material.
 */
export function classifySpecItem(item: SpecCompositionItem): SpecKind {
  const kind = item.lineKind;
  if (
    kind === "pedra" ||
    kind === "metal" ||
    kind === "corrente" ||
    kind === "fio"
  ) {
    return kind;
  }
  const m = item.material;
  if (m.type === "gema") return "pedra";
  if (m.attrMesh) return "corrente";
  if (m.attrProfile) return "fio";
  if (m.type === "metal") return "metal";
  return "outro";
}

/** Custo rateado da linha — mesma fórmula da precificação (pricing.ts). */
function lineCost(item: SpecCompositionItem): number {
  return computeMaterialCost({
    name: item.material.name,
    packagePrice: num(item.material.purchasePrice),
    packageQuantity: num(item.material.purchaseQuantity),
    unit: (item.material.unit || "un") as Unit,
    quantityUsed: num(item.quantityUsed),
  });
}

function unitCost(material: SpecMaterial): number {
  const qty = num(material.purchaseQuantity);
  const price = num(material.purchasePrice);
  if (qty <= 0) return price;
  return computeMaterialCost({
    name: material.name,
    packagePrice: price,
    packageQuantity: qty,
    unit: (material.unit || "un") as Unit,
    quantityUsed: 1,
  });
}

/** Converte a quantidade usada em gramas quando a unidade é de massa. */
function toGrams(unit: string, quantity: number): number | null {
  const u = (unit || "").toLowerCase();
  if (u === "g") return quantity;
  if (u === "mg") return quantity / 1000;
  return null;
}

function metalLabel(m: SpecMaterial): string {
  return m.attrMaterial?.trim() || m.name.trim();
}

function metalAlloy(m: SpecMaterial): string | null {
  const pure = m.pureMetalName?.trim() || null;
  const alloy = m.alloyMetalName?.trim() || null;
  const parts = [pure, alloy].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? parts.join(" + ") : null;
}

function stoneLabel(m: SpecMaterial): string {
  if (m.attrCut || m.attrColor || m.attrSizeMm != null) {
    return buildStoneName({
      cut: m.attrCut ?? "",
      color: m.attrColor ?? "",
      widthMm: m.attrSizeMm,
      lengthMm: m.attrLengthMm,
    });
  }
  return m.name.trim();
}

function wireName(m: SpecMaterial): string {
  const gauge =
    m.attrGauge != null && Number.isFinite(m.attrGauge)
      ? `${m.attrGauge}mm`
      : "";
  const parts = [m.attrMaterial, m.attrProfile, gauge]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => capitalize(p.trim()));
  return parts.length > 0 ? parts.join(" ") : m.name.trim();
}

function chainName(m: SpecMaterial): string {
  const thickness =
    m.attrSizeMm != null && Number.isFinite(m.attrSizeMm)
      ? `${m.attrSizeMm}mm`
      : "";
  const parts = [m.attrMesh, m.attrMaterial, thickness]
    .filter((p): p is string => Boolean(p && p.trim()))
    .map((p) => capitalize(p.trim()));
  return parts.length > 0 ? parts.join(" ") : m.name.trim();
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

/**
 * Agrega a composição em seções de exibição. Entrada já serializada
 * (Decimals → number). Puro e determinístico — testável isoladamente.
 */
export function buildProductSpec(product: SpecProductSource): ProductSpec {
  const items = [...product.compositionItems].sort(
    (a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0)
  );

  const metals: MetalSpecRow[] = [];
  const stones: StoneSpecRow[] = [];
  const wires: WireSpecRow[] = [];
  const chains: ChainSpecRow[] = [];
  const others: OtherSpecRow[] = [];
  const composition: CompositionRow[] = [];

  for (const item of items) {
    const m = item.material;
    const kind = classifySpecItem(item);
    const quantity = num(item.quantityUsed);
    const cost = round2(lineCost(item));
    const key = `${kind}:${m.id}`;

    if (kind === "metal") {
      const weightG = toGrams(m.unit, quantity);
      metals.push({
        key,
        material: metalLabel(m),
        alloy: metalAlloy(m),
        purityPercent:
          m.purity != null && Number.isFinite(m.purity)
            ? round2(m.purity * 100)
            : null,
        quantity: round4(quantity),
        unit: m.unit,
        weightG: weightG != null ? round4(weightG) : null,
        unitCost: round4(unitCost(m)),
        totalCost: cost,
      });
    } else if (kind === "pedra") {
      stones.push({
        key,
        label: stoneLabel(m),
        material: m.name.trim(),
        color: m.attrColor?.trim() || null,
        cut: m.attrCut?.trim() || null,
        widthMm: m.attrSizeMm,
        lengthMm: m.attrLengthMm,
        dimension: formatStoneDimension({
          widthMm: m.attrSizeMm,
          lengthMm: m.attrLengthMm,
        }),
        quantity: round4(quantity),
        totalCost: cost,
      });
    } else if (kind === "fio") {
      const u = (m.unit || "").toLowerCase();
      const wpc = num(m.weightPerCm);
      let weightG: number | null;
      let lengthCm: number | null;
      if (u === "cm") {
        lengthCm = quantity;
        weightG = wpc > 0 ? quantity * wpc : null;
      } else {
        weightG = toGrams(m.unit, quantity);
        lengthCm = wpc > 0 && weightG != null ? weightG / wpc : null;
      }
      wires.push({
        key,
        name: wireName(m),
        material: m.attrMaterial?.trim() || null,
        profile: m.attrProfile?.trim() || null,
        gaugeMm: m.attrGauge,
        quantity: round4(quantity),
        unit: m.unit,
        weightG: weightG != null ? round4(weightG) : null,
        lengthCm: lengthCm != null ? round4(lengthCm) : null,
        totalCost: cost,
      });
    } else if (kind === "corrente") {
      const u = (m.unit || "").toLowerCase();
      const wpc = num(m.weightPerCm);
      const lengthCm = u === "cm" ? quantity : null;
      const weightG =
        lengthCm != null && wpc > 0 ? lengthCm * wpc : toGrams(m.unit, quantity);
      chains.push({
        key,
        name: chainName(m),
        mesh: m.attrMesh?.trim() || null,
        material: m.attrMaterial?.trim() || null,
        thicknessMm: m.attrSizeMm,
        quantity: round4(quantity),
        unit: m.unit,
        weightG: weightG != null ? round4(weightG) : null,
        lengthCm: lengthCm != null ? round4(lengthCm) : null,
        totalCost: cost,
      });
    } else {
      others.push({
        key,
        name: m.name.trim(),
        quantity: round4(quantity),
        unit: m.unit,
        totalCost: cost,
      });
    }

    composition.push({
      key,
      name:
        kind === "pedra"
          ? stoneLabel(m)
          : kind === "fio"
            ? wireName(m)
            : kind === "corrente"
              ? chainName(m)
              : kind === "metal"
                ? metalLabel(m)
                : m.name.trim(),
      kind,
      categoryLabel: KIND_LABELS[kind],
      quantityLabel: buildQuantityLabel(kind, quantity, m.unit),
      detailLabel: buildDetailLabel(kind, m),
      totalCost: cost,
    });
  }

  const sum = (values: number[]): number =>
    round2(values.reduce((acc, v) => acc + v, 0));

  const metalsTotalWeight = round4(
    metals.reduce((acc, r) => acc + num(r.weightG), 0)
  );
  const compositionCost = sum(composition.map((r) => r.totalCost));
  const marginPercent =
    product.price > 0
      ? round2(((product.price - product.costPrice) / product.price) * 100)
      : null;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    imageUrl: product.imageUrl,
    productCode: product.productCode,
    price: product.price,
    costPrice: product.costPrice,
    isAvailable: product.isAvailable,
    categoryName: product.category?.name ?? null,
    totalWeightG: product.totalWeightG,
    itemCount: items.length,
    compositionCost,
    marginPercent,
    metals: {
      rows: metals,
      totalWeightG: metalsTotalWeight,
      totalCost: sum(metals.map((r) => r.totalCost)),
    },
    stones: {
      rows: stones,
      totalQuantity: round4(stones.reduce((acc, r) => acc + r.quantity, 0)),
      totalCost: sum(stones.map((r) => r.totalCost)),
    },
    wires: {
      rows: wires,
      totalCost: sum(wires.map((r) => r.totalCost)),
    },
    chains: {
      rows: chains,
      totalCost: sum(chains.map((r) => r.totalCost)),
    },
    others: {
      rows: others,
      totalCost: sum(others.map((r) => r.totalCost)),
    },
    composition,
  };
}

function buildQuantityLabel(
  kind: SpecKind,
  quantity: number,
  unit: string
): string {
  const q = round4(quantity);
  if (kind === "pedra") return `${formatNumberPtBr(q)}x`;
  return `${formatNumberPtBr(q)} ${unit}`.trim();
}

function buildDetailLabel(kind: SpecKind, m: SpecMaterial): string {
  if (kind === "pedra") {
    return formatStoneDimension({
      widthMm: m.attrSizeMm,
      lengthMm: m.attrLengthMm,
    });
  }
  if (kind === "fio") {
    const parts = [
      m.attrProfile ? capitalize(m.attrProfile) : null,
      m.attrGauge != null ? `${m.attrGauge}mm` : null,
    ].filter((p): p is string => Boolean(p));
    return parts.join(" · ") || "—";
  }
  if (kind === "corrente") {
    const parts = [
      m.attrMesh ? capitalize(m.attrMesh) : null,
      m.attrSizeMm != null ? `${m.attrSizeMm}mm` : null,
    ].filter((p): p is string => Boolean(p));
    return parts.join(" · ") || "—";
  }
  return "—";
}

/** Número PT-BR com no máx. 4 casas, sem zeros à direita. */
export function formatNumberPtBr(value: number, maxDigits = 4): string {
  const rounded = Math.round((value + Number.EPSILON) * 10000) / 10000;
  return rounded.toLocaleString("pt-BR", { maximumFractionDigits: maxDigits });
}

/** Peso em gramas: "4,25 g". */
export function formatWeightG(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${formatNumberPtBr(value, 2)} g`;
}

/** Comprimento em centímetros: "45 cm". */
export function formatLengthCm(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${formatNumberPtBr(value, 1)} cm`;
}
