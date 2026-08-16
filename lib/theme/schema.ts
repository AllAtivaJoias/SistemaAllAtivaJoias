import { z } from "zod";

import { HEX_PATTERN, isHexColor } from "@/lib/theme/color";
import {
  COLOR_TOKEN_KEYS,
  DENSITIES,
  DEFAULT_THEME,
  FONT_OPTIONS,
  RADIUS_PRESETS,
  THEME_MODES,
  type ThemeConfig,
  type ThemeTokens,
} from "@/lib/theme/tokens";
import { mergeTokenMap } from "@/lib/theme/registry";

function noDangerousProtocol(value: string): boolean {
  return value === "" || !/javascript:|data:|vbscript:/i.test(value);
}

const hexField = z
  .string()
  .trim()
  .regex(HEX_PATTERN, "Use uma cor hexadecimal (#034742).");

const tokenMapSchema = z.object(
  Object.fromEntries(COLOR_TOKEN_KEYS.map((key) => [key, hexField])) as Record<
    (typeof COLOR_TOKEN_KEYS)[number],
    z.ZodString
  >
);

const fontIds = FONT_OPTIONS.map((item) => item.id) as [
  (typeof FONT_OPTIONS)[number]["id"],
  ...(typeof FONT_OPTIONS)[number]["id"][],
];

const radiusValues = RADIUS_PRESETS.map((item) => item.value) as [
  string,
  ...string[],
];

const safeUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      value === "" ||
      value.startsWith("/api/file") ||
      /^https:\/\//i.test(value),
    "URL inválida."
  )
  .refine(
    (value) => !/javascript:|data:|vbscript:/i.test(value),
    "URL não permitida."
  );

export const themeConfigSchema = z.object({
  preset: z.string().trim().max(40).default("custom"),
  mode: z.enum(THEME_MODES),
  allowUserToggle: z.boolean(),
  radius: z.enum(radiusValues),
  density: z.enum(DENSITIES),
  fontHeading: z.enum(fontIds),
  fontBody: z.enum(fontIds),
  light: tokenMapSchema,
  dark: tokenMapSchema,
});

export const appearanceIdentitySchema = z.object({
  storeName: z.string().trim().min(1, "Informe o nome da loja.").max(80),
  brandTagline: z.string().trim().max(280),
  logoUrl: safeUrl,
  logoDarkUrl: safeUrl,
  faviconUrl: safeUrl,
  ogImageUrl: safeUrl,
  website: z.string().trim().max(200).refine(noDangerousProtocol, "URL não permitida."),
  instagram: z.string().trim().max(80).refine(noDangerousProtocol, "URL não permitida."),
  facebookUrl: z.string().trim().max(200).refine(noDangerousProtocol, "URL não permitida."),
  youtubeUrl: z.string().trim().max(200).refine(noDangerousProtocol, "URL não permitida."),
  tiktokUrl: z.string().trim().max(200).refine(noDangerousProtocol, "URL não permitida."),
});

export const appearancePayloadSchema = appearanceIdentitySchema.extend({
  theme: themeConfigSchema,
});

export type AppearancePayload = z.infer<typeof appearancePayloadSchema>;

export function parseThemeConfig(raw: {
  themeLight?: unknown;
  themeDark?: unknown;
  themePreset?: string | null;
  themeMode?: string | null;
  themeAllowUserToggle?: boolean | null;
  themeRadius?: string | null;
  themeDensity?: string | null;
  fontHeading?: string | null;
  fontBody?: string | null;
  primaryColor?: string | null;
}): ThemeConfig {
  const light = mergeTokenMap(DEFAULT_THEME.light, raw.themeLight);
  const dark = mergeTokenMap(DEFAULT_THEME.dark, raw.themeDark);
  if (raw.primaryColor && isHexColor(raw.primaryColor) && isEmptyMap(raw.themeLight)) {
    light.primary = raw.primaryColor.toUpperCase();
  }
  const parsed = themeConfigSchema.safeParse({
    preset: raw.themePreset || "jade",
    mode: THEME_MODES.includes(raw.themeMode as ThemeConfig["mode"])
      ? raw.themeMode
      : DEFAULT_THEME.mode,
    allowUserToggle: Boolean(raw.themeAllowUserToggle),
    radius: RADIUS_PRESETS.some((item) => item.value === raw.themeRadius)
      ? raw.themeRadius
      : DEFAULT_THEME.radius,
    density: DENSITIES.includes(raw.themeDensity as ThemeConfig["density"])
      ? raw.themeDensity
      : DEFAULT_THEME.density,
    fontHeading: FONT_OPTIONS.some((item) => item.id === raw.fontHeading)
      ? raw.fontHeading
      : DEFAULT_THEME.fontHeading,
    fontBody: FONT_OPTIONS.some((item) => item.id === raw.fontBody)
      ? raw.fontBody
      : DEFAULT_THEME.fontBody,
    light,
    dark,
  });
  return parsed.success ? parsed.data : DEFAULT_THEME;
}

function isEmptyMap(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  return Object.keys(value as object).length === 0;
}

export function cloneTheme(theme: ThemeConfig): ThemeConfig {
  return {
    ...theme,
    light: { ...theme.light } as ThemeTokens,
    dark: { ...theme.dark } as ThemeTokens,
  };
}
