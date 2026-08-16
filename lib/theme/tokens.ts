import {
  adjustHsl,
  hexToHsl,
  hslToHex,
  mixHex,
  pickForeground,
} from "@/lib/theme/color";

export const COLOR_TOKEN_KEYS = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebarForeground",
  "sidebarPrimary",
  "sidebarPrimaryForeground",
  "sidebarAccent",
  "sidebarAccentForeground",
  "sidebarBorder",
  "sidebarRing",
  "chart1",
  "chart2",
  "chart3",
  "chart4",
  "chart5",
  "link",
  "linkHover",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "info",
  "infoForeground",
] as const;

export type ColorTokenKey = (typeof COLOR_TOKEN_KEYS)[number];
export type ThemeTokens = Record<ColorTokenKey, string>;

export const TOKEN_CSS_VARS: Record<ColorTokenKey, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  sidebar: "--sidebar-background",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  link: "--link",
  linkHover: "--link-hover",
  success: "--success",
  successForeground: "--success-foreground",
  warning: "--warning",
  warningForeground: "--warning-foreground",
  info: "--info",
  infoForeground: "--info-foreground",
};

export const CONTRAST_PAIRS: [ColorTokenKey, ColorTokenKey][] = [
  ["foreground", "background"],
  ["cardForeground", "card"],
  ["popoverForeground", "popover"],
  ["primaryForeground", "primary"],
  ["secondaryForeground", "secondary"],
  ["mutedForeground", "muted"],
  ["accentForeground", "accent"],
  ["destructiveForeground", "destructive"],
  ["sidebarForeground", "sidebar"],
  ["sidebarPrimaryForeground", "sidebarPrimary"],
  ["sidebarAccentForeground", "sidebarAccent"],
  ["successForeground", "success"],
  ["warningForeground", "warning"],
  ["infoForeground", "info"],
];

export const TOKEN_LABELS: Record<ColorTokenKey, { label: string; hint: string }> = {
  background: { label: "Fundo", hint: "Superfície da página." },
  foreground: { label: "Texto", hint: "Texto principal sobre o fundo." },
  card: { label: "Card", hint: "Fundos de cartões e painéis." },
  cardForeground: { label: "Texto do card", hint: "Texto sobre cartões." },
  popover: { label: "Popover", hint: "Menus, selects e popovers." },
  popoverForeground: { label: "Texto do popover", hint: "Texto em menus flutuantes." },
  primary: { label: "Primária", hint: "Botões, links e ações principais." },
  primaryForeground: { label: "Texto na primária", hint: "Texto sobre botões primários." },
  secondary: { label: "Secundária", hint: "Ações de menor destaque." },
  secondaryForeground: { label: "Texto na secundária", hint: "Texto sobre botões secundários." },
  muted: { label: "Muted", hint: "Áreas suaves, abas inativas." },
  mutedForeground: { label: "Texto muted", hint: "Legendas e ajuda." },
  accent: { label: "Accent", hint: "Hover e seleção discreta." },
  accentForeground: { label: "Texto no accent", hint: "Texto sobre accent." },
  destructive: { label: "Destrutivo", hint: "Excluir, cancelar pedido." },
  destructiveForeground: { label: "Texto destrutivo", hint: "Texto sobre ações destrutivas." },
  border: { label: "Borda", hint: "Contornos de cards e divisórias." },
  input: { label: "Input", hint: "Borda de campos." },
  ring: { label: "Foco (ring)", hint: "Anel de acessibilidade no foco." },
  sidebar: { label: "Sidebar", hint: "Fundo do menu administrativo." },
  sidebarForeground: { label: "Texto da sidebar", hint: "Itens do menu." },
  sidebarPrimary: { label: "Item ativo", hint: "Rota selecionada." },
  sidebarPrimaryForeground: { label: "Texto do item ativo", hint: "Texto no item ativo." },
  sidebarAccent: { label: "Hover da sidebar", hint: "Item sob o cursor." },
  sidebarAccentForeground: { label: "Texto hover sidebar", hint: "Texto no hover." },
  sidebarBorder: { label: "Borda da sidebar", hint: "Separador do menu." },
  sidebarRing: { label: "Foco da sidebar", hint: "Ring no menu." },
  chart1: { label: "Gráfico 1", hint: "Série principal dos gráficos." },
  chart2: { label: "Gráfico 2", hint: "Segunda série." },
  chart3: { label: "Gráfico 3", hint: "Terceira série." },
  chart4: { label: "Gráfico 4", hint: "Quarta série." },
  chart5: { label: "Gráfico 5", hint: "Quinta série." },
  link: { label: "Link", hint: "Hiperlinks da vitrine." },
  linkHover: { label: "Link hover", hint: "Link sob o cursor." },
  success: { label: "Sucesso", hint: "Estados positivos." },
  successForeground: { label: "Texto sucesso", hint: "Texto sobre sucesso." },
  warning: { label: "Alerta", hint: "Avisos e prazos." },
  warningForeground: { label: "Texto alerta", hint: "Texto sobre alerta." },
  info: { label: "Info", hint: "Informações neutras." },
  infoForeground: { label: "Texto info", hint: "Texto sobre info." },
};

