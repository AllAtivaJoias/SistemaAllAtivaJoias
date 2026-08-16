import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  hexToHsl,
  hexToHslChannels,
  hexToOklch,
  isHexColor,
  normalizeHex,
  parseColorInput,
  pickForeground,
  wcagLevel,
} from "@/lib/theme/color";
import { deriveLightFromPrimary } from "@/lib/theme/tokens";
import { buildThemeStyleSheet, themePreviewStyle } from "@/lib/theme/registry";
import { DEFAULT_THEME } from "@/lib/theme/tokens";
import { appearancePayloadSchema, parseThemeConfig } from "@/lib/theme/schema";
import { applyPreset } from "@/lib/theme/presets";

describe("color", () => {
  it("normaliza HEX curto e rejeita inválido", () => {
    expect(normalizeHex("#034")).toBe("#003344");
    expect(isHexColor("#034742")).toBe(true);
    expect(parseColorInput("javascript:#fff")).toBeNull();
    expect(parseColorInput("data:text/css")).toBeNull();
  });

  it("converte jade #034742 para HSL próximo do token atual", () => {
    const hsl = hexToHsl("#034742");
    expect(hsl).not.toBeNull();
    expect(hsl!.h).toBeGreaterThan(165);
    expect(hsl!.h).toBeLessThan(185);
    expect(hexToHslChannels("#034742")).toMatch(/^\d/);
  });

  it("mede contraste WCAG", () => {
    const ratio = contrastRatio("#FFFFFF", "#034742");
    expect(ratio).toBeGreaterThan(7);
    expect(wcagLevel(ratio!)).toBe("AAA");
    expect(pickForeground("#034742")).toBe("#FFFFFF");
    expect(pickForeground("#F8FAFC")).toBe("#0F172A");
  });

  it("produz OKLCH estável para o jade", () => {
    const oklch = hexToOklch("#034742");
    expect(oklch).not.toBeNull();
    expect(oklch!.l).toBeGreaterThan(0.2);
    expect(oklch!.l).toBeLessThan(0.5);
  });
});

describe("theme registry", () => {
  it("emite apenas variáveis whitelistadas", () => {
    const css = buildThemeStyleSheet(DEFAULT_THEME);
    expect(css).toContain(":root{");
    expect(css).toContain(".dark{");
    expect(css).toContain("--primary:");
    expect(css).toContain("--sidebar-background:");
    expect(css).toContain("--brand-600:");
    expect(css).not.toContain("javascript");
    expect(css).not.toContain("<");
  });

  it("preview não injeta CSS cru do usuário", () => {
    const style = themePreviewStyle(DEFAULT_THEME.light, DEFAULT_THEME);
    expect(style["--primary"]).toMatch(/^\d/);
    expect(Object.keys(style).every((key) => key.startsWith("--"))).toBe(true);
  });

  it("deriva paleta a partir da primária sem inverter RGB", () => {
    const tokens = deriveLightFromPrimary("#B8860B");
    expect(tokens.primary).toBe("#B8860B");
    expect(tokens.primaryForeground).toBe("#0F172A");
    expect(tokens.background).toBe("#F8FAFC");
    expect(contrastRatio(tokens.primaryForeground, tokens.primary)!).toBeGreaterThan(4.5);
  });
});

describe("theme schema", () => {
  it("rejeita facebook com javascript:", () => {
    const parsed = appearancePayloadSchema.safeParse({
      storeName: "Loja",
      brandTagline: "",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
      ogImageUrl: "",
      website: "",
      instagram: "",
      facebookUrl: "javascript:alert(1)",
      youtubeUrl: "",
      tiktokUrl: "",
      theme: DEFAULT_THEME,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita URL perigosa", () => {
    const parsed = appearancePayloadSchema.safeParse({
      storeName: "Loja",
      brandTagline: "",
      logoUrl: "javascript:alert(1)",
      logoDarkUrl: "",
      faviconUrl: "",
      ogImageUrl: "",
      website: "",
      instagram: "",
      facebookUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      theme: DEFAULT_THEME,
    });
    expect(parsed.success).toBe(false);
  });

  it("aceita o tema padrão", () => {
    const parsed = appearancePayloadSchema.safeParse({
      storeName: "AllAtiva Joias",
      brandTagline: "",
      logoUrl: "",
      logoDarkUrl: "",
      faviconUrl: "",
      ogImageUrl: "",
      website: "",
      instagram: "",
      facebookUrl: "",
      youtubeUrl: "",
      tiktokUrl: "",
      theme: DEFAULT_THEME,
    });
    expect(parsed.success).toBe(true);
  });

  it("faz parse de JSON vazio com fallback do padrão", () => {
    const theme = parseThemeConfig({
      themeLight: {},
      themeDark: {},
      primaryColor: "#034742",
    });
    expect(theme.light.primary).toBe("#034742");
    expect(theme.fontBody).toBe("manrope");
  });

  it("aplica preset sem persistir sozinho", () => {
    const next = applyPreset("gold", DEFAULT_THEME);
    expect(next.preset).toBe("gold");
    expect(next.light.primary).toBe("#B8860B");
    expect(DEFAULT_THEME.light.primary).toBe("#034742");
  });
});
