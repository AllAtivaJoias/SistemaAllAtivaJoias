import { z } from "zod";

import { roundQty4 } from "@/lib/decimal";

export const STONE_MM_MAX = 80;
export const STONE_COLOR_MAX = 40;

export const STONE_CUTS = [
  { value: "brilhante", label: "Brilhante", dimension: "diameter" },
  { value: "redonda", label: "Redonda", dimension: "diameter" },
  { value: "navete", label: "Navete", dimension: "wxh" },
  { value: "oval", label: "Oval", dimension: "wxh" },
  { value: "gota", label: "Gota/Pera", dimension: "wxh" },
  { value: "quadrada", label: "Quadrada/Carré", dimension: "wxh" },
  { value: "princesa", label: "Princesa", dimension: "wxh" },
  { value: "esmeralda", label: "Esmeralda", dimension: "wxh" },
  { value: "baguete", label: "Baguete", dimension: "wxh" },
  { value: "coracao", label: "Coração", dimension: "wxh" },
  { value: "triangulo", label: "Triângulo", dimension: "wxh" },
] as const;

export type StoneCutValue = (typeof STONE_CUTS)[number]["value"];
export type StoneDimensionKind = (typeof STONE_CUTS)[number]["dimension"];

const CUT_ALIASES: Record<string, StoneCutValue> = {
  brilhante: "brilhante",
  brilliant: "brilhante",
  redonda: "redonda",
  redondo: "redonda",
  round: "redonda",
  navete: "navete",
  marquise: "navete",
  oval: "oval",
  gota: "gota",
  pera: "gota",
  "gota/pera": "gota",
  "gota pera": "gota",
  pear: "gota",
  quadrada: "quadrada",
  quadrado: "quadrada",
  carre: "quadrada",
  carré: "quadrada",
  cushion: "quadrada",
  princesa: "princesa",
  princess: "princesa",
  esmeralda: "esmeralda",
  emerald: "esmeralda",
  baguete: "baguete",
  baguette: "baguete",
  coracao: "coracao",
  coração: "coracao",
  heart: "coracao",
  triangulo: "triangulo",
  triângulo: "triangulo",
  triangle: "triangulo",
};

export const DEFAULT_STONE_COLORS = [
  "Branco",
  "Rubi",
  "Safira",
  "Esmeralda",
  "Ametista",
  "Ônix",
  "Turmalina",
] as const;

export type StoneDimensionInput = {
  widthMm?: number | null;
  lengthMm?: number | null;
};

function foldKey(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function formatMmAmount(value: number): string {
  const n = roundQty4(value);
  if (n <= 0) return "";
  return n.toFixed(4).replace(/\.?0+$/, "");
}

/** Representação única de dimensão: `2mm`, `3x5mm` ou `Sem medida`. */
export function formatStoneDimension(stone: StoneDimensionInput): string {
  const width =
    stone.widthMm != null && Number.isFinite(stone.widthMm) && stone.widthMm > 0
      ? roundQty4(stone.widthMm)
      : null;
  const length =
    stone.lengthMm != null &&
    Number.isFinite(stone.lengthMm) &&
    stone.lengthMm > 0
      ? roundQty4(stone.lengthMm)
      : null;

  if (width == null) return "Sem medida";
  if (length == null) return `${formatMmAmount(width)}mm`;
  return `${formatMmAmount(width)}x${formatMmAmount(length)}mm`;
}

export function normalizeCut(raw: string): string {
  const key = foldKey(raw);
  return CUT_ALIASES[key] ?? key;
}

export function stoneCutMeta(cut: string): {
  value: string;
  label: string;
  dimension: StoneDimensionKind | "wxh";
} {
  const value = normalizeCut(cut);
  const found = STONE_CUTS.find((c) => c.value === value);
  if (found) return found;
  return { value, label: cut.trim() || value, dimension: "wxh" };
}

export function isDiameterCut(cut: string): boolean {
  return stoneCutMeta(cut).dimension === "diameter";
}

export function stoneCutLabel(cut: string): string {
  return stoneCutMeta(cut).label;
}

export function displayColor(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return (
    trimmed.charAt(0).toLocaleUpperCase("pt-BR") + trimmed.slice(1)
  );
}

export function colorKey(raw: string): string {
  return foldKey(raw);
}

export function normalizeColors(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const display = displayColor(item);
    if (!display) continue;
    const key = colorKey(display);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(display);
  }
  return out;
}

