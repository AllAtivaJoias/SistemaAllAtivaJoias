import { Prisma } from "@prisma/client";
import { Decimal } from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const MONEY_2 = 2;
export const MONEY_4 = 4;
export const QTY_4 = 4;
export const PURITY_6 = 6;

export { Decimal };

/** Converte entrada desconhecida em Decimal finito ≥ 0 (senão 0). */
export function toDecimal(value: unknown): Decimal {
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  try {
    const d = value instanceof Decimal ? value : new Decimal(String(value));
    if (!d.isFinite() || d.lte(0)) {
      return d.isFinite() && d.eq(0) ? new Decimal(0) : new Decimal(0);
    }
    return d;
  } catch {
    return new Decimal(0);
  }
}

/** Aceita zero; rejeita NaN/Infinity/negativo. */
export function toNonNegativeDecimal(value: unknown): Decimal {
  if (value === null || value === undefined || value === "") {
    return new Decimal(0);
  }
  try {
    const d = value instanceof Decimal ? value : new Decimal(String(value));
    if (!d.isFinite() || d.lt(0)) return new Decimal(0);
    return d;
  } catch {
    return new Decimal(0);
  }
}

export function roundTo(value: Decimal, places: number): Decimal {
  return value.toDecimalPlaces(places, Decimal.ROUND_HALF_UP);
}

export function roundMoney2(value: unknown): number {
  return roundTo(toNonNegativeDecimal(value), MONEY_2).toNumber();
}

export function roundMoney4(value: unknown): number {
  return roundTo(toNonNegativeDecimal(value), MONEY_4).toNumber();
}

export function roundQty4(value: unknown): number {
  return roundTo(toNonNegativeDecimal(value), QTY_4).toNumber();
}

/** Número JS para UI / Client Components. */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value instanceof Decimal) return value.toNumber();
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function prismaDecimal(value: unknown, places = MONEY_4): Prisma.Decimal {
  const rounded = roundTo(toNonNegativeDecimal(value), places);
  return new Prisma.Decimal(rounded.toFixed(places));
}

export function prismaDecimalNullable(
  value: unknown,
  places = QTY_4
): Prisma.Decimal | null {
  if (value === null || value === undefined || value === "") return null;
  const d = toNonNegativeDecimal(value);
  if (d.eq(0) && (value === "" || value === null)) return null;
  return prismaDecimal(value, places);
}

function isDecimalLike(value: unknown): boolean {
  if (value instanceof Decimal) return true;
  if (value instanceof Prisma.Decimal) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toFixed?: unknown }).toFixed === "function" &&
    typeof (value as { isInteger?: unknown }).isInteger === "function"
  );
}

/** Converte Decimal do Prisma em number (recursivo) para RSC → Client. */
export function serializeDecimals<T>(value: T): T {
  return convert(value) as T;
}

/** Tipo após serializeDecimals: Prisma.Decimal vira number. */
export type Numbers<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
    ? T
    : T extends Uint8Array
      ? T
      : T extends Array<infer U>
        ? Array<Numbers<U>>
        : T extends object
          ? { [K in keyof T]: Numbers<T[K]> }
          : T;

/** Cast alinhado ao $extends do Prisma (Decimal já é number em runtime). */
export function asClient<T>(value: T): Numbers<T> {
  return value as Numbers<T>;
}

function convert(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (isDecimalLike(value)) return Number((value as Decimal).toString());
  if (Array.isArray(value)) return value.map(convert);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = convert(nested);
    }
    return out;
  }
  return value;
}