export const CORE_TOKEN_KEYS: ColorTokenKey[] = [
  "primary",
  "background",
  "foreground",
  "sidebar",
  "card",
  "destructive",
];

export const BRAND_SCALE_VARS = [
  "--brand-50",
  "--brand-100",
  "--brand-200",
  "--brand-300",
  "--brand-400",
  "--brand-500",
  "--brand-600",
  "--brand-700",
  "--brand-800",
  "--brand-900",
] as const;

/** Paleta jade atual — o tema padrão reproduz o visual já em produção. */
export const DEFAULT_PRIMARY = "#034742";

export const DEFAULT_LIGHT_TOKENS: ThemeTokens = {
  background: "#F8FAFC",
  foreground: "#0F172A",
  card: "#FFFFFF",
  cardForeground: "#0F172A",
  popover: "#FFFFFF",
  popoverForeground: "#0F172A",
  primary: DEFAULT_PRIMARY,
  primaryForeground: "#FFFFFF",
  secondary: "#F1F5F9",
  secondaryForeground: "#0F172A",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  accent: "#E8F4F3",
  accentForeground: DEFAULT_PRIMARY,
  destructive: "#DC2626",
  destructiveForeground: "#FFFFFF",
  border: "#E2E8F0",
  input: "#E2E8F0",
  ring: DEFAULT_PRIMARY,
  sidebar: "#0F172A",
  sidebarForeground: "#F1F5F9",
  sidebarPrimary: DEFAULT_PRIMARY,
  sidebarPrimaryForeground: "#FFFFFF",
  sidebarAccent: "#1E293B",
  sidebarAccentForeground: "#F8FAFC",
  sidebarBorder: "#1E293B",
  sidebarRing: DEFAULT_PRIMARY,
  chart1: DEFAULT_PRIMARY,
  chart2: "#1F6F68",
  chart3: "#45948C",
  chart4: "#7AB5AF",
  chart5: "#B3D6D2",
  link: DEFAULT_PRIMARY,
  linkHover: "#023A36",
  success: "#15803D",
  successForeground: "#FFFFFF",
  warning: "#C2410C",
  warningForeground: "#FFFFFF",
  info: "#1D4ED8",
  infoForeground: "#FFFFFF",
};

export const DEFAULT_DARK_TOKENS: ThemeTokens = {
  background: "#020817",
  foreground: "#F8FAFC",
  card: "#0F172A",
  cardForeground: "#F8FAFC",
  popover: "#0F172A",
  popoverForeground: "#F8FAFC",
  primary: "#45948C",
  primaryForeground: "#022E2B",
  secondary: "#1E293B",
  secondaryForeground: "#F8FAFC",
  muted: "#1E293B",
  mutedForeground: "#94A3B8",
  accent: "#134E4A",
  accentForeground: "#CCFBF1",
  destructive: "#F87171",
  destructiveForeground: "#450A0A",
  border: "#1E293B",
  input: "#1E293B",
  ring: "#45948C",
  sidebar: "#020617",
  sidebarForeground: "#E2E8F0",
  sidebarPrimary: "#45948C",
  sidebarPrimaryForeground: "#022E2B",
  sidebarAccent: "#1E293B",
  sidebarAccentForeground: "#F8FAFC",
  sidebarBorder: "#1E293B",
  sidebarRing: "#45948C",
  chart1: "#45948C",
  chart2: "#7AB5AF",
  chart3: "#B3D6D2",
  chart4: "#FBBF24",
  chart5: "#F87171",
  link: "#5EEAD4",
  linkHover: "#99F6E4",
  success: "#4ADE80",
  successForeground: "#052E16",
  warning: "#FDBA74",
  warningForeground: "#431407",
  info: "#93C5FD",
  infoForeground: "#1E3A8A",
};

