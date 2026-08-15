import { z } from "zod";

import { prisma } from "@/lib/prisma";

/** Singleton: um único registro de configuração da vitrine. */
export const STORE_SETTINGS_ID = "singleton";

/** Limites de tamanho dos textos administráveis. */
export const STORE_TEXT_LIMITS = {
  heroTitle: 120,
  heroSubtitle: 280,
  footerText: 280,
} as const;

/** Textos padrão da vitrine (fallback quando o admin não preencheu). */
export const STORE_DEFAULTS = {
  heroTitle: "AllAtiva Joias",
  heroSubtitle:
    "Peças exclusivas pensadas com precisão e elegância. Explore o catálogo e descubra joias que celebram cada momento.",
  footerText: "Joalheria de alto padrão — elegância em cada detalhe.",
} as const;

export interface StoreSettingsData {
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
}

/** Validação dos campos (texto puro; sem HTML). */
export const storeSettingsSchema = z.object({
  heroTitle: z
    .string()
    .trim()
    .max(STORE_TEXT_LIMITS.heroTitle, "Título principal muito longo."),
  heroSubtitle: z
    .string()
    .trim()
    .max(STORE_TEXT_LIMITS.heroSubtitle, "Subtítulo muito longo."),
  footerText: z
    .string()
    .trim()
    .max(STORE_TEXT_LIMITS.footerText, "Texto do rodapé muito longo."),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

function withFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

/** Aplica os textos padrão sobre valores vazios (uso público). */
export function resolveStoreSettings(raw: StoreSettingsData): StoreSettingsData {
  return {
    heroTitle: withFallback(raw.heroTitle, STORE_DEFAULTS.heroTitle),
    heroSubtitle: withFallback(raw.heroSubtitle, STORE_DEFAULTS.heroSubtitle),
    footerText: withFallback(raw.footerText, STORE_DEFAULTS.footerText),
  };
}

const EMPTY: StoreSettingsData = {
  heroTitle: "",
  heroSubtitle: "",
  footerText: "",
};

/**
 * Lê os valores brutos salvos (para o formulário admin). Não grava no banco
 * durante a leitura — evita escrita em GET e condições de corrida.
 */
export async function getStoreSettingsRaw(): Promise<StoreSettingsData> {
  const row = await prisma.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: { heroTitle: true, heroSubtitle: true, footerText: true },
  });
  return row ?? EMPTY;
}

/** Lê os valores resolvidos com fallback (uso público na vitrine). */
export async function getStoreSettings(): Promise<StoreSettingsData> {
  return resolveStoreSettings(await getStoreSettingsRaw());
}
