import { describe, expect, it } from "vitest";

import {
  buildPromptWhere,
  extractPromptVariables,
  normalizeTagNames,
  parsePromptListParams,
  previewPromptContent,
  tokenizeSearchQuery,
} from "@/lib/ai-prompt";

describe("extractPromptVariables", () => {
  it("extrai variáveis na ordem de aparição, sem duplicar", () => {
    const content =
      "Crie uma imagem de uma {TIPO_DE_JOIA} em {MATERIAL} com {PEDRA}. Ambiente {CENARIO}. Material {MATERIAL}.";
    expect(extractPromptVariables(content)).toEqual([
      "TIPO_DE_JOIA",
      "MATERIAL",
      "PEDRA",
      "CENARIO",
    ]);
  });

  it("ignora chaves vazias e preserva o texto original", () => {
    expect(extractPromptVariables("sem variáveis {} {123}")).toEqual([]);
    expect(extractPromptVariables("{ouro}")).toEqual(["ouro"]);
  });
});

describe("tokenizeSearchQuery", () => {
  it("quebra em tokens e descarta termos curtos", () => {
    expect(tokenizeSearchQuery("  pulseira ouro  a catálogo ")).toEqual([
      "pulseira",
      "ouro",
      "catálogo",
    ]);
  });

  it("limita a quantidade de tokens", () => {
    const q = Array.from({ length: 20 }, (_, i) => `termo${i}`).join(" ");
    expect(tokenizeSearchQuery(q)).toHaveLength(8);
  });
});

describe("parsePromptListParams", () => {
  it("aplica padrões seguros e rejeita valores inválidos", () => {
    const parsed = parsePromptListParams({
      q: " pulseira ",
      category: "aic_pulseiras",
      sort: "used",
      fav: "1",
      page: "2",
      tool: "Midjourney",
    });
    expect(parsed.q).toBe("pulseira");
    expect(parsed.category).toBe("aic_pulseiras");
    expect(parsed.sort).toBe("used");
    expect(parsed.favorites).toBe(true);
    expect(parsed.page).toBe(2);
    expect(parsed.tool).toBe("Midjourney");
  });

  it("ignora sort, ferramenta e ids malformados", () => {
    const parsed = parsePromptListParams({
      sort: "hack",
      tool: "SQL",
      category: "id;drop",
      page: "-3",
    });
    expect(parsed.sort).toBe("recent");
    expect(parsed.tool).toBeNull();
    expect(parsed.category).toBeNull();
    expect(parsed.page).toBe(1);
  });
});

describe("buildPromptWhere", () => {
  it("combina busca tokenizada com filtros", () => {
    const where = buildPromptWhere({
      q: "pulseira ouro",
      category: "aic_pulseiras",
      purpose: "aip_imagem_catalogo",
      tool: "Midjourney",
      tag: "ouro",
      favorites: true,
      sort: "recent",
      page: 1,
    });
    expect(where.isActive).toBe(true);
    expect(where.categoryId).toBe("aic_pulseiras");
    expect(where.isFavorite).toBe(true);
    expect(Array.isArray(where.AND)).toBe(true);
    expect((where.AND as unknown[]).length).toBe(2);
  });
});

describe("normalizeTagNames", () => {
  it("deduplica por slug e respeita o limite", () => {
    expect(normalizeTagNames(["Ouro", " ouro ", "Luxo", ""])).toEqual([
      "Ouro",
      "Luxo",
    ]);
  });
});

describe("previewPromptContent", () => {
  it("trunca sem quebrar em HTML", () => {
    const long = "a".repeat(200);
    const preview = previewPromptContent(long, 20);
    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(20);
    expect(preview).not.toContain("<");
  });
});
