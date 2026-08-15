/**
 * Parsing e normalização do filtro de período (histórico de pedidos).
 *
 * Regras:
 * - Datas civis vêm da URL como `YYYY-MM-DD` (ex.: 2026-08-15).
 * - O fuso de referência é America/Sao_Paulo (Brasília, UTC-3 fixo — o Brasil
 *   não adota horário de verão desde 2019).
 * - O intervalo é semiaberto: `createdAt >= início do dia` e
 *   `createdAt < início do dia seguinte ao fim`. Isso evita depender de
 *   23:59:59.999 e cobre corretamente a virada de mês/ano.
 */

/** Offset fixo de Brasília em relação a UTC (horas). UTC-3. */
const BRASILIA_UTC_OFFSET_HOURS = 3;

export interface CivilDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface DateRangeFilter {
  gte: Date;
  lt: Date;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Valida estritamente `YYYY-MM-DD` e garante que a data existe de fato
 * (rejeita 2026-99-99, 2026-02-30, etc.). Retorna null quando inválida.
 */
export function parseDateParam(value: unknown): CivilDate | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // Confere se o calendário aceita a combinação (usa UTC para não sofrer com o fuso local).
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

/** Instante UTC correspondente à meia-noite (00:00) de Brasília na data civil. */
function brasiliaMidnightUtc(date: CivilDate, addDays = 0): Date {
  return new Date(
    Date.UTC(
      date.year,
      date.month - 1,
      date.day + addDays,
      BRASILIA_UTC_OFFSET_HOURS,
      0,
      0,
      0
    )
  );
}

/**
 * Constrói o filtro `createdAt` a partir dos parâmetros da URL.
 *
 * - Ambos ausentes/inválidos → `undefined` (sem filtro de período).
 * - Apenas um lado informado → intervalo de um único dia.
 * - `from > to` → normaliza invertendo os limites.
 */
export function buildOrderDateRange(
  fromParam: unknown,
  toParam: unknown
): DateRangeFilter | undefined {
  let from = parseDateParam(fromParam);
  let to = parseDateParam(toParam);

  if (!from && !to) return undefined;
  if (from && !to) to = from;
  if (to && !from) from = to;
  if (!from || !to) return undefined;

  // Normaliza intervalos invertidos (from > to).
  if (compareCivil(from, to) > 0) {
    const swap = from;
    from = to;
    to = swap;
  }

  return {
    gte: brasiliaMidnightUtc(from),
    lt: brasiliaMidnightUtc(to, 1),
  };
}

function compareCivil(a: CivilDate, b: CivilDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/** Normaliza a data civil para o formato de URL `YYYY-MM-DD`. */
export function formatDateParam(date: CivilDate): string {
  const mm = String(date.month).padStart(2, "0");
  const dd = String(date.day).padStart(2, "0");
  return `${date.year}-${mm}-${dd}`;
}