export const THEME_MODES = ["LIGHT", "DARK", "SYSTEM"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const DENSITIES = ["COMPACT", "DEFAULT", "COMFORTABLE"] as const;
export type UiDensity = (typeof DENSITIES)[number];

export const RADIUS_PRESETS = [
  { id: "square", value: "0px", label: "Square" },
  { id: "compact", value: "0.25rem", label: "Compact" },
  { id: "default", value: "0.3rem", label: "Default" },
  { id: "rounded", value: "0.75rem", label: "Rounded" },
  { id: "pill", value: "1.5rem", label: "Very Rounded" },
] as const;

export const FONT_OPTIONS = [
  {
    id: "manrope",
    label: "Manrope",
    css: "var(--font-manrope), system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "playfair",
    label: "Playfair Display",
    css: "var(--font-playfair), Georgia, serif",
    kind: "serif",
  },
  {
    id: "system-sans",
    label: "Sistema sans",
    css: 'system-ui, "Segoe UI", sans-serif',
    kind: "sans",
  },
  {
    id: "system-serif",
    label: "Sistema serif",
    css: 'Georgia, "Times New Roman", serif',
    kind: "serif",
  },
] as const;

export type FontId = (typeof FONT_OPTIONS)[number]["id"];

export const DENSITY_VARS: Record<
  UiDensity,
  { controlHeight: string; cardPad: string }
> = {
  COMPACT: { controlHeight: "2rem", cardPad: "1rem" },
  DEFAULT: { controlHeight: "2.25rem", cardPad: "1.5rem" },
  COMFORTABLE: { controlHeight: "2.75rem", cardPad: "1.75rem" },
};

export type ThemeConfig = {
  preset: string;
  mode: ThemeMode;
  allowUserToggle: boolean;
  radius: string;
  density: UiDensity;
  fontHeading: FontId;
  fontBody: FontId;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export const DEFAULT_THEME: ThemeConfig = {
  preset: "jade",
  mode: "LIGHT",
  allowUserToggle: false,
  radius: "0.3rem",
  density: "DEFAULT",
  fontHeading: "playfair",
  fontBody: "manrope",
  light: DEFAULT_LIGHT_TOKENS,
  dark: DEFAULT_DARK_TOKENS,
};

export function brandScaleFromPrimary(primary: string): Record<string, string> {
  const hsl = hexToHsl(primary);
  if (!hsl) {
    return {
      "50": "#F0F7F6",
      "100": "#D8EBE9",
      "200": "#B3D6D2",
      "300": "#7AB5AF",
      "400": "#45948C",
      "500": "#1F6F68",
      "600": primary,
      "700": "#023A36",
      "800": "#022E2B",
      "900": "#011F1D",
    };
  }
  const step = (l: number, s = hsl.s) =>
    hslToHex({ h: hsl.h, s: Math.max(8, Math.min(92, s)), l });
  return {
    "50": step(97, hsl.s * 0.18),
    "100": step(93, hsl.s * 0.28),
    "200": step(84, hsl.s * 0.4),
    "300": step(68, hsl.s * 0.55),
    "400": step(48, hsl.s * 0.75),
    "500": step(Math.min(36, hsl.l + 8)),
    "600": primary,
    "700": step(Math.max(10, hsl.l * 0.78)),
    "800": step(Math.max(8, hsl.l * 0.58)),
    "900": step(Math.max(6, hsl.l * 0.4)),
  };
}

export function deriveLightFromPrimary(primary: string): ThemeTokens {
  const fg = pickForeground(primary);
  const mutedBg = mixHex("#F8FAFC", primary, 0.04) ?? "#F8FAFC";
  const accent = mixHex("#FFFFFF", primary, 0.08) ?? "#E8F4F3";
  const hover = adjustHsl(primary, { l: -8 }) ?? primary;
  const scale = brandScaleFromPrimary(primary);
  return {
    ...DEFAULT_LIGHT_TOKENS,
    primary,
    primaryForeground: fg,
    accent,
    accentForeground: primary,
    ring: primary,
    sidebarPrimary: primary,
    sidebarPrimaryForeground: fg,
    sidebarRing: primary,
    chart1: primary,
    chart2: scale["500"],
    chart3: scale["400"],
    chart4: scale["300"],
    chart5: scale["200"],
    link: primary,
    linkHover: hover,
    muted: mutedBg,
    secondary: mutedBg,
  };
}

export function deriveDarkFromPrimary(primary: string): ThemeTokens {
  const lifted = adjustHsl(primary, { l: 18, s: -12 }) ?? primary;
  const fg = pickForeground(lifted);
  const scale = brandScaleFromPrimary(lifted);
  return {
    ...DEFAULT_DARK_TOKENS,
    primary: lifted,
    primaryForeground: fg,
    accent: mixHex("#0F172A", lifted, 0.35) ?? "#134E4A",
    accentForeground: mixHex("#F8FAFC", lifted, 0.15) ?? "#CCFBF1",
    ring: lifted,
    sidebarPrimary: lifted,
    sidebarPrimaryForeground: fg,
    sidebarRing: lifted,
    chart1: lifted,
    chart2: scale["400"],
    chart3: scale["300"],
    chart4: "#FBBF24",
    chart5: "#F87171",
    link: scale["300"],
    linkHover: scale["200"],
  };
}
