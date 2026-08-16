/**
 * Motor de cor do design system.
 * O CSS do projeto usa canais HSL (`hsl(var(--primary))`) — Tailwind 3 + shadcn new-york.
 * HEX é o formato persistido; HSL é o formato emitido. OKLCH existe só para análise.
 */

export const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim());
}

export function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (HEX_PATTERN.test(trimmed)) return trimmed.toUpperCase();
  const short = /^#([0-9A-Fa-f]{3})$/.exec(trimmed);
  if (!short) return null;
  const [r, g, b] = short[1].split("");
  return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function hexToHsl(hex: string): Hsl | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 3600) / 10,
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10,
  };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hh = ((h % 360) + 360) % 360;
  const ss = Math.max(0, Math.min(100, s)) / 100;
  const ll = Math.max(0, Math.min(100, l)) / 100;
  if (ss === 0) {
    const v = Math.round(ll * 255);
    return { r: v, g: v, b: v };
  }
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hk = hh / 360;
  const channel = (t: number) => {
    let tc = t;
    if (tc < 0) tc += 1;
    if (tc > 1) tc -= 1;
    if (tc < 1 / 6) return p + (q - p) * 6 * tc;
    if (tc < 1 / 2) return q;
    if (tc < 2 / 3) return p + (q - p) * (2 / 3 - tc) * 6;
    return p;
  };
  return {
    r: Math.round(channel(hk + 1 / 3) * 255),
    g: Math.round(channel(hk) * 255),
    b: Math.round(channel(hk - 1 / 3) * 255),
  };
}

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Canais HSL no formato das CSS variables do shadcn: "176 92% 14.5%" */
export function hexToHslChannels(hex: string): string | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  return `${formatNum(hsl.h)} ${formatNum(hsl.s)}% ${formatNum(hsl.l)}%`;
}

function formatNum(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contraste WCAG 2.x entre duas cores HEX. */
export function contrastRatio(foreground: string, background: string): number | null {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  if (l1 === null || l2 === null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

export type WcagLevel = "fail" | "AA" | "AAA";

export function wcagLevel(
  ratio: number,
  options: { largeText?: boolean } = {}
): WcagLevel {
  const aa = options.largeText ? 3 : 4.5;
  const aaa = options.largeText ? 4.5 : 7;
  if (ratio >= aaa) return "AAA";
  if (ratio >= aa) return "AA";
  return "fail";
}

export function pickForeground(background: string): "#FFFFFF" | "#0F172A" {
  const white = contrastRatio("#FFFFFF", background) ?? 0;
  const dark = contrastRatio("#0F172A", background) ?? 0;
  return white >= dark ? "#FFFFFF" : "#0F172A";
}

export function mixHex(a: string, b: string, amount: number): string | null {
  const aRgb = hexToRgb(a);
  const bRgb = hexToRgb(b);
  if (!aRgb || !bRgb) return null;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: aRgb.r + (bRgb.r - aRgb.r) * t,
    g: aRgb.g + (bRgb.g - aRgb.g) * t,
    b: aRgb.b + (bRgb.b - aRgb.b) * t,
  });
}

export function adjustHsl(
  hex: string,
  delta: Partial<{ h: number; s: number; l: number }>
): string | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  return hslToHex({
    h: hsl.h + (delta.h ?? 0),
    s: Math.max(0, Math.min(100, hsl.s + (delta.s ?? 0))),
    l: Math.max(0, Math.min(100, hsl.l + (delta.l ?? 0))),
  });
}

/**
 * Conversão sRGB → OKLCH (referência Bottosson). Usada em testes e no picker;
 * o CSS emitido continua em HSL para compatibilidade com o Tailwind atual.
 */
export function hexToOklch(hex: string): { l: number; c: number; h: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return {
    l: Math.round(L * 1000) / 1000,
    c: Math.round(C * 1000) / 1000,
    h: Math.round(H * 10) / 10,
  };
}

export function parseColorInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /javascript:|data:|expression\(/i.test(trimmed)) return null;
  return normalizeHex(trimmed.startsWith("#") ? trimmed : `#${trimmed}`);
}
