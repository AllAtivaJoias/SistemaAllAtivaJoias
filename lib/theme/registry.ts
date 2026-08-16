import { hexToHslChannels, isHexColor, normalizeHex } from "@/lib/theme/color";
import {
  BRAND_SCALE_VARS,
  COLOR_TOKEN_KEYS,
  DENSITY_VARS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  RADIUS_PRESETS,
  TOKEN_CSS_VARS,
  brandScaleFromPrimary,
  type ColorTokenKey,
  type FontId,
  type ThemeConfig,
  type ThemeTokens,
  type UiDensity,
} from "@/lib/theme/tokens";

const RADIUS_VALUES = new Set<string>(RADIUS_PRESETS.map((item) => item.value));
const FONT_IDS = new Set<string>(FONT_OPTIONS.map((item) => item.id));

function fontCss(id: FontId): string {
  return FONT_OPTIONS.find((item) => item.id === id)?.css ?? FONT_OPTIONS[0].css;
}

function safeRadius(value: string): string {
  return RADIUS_VALUES.has(value) ? value : DEFAULT_THEME.radius;
}

function tokenMapToDeclarations(tokens: ThemeTokens): string[] {
  const lines: string[] = [];
  for (const key of COLOR_TOKEN_KEYS) {
    const hex = tokens[key];
    if (!isHexColor(hex)) continue;
    const channels = hexToHslChannels(hex);
    if (!channels) continue;
    lines.push(`${TOKEN_CSS_VARS[key]}: ${channels};`);
  }
  const scale = brandScaleFromPrimary(tokens.primary);
  const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;
  steps.forEach((step, index) => {
    const channels = hexToHslChannels(scale[step]);
    if (!channels) return;
    lines.push(`${BRAND_SCALE_VARS[index]}: ${channels};`);
  });
  return lines;
}

function densityBlock(density: UiDensity): string[] {
  const vars = DENSITY_VARS[density] ?? DENSITY_VARS.DEFAULT;
  return [
    `--control-height: ${vars.controlHeight};`,
    `--card-pad: ${vars.cardPad};`,
  ];
}

/**
 * Gera CSS estático a partir de tokens já validados.
 * Somente nomes whitelistados + números HSL + radius/font da allowlist.
 */
export function buildThemeStyleSheet(theme: ThemeConfig): string {
  const radius = safeRadius(theme.radius);
  const body = fontCss(FONT_IDS.has(theme.fontBody) ? theme.fontBody : DEFAULT_THEME.fontBody);
  const heading = fontCss(
    FONT_IDS.has(theme.fontHeading) ? theme.fontHeading : DEFAULT_THEME.fontHeading
  );
  const shared = [
    `--radius: ${radius};`,
    `--font-sans: ${body};`,
    `--font-serif: ${heading};`,
    ...densityBlock(theme.density),
  ];
  const light = [...tokenMapToDeclarations(theme.light), ...shared];
  const dark = [...tokenMapToDeclarations(theme.dark), ...shared];
  return `:root{${light.join("")}}.dark{${dark.join("")}}`;
}

/** Variáveis inline para o preview (não toca o documento). */
export function themePreviewStyle(
  tokens: ThemeTokens,
  theme: Pick<ThemeConfig, "radius" | "density" | "fontBody" | "fontHeading">
): Record<string, string> {
  const style: Record<string, string> = {};
  for (const key of COLOR_TOKEN_KEYS) {
    const channels = hexToHslChannels(tokens[key]);
    if (!channels) continue;
    style[TOKEN_CSS_VARS[key]] = channels;
  }
  const scale = brandScaleFromPrimary(tokens.primary);
  const steps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"] as const;
  steps.forEach((step, index) => {
    const channels = hexToHslChannels(scale[step]);
    if (channels) style[BRAND_SCALE_VARS[index]] = channels;
  });
  const density = DENSITY_VARS[theme.density] ?? DENSITY_VARS.DEFAULT;
  style["--radius"] = safeRadius(theme.radius);
  style["--control-height"] = density.controlHeight;
  style["--card-pad"] = density.cardPad;
  style["--font-sans"] = fontCss(theme.fontBody);
  style["--font-serif"] = fontCss(theme.fontHeading);
  return style;
}

export function mergeTokenMap(
  base: ThemeTokens,
  raw: unknown
): ThemeTokens {
  if (!raw || typeof raw !== "object") return base;
  const next = { ...base };
  const record = raw as Record<string, unknown>;
  for (const key of COLOR_TOKEN_KEYS) {
    const value = record[key];
    if (typeof value !== "string") continue;
    const hex = normalizeHex(value);
    if (hex) next[key] = hex;
  }
  return next;
}

export { COLOR_TOKEN_KEYS };
export type { ColorTokenKey };
