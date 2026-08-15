import { describe, expect, it } from "vitest";

import {
  buildOrderDateRange,
  parseDateParam,
  formatDateParam,
} from "@/lib/date-range";

describe("parseDateParam", () => {
  it("aceita data válida", () => {
    expect(parseDateParam("2026-08-15")).toEqual({
      year: 2026,
      month: 8,
      day: 15,
    });
  });

  it("rejeita formato inválido", () => {
    expect(parseDateParam("abc")).toBeNull();
    expect(parseDateParam("2026/08/15")).toBeNull();
    expect(parseDateParam("2026-8-5")).toBeNull();
  });

  it("rejeita datas impossíveis", () => {
    expect(parseDateParam("2026-99-99")).toBeNull();
    expect(parseDateParam("2026-02-30")).toBeNull();
    expect(parseDateParam("2026-13-01")).toBeNull();
  });

  it("rejeita valores não-string", () => {
    expect(parseDateParam(undefined)).toBeNull();
    expect(parseDateParam(123)).toBeNull();
  });
});

describe("buildOrderDateRange — timezone Brasília (UTC-3)", () => {
  it("um único dia cobre 00:00 até a virada do dia seguinte", () => {
    const range = buildOrderDateRange("2026-08-15", "2026-08-15");
    // 00:00 Brasília = 03:00 UTC
    expect(range?.gte.toISOString()).toBe("2026-08-15T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2026-08-16T03:00:00.000Z");
  });

  it("intervalo entre datas", () => {
    const range = buildOrderDateRange("2026-08-01", "2026-08-15");
    expect(range?.gte.toISOString()).toBe("2026-08-01T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2026-08-16T03:00:00.000Z");
  });

  it("virada de mês (31/07 → 01/08)", () => {
    const range = buildOrderDateRange("2026-07-31", "2026-08-01");
    expect(range?.gte.toISOString()).toBe("2026-07-31T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2026-08-02T03:00:00.000Z");
  });

  it("virada de ano (31/12 → 01/01)", () => {
    const range = buildOrderDateRange("2026-12-31", "2027-01-01");
    expect(range?.gte.toISOString()).toBe("2026-12-31T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2027-01-02T03:00:00.000Z");
  });

  it("normaliza intervalo invertido (from > to)", () => {
    const range = buildOrderDateRange("2026-08-15", "2026-08-01");
    expect(range?.gte.toISOString()).toBe("2026-08-01T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2026-08-16T03:00:00.000Z");
  });

  it("apenas 'from' vira um único dia", () => {
    const range = buildOrderDateRange("2026-08-15", undefined);
    expect(range?.gte.toISOString()).toBe("2026-08-15T03:00:00.000Z");
    expect(range?.lt.toISOString()).toBe("2026-08-16T03:00:00.000Z");
  });

  it("sem parâmetros → sem filtro", () => {
    expect(buildOrderDateRange(undefined, undefined)).toBeUndefined();
  });

  it("parâmetros inválidos → sem filtro", () => {
    expect(buildOrderDateRange("abc", "xyz")).toBeUndefined();
  });

  it("um pedido às 23:59 de Brasília cai dentro do dia (não desloca)", () => {
    // 15/08 23:59 Brasília = 16/08 02:59 UTC → dentro de [gte, lt) do dia 15.
    const range = buildOrderDateRange("2026-08-15", "2026-08-15")!;
    const order2359 = new Date("2026-08-16T02:59:00.000Z");
    expect(order2359 >= range.gte && order2359 < range.lt).toBe(true);
    // 00:00 do dia seguinte (Brasília) já está fora.
    const nextMidnight = new Date("2026-08-16T03:00:00.000Z");
    expect(nextMidnight < range.lt).toBe(false);
  });
});

describe("formatDateParam", () => {
  it("formata com zero à esquerda", () => {
    expect(formatDateParam({ year: 2026, month: 8, day: 5 })).toBe("2026-08-05");
  });
});
