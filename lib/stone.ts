import { z } from "zod";

import { roundQty4 } from "@/lib/decimal";

export const STONE_MM_MAX = 80;
export const STONE_COLOR_MAX = 40;
export const STONE_CUT_MAX = 60;

/** Sugestões de lapidação — o backend aceita qualquer texto válido. */
export const STONE_CUT_SUGGESTIONS = [
  "Redonda",
  "Quadrada",
  "Estrela",
  "Gota",
  "Oval",
  "Navete",
  "Princesa",
  "Baguete",
  "Coração",
  "Esmeralda",
  "Marquise",
  "Brilhante",
] as const;

export const STONE_CUTS = STONE_CUT_SUGGESTIONS.map((label) => ({
  value: label,
  label,
}));

const SYMMETRIC_CUT_KEYS = new Set([
  "redonda",
  "quadrada",
  "estrela",
  "brilhante",
]);

const CUT_ALIASES: Record<string, string> = {
  brilhante: "Brilhante",
  brilliant: "Brilhante",
  redonda: "Redonda",
  redondo: "Redonda",
  round: "Redonda",
  estrela: "Estrela",
  star: "Estrela",
  navete: "Navete",
  marquise: "Marquise",
  oval: "Oval",
  gota: "Gota",
  pera: "Gota",
  "gota/pera": "Gota",
  "gota pera": "Gota",
  pear: "Gota",
  quadrada: "Quadrada",
  quadrado: "Quadrada",
  carre: "Quadrada",
  carré: "Quadrada",
  cushion: "Quadrada",
  princesa: "Princesa",
  princess: "Princesa",
  esmeralda: "Esmeralda",
  emerald: "Esmeralda",
  baguete: "Baguete",
  baguette: "Baguete",
  coracao: "Coração",
  coração: "Coração",
  heart: "Coração",
  triangulo: "Triângulo",
  triângulo: "Triângulo",
  triangle: "Triângulo",
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

export function normalizeCutDisplay(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  if (trimmed.length > STONE_CUT_MAX) return trimmed.slice(0, STONE_CUT_MAX).trim();
  return CUT_ALIASES[foldKey(trimmed)] ?? trimmed;
}

/** Chave estável para unicidade (ignora caixa e acentos). */
export function cutKey(raw: string): string {
  return foldKey(normalizeCutDisplay(raw) || raw);
}

export function normalizeCut(raw: string): string {
  return normalizeCutDisplay(raw);
}

export function stoneCutMeta(cut: string): {
  value: string;
  label: string;
  symmetric: boolean;
} {
  const label = normalizeCutDisplay(cut) || cut.trim();
  return {
    value: label,
    label,
    symmetric: SYMMETRIC_CUT_KEYS.has(foldKey(label)),
  };
}

export function isSymmetricCut(cut: string): boolean {
  return stoneCutMeta(cut).symmetric;
}

/** @deprecated use isSymmetricCut — pedras 1D (Redonda/Quadrada/Estrela/Brilhante). */
export function isDiameterCut(cut: string): boolean {
  return isSymmetricCut(cut);
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
  return `${cutKey(stone.cut)}|${colorKey(stone.color)}|${roundQty4(stone.widthMm)}|${length}`;
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

export type NormalizedStoneDimensions =
  | { ok: true; widthMm: number; lengthMm: number | null }
  | { ok: false; path: "widthMm" | "lengthMm"; message: string };

function coerceMm(value: unknown): number | null | typeof Number.NaN {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  const trimmed = String(value).trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}

/**
 * Largura obrigatória e > 0. Comprimento opcional; se informado, > 0.
 * Não aceita comprimento sem largura.
 */
export function normalizeStoneDimensions(input: {
  widthMm?: unknown;
  lengthMm?: unknown;
}): NormalizedStoneDimensions {
  const widthRaw = coerceMm(input.widthMm);
  const lengthRaw = coerceMm(input.lengthMm);

  if (widthRaw === null) {
    if (lengthRaw != null && !Number.isNaN(lengthRaw) && lengthRaw !== 0) {
      return {
        ok: false,
        path: "widthMm",
        message: "Informe a largura quando o comprimento for preenchido.",
      };
    }
    return {
      ok: false,
      path: "widthMm",
      message: "A largura deve ser maior que zero.",
    };
  }
  if (Number.isNaN(widthRaw) || !Number.isFinite(widthRaw) || widthRaw <= 0) {
    return {
      ok: false,
      path: "widthMm",
      message: "A largura deve ser maior que zero.",
    };
  }
  if (widthRaw > STONE_MM_MAX) {
    return {
      ok: false,
      path: "widthMm",
      message: `A medida máxima é ${STONE_MM_MAX} mm.`,
    };
  }
  if (lengthRaw === null) {
    return { ok: true, widthMm: roundQty4(widthRaw), lengthMm: null };
  }
  if (Number.isNaN(lengthRaw) || !Number.isFinite(lengthRaw) || lengthRaw <= 0) {
    return {
      ok: false,
      path: "lengthMm",
      message: "O comprimento deve ser maior que zero.",
    };
  }
  if (lengthRaw > STONE_MM_MAX) {
    return {
      ok: false,
      path: "lengthMm",
      message: `A medida máxima é ${STONE_MM_MAX} mm.`,
    };
  }
  return {
    ok: true,
    widthMm: roundQty4(widthRaw),
    lengthMm: roundQty4(lengthRaw),
  };
}

const mmField = z
  .number({ error: "Informe uma medida válida em mm." })
  .finite("Informe uma medida válida em mm.")
  .gt(0, "A largura deve ser maior que zero.")
  .max(STONE_MM_MAX, `A medida máxima é ${STONE_MM_MAX} mm.`);

export const stoneBatchSchema = z
  .object({
    id: z.string().trim().min(1).optional(),
    cut: z
      .string()
      .transform((value) => normalizeCutDisplay(value))
      .pipe(
        z
          .string()
          .min(1, "A lapidação é obrigatória.")
          .max(STONE_CUT_MAX, `A lapidação deve ter no máximo ${STONE_CUT_MAX} caracteres.`)
      ),
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
          .min(1, "Informe pelo menos uma cor.")
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
    if (data.id && data.colors.length !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["colors"],
        message: "Na edição, informe exatamente uma cor.",
      });
    }
    const dims = normalizeStoneDimensions({
      widthMm: data.widthMm,
      lengthMm: data.lengthMm,
    });
    if (!dims.ok) {
      ctx.addIssue({
        code: "custom",
        path: [dims.path],
        message: dims.message,
      });
    }
  })
  .transform((data) => {
    const dims = normalizeStoneDimensions({
      widthMm: data.widthMm,
      lengthMm: data.lengthMm,
    });
    if (!dims.ok) {
      throw new Error(dims.message);
    }
    return {
      id: data.id,
      cut: data.cut,
      widthMm: dims.widthMm,
      lengthMm: dims.lengthMm,
      colors: data.colors,
      weightCt: roundQty4(data.weightCt),
      unitPrice: roundQty4(data.unitPrice),
    };
  });

export type StoneBatchInput = z.infer<typeof stoneBatchSchema>;
