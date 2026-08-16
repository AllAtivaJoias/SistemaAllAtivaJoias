import {
  DEFAULT_DARK_TOKENS,
  DEFAULT_LIGHT_TOKENS,
  DEFAULT_THEME,
  deriveDarkFromPrimary,
  deriveLightFromPrimary,
  type ThemeConfig,
  type ThemeTokens,
} from "@/lib/theme/tokens";

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  primary: string;
  theme: ThemeConfig;
};

function withPrimary(id: string, name: string, description: string, primary: string): ThemePreset {
  return {
    id,
    name,
    description,
    primary,
    theme: {
      ...DEFAULT_THEME,
      preset: id,
      light: deriveLightFromPrimary(primary),
      dark: deriveDarkFromPrimary(primary),
    },
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "jade",
    name: "Jade AllAtiva",
    description: "Tema atual — luxo sóbrio com jade.",
    primary: "#034742",
    theme: {
      ...DEFAULT_THEME,
      preset: "jade",
      light: DEFAULT_LIGHT_TOKENS,
      dark: DEFAULT_DARK_TOKENS,
    },
  },
  withPrimary("gold", "Ouro Premium", "Ouro sobre neutros quentes.", "#B8860B"),
  withPrimary("luxury", "Preto & Dourado", "Alto contraste editorial.", "#111111"),
  withPrimary("editorial", "Branco Editorial", "Fundo claro, preto como marca.", "#0A0A0A"),
  withPrimary("modern", "Moderno", "Azul contemporâneo.", "#1D4ED8"),
  withPrimary("elegant", "Elegante", "Vinho / joalheria clássica.", "#7F1D1D"),
  withPrimary("minimal", "Minimalista", "Grafite discreto.", "#334155"),
];

export function getPreset(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id);
}

export function applyPreset(id: string, current: ThemeConfig): ThemeConfig {
  const preset = getPreset(id);
  if (!preset) return current;
  return {
    ...preset.theme,
    mode: current.mode,
    allowUserToggle: current.allowUserToggle,
    density: current.density,
    fontHeading: current.fontHeading,
    fontBody: current.fontBody,
  };
}