export function buildStoneName(input: {
  cut: string;
  color: string;
  widthMm?: number | null;
  lengthMm?: number | null;
}): string {
  const cutLabel = stoneCutLabel(input.cut);
  const color = displayColor(input.color);
  const dimension = formatStoneDimension(input);
  const head =
    dimension === "Sem medida" ? cutLabel : `${cutLabel} ${dimension}`;
  if (!color) return head;
  return `${head} - ${color}`;
}

export type StoneIdentity = {
  cut: string;
  color: string;
  widthMm: number;
  lengthMm: number | null;
};

export function stoneIdentityKey(stone: StoneIdentity): string {
  const length =
    stone.lengthMm != null && stone.lengthMm > 0
      ? String(roundQty4(stone.lengthMm))
      : "";
  return `${normalizeCut(stone.cut)}|${colorKey(stone.color)}|${roundQty4(stone.widthMm)}|${length}`;
}

export function partitionStoneBatch(
  existing: StoneIdentity[],
  incoming: StoneIdentity[]
): { toCreate: StoneIdentity[]; skipped: StoneIdentity[] } {
  const have = new Set(existing.map(stoneIdentityKey));
  const toCreate: StoneIdentity[] = [];
  const skipped: StoneIdentity[] = [];
  for (const item of incoming) {
    const key = stoneIdentityKey(item);
    if (have.has(key)) {
      skipped.push(item);
      continue;
    }
    have.add(key);
    toCreate.push(item);
  }
  return { toCreate, skipped };
}

const mmField = z
  .number({ error: "Informe uma medida válida em mm." })
  .finite("Informe uma medida válida em mm.")
  .gt(0, "A medida deve ser maior que zero.")
  .max(STONE_MM_MAX, `A medida máxima é ${STONE_MM_MAX} mm.`);

export const stoneBatchSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    cut: z.string().trim().min(1, "Selecione a lapidação."),
    widthMm: mmField,
    lengthMm: z
      .number()
      .finite()
      .gt(0)
      .max(STONE_MM_MAX)
      .nullable()
      .optional(),
    colors: z
      .array(z.string())
      .transform(normalizeColors)
      .pipe(
        z
          .array(z.string().min(1))
          .min(1, "Selecione pelo menos uma cor.")
          .max(STONE_COLOR_MAX, `No máximo ${STONE_COLOR_MAX} cores por lote.`)
      ),
    weightCt: z
      .number({ error: "Informe o peso em quilates." })
      .finite()
      .nonnegative("O peso não pode ser negativo."),
    unitPrice: z
      .number({ error: "Informe o valor unitário." })
      .finite()
      .nonnegative("O valor não pode ser negativo."),
  })
  .superRefine((data, ctx) => {
    const cut = normalizeCut(data.cut);
    if (data.id && data.colors.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["colors"],
        message: "Na edição, informe exatamente uma cor.",
      });
    }
    if (isDiameterCut(cut)) {
      if (data.lengthMm != null && data.lengthMm > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["lengthMm"],
          message: "Lapidação redonda/brilhante usa somente o diâmetro.",
        });
      }
      return;
    }
    if (data.lengthMm == null || !(data.lengthMm > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["lengthMm"],
        message: "Informe o comprimento (mm) para lapidações fantasia.",
      });
    }
  })
  .transform((data) => {
    const cut = normalizeCut(data.cut);
    const widthMm = roundQty4(data.widthMm);
    const lengthMm = isDiameterCut(cut)
      ? null
      : roundQty4(data.lengthMm ?? 0);
    return {
      id: data.id,
      cut,
      widthMm,
      lengthMm,
      colors: data.colors,
      weightCt: roundQty4(data.weightCt),
      unitPrice: roundQty4(data.unitPrice),
    };
  });

export type StoneBatchInput = z.infer<typeof stoneBatchSchema>;
