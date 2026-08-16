import { z } from "zod";

import type { ThemeConfig } from "@/lib/theme/tokens";
import { DEFAULT_THEME } from "@/lib/theme/tokens";

export const APP_SETTINGS_ID = "singleton";
export const APP_SETTINGS_CACHE_TAG = "app-settings";

export const PRINT_FORMATS = ["THERMAL_80MM", "A4"] as const;
export type PrintFormatCode = (typeof PRINT_FORMATS)[number];

export const PRINT_PROFILE_CODES = {
  thermal: "receipt_thermal",
  a4: "production_a4",
} as const;

export const PRICING_DEFAULT_MODES = [
  "markupPercent",
  "marginPercent",
  "fixedProfit",
  "finalPrice",
] as const;

export const APP_SETTINGS_LIMITS = {
  storeName: 80,
  legalName: 120,
  tradeName: 80,
  documentNumber: 32,
  email: 120,
  phone: 32,
  whatsapp: 32,
  website: 200,
  instagram: 80,
  address: 120,
  addressNumber: 20,
  complement: 80,
  neighborhood: 80,
  city: 80,
  state: 2,
  postalCode: 12,
  country: 8,
  businessHours: 120,
  logoUrl: 500,
  primaryColor: 16,
  brandTagline: 280,
} as const;

export type PrintFlags = {
  showPrices: boolean;
  showCustomerData: boolean;
  showMaterials: boolean;
  showStoreHeader: boolean;
  showOrderNumber: boolean;
  showDate: boolean;
  showSeller: boolean;
  showNotes: boolean;
  showTotals: boolean;
  showPayment: boolean;
  showProductionData: boolean;
};

export type PrintProfileView = PrintFlags & {
  id: string;
  code: string;
  name: string;
  kind: string;
  format: PrintFormatCode;
};

export type CompanyIdentity = {
  storeName: string;
  legalName: string;
  tradeName: string;
  documentNumber: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  address: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  businessHours: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  primaryColor: string;
  brandTagline: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

export type AppSettingsView = CompanyIdentity & {
  defaultPrintFormat: PrintFormatCode;
  pricingDefaultMode: string;
  pricingDefaultValue: number;
  weightDecimalPlaces: number;
  productionDefaultDueDays: number;
  productionShowProcessChecklist: boolean;
  productionTrackLoss: boolean;
  thermalProfile: PrintProfileView;
  a4Profile: PrintProfileView;
  theme: ThemeConfig;
};

export type PrintContext = {
  format: PrintFormatCode;
  company: CompanyIdentity;
  profile: PrintFlags;
  productionDefaultDueDays: number;
  productionShowProcessChecklist: boolean;
  productionTrackLoss: boolean;
  weightDecimalPlaces: number;
};

export const PRINT_FLAG_KEYS = [
  "showPrices",
  "showCustomerData",
  "showMaterials",
  "showStoreHeader",
  "showOrderNumber",
  "showDate",
  "showSeller",
  "showNotes",
  "showTotals",
  "showPayment",
  "showProductionData",
] as const;

export const PRINT_FLAG_LABELS: Record<(typeof PRINT_FLAG_KEYS)[number], string> = {
  showStoreHeader: "Cabeçalho da loja",
  showCustomerData: "Dados do cliente",
  showMaterials: "Materiais (BOM)",
  showPrices: "Preços (impressão comercial)",
  showNotes: "Observações",
  showDate: "Data",
  showOrderNumber: "Número do pedido",
  showSeller: "Vendedor",
  showTotals: "Totais",
  showPayment: "Pagamento / sinal",
  showProductionData: "Dados de produção",
};

const optionalText = (max: number) => z.string().trim().max(max);

export const appSettingsFormSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(1, "Informe o nome da loja.")
    .max(APP_SETTINGS_LIMITS.storeName),
  legalName: optionalText(APP_SETTINGS_LIMITS.legalName),
  tradeName: optionalText(APP_SETTINGS_LIMITS.tradeName),
  documentNumber: optionalText(APP_SETTINGS_LIMITS.documentNumber),
  email: optionalText(APP_SETTINGS_LIMITS.email),
  phone: optionalText(APP_SETTINGS_LIMITS.phone),
  whatsapp: optionalText(APP_SETTINGS_LIMITS.whatsapp),
  website: optionalText(APP_SETTINGS_LIMITS.website),
  instagram: optionalText(APP_SETTINGS_LIMITS.instagram),
  address: optionalText(APP_SETTINGS_LIMITS.address),
  addressNumber: optionalText(APP_SETTINGS_LIMITS.addressNumber),
  complement: optionalText(APP_SETTINGS_LIMITS.complement),
  neighborhood: optionalText(APP_SETTINGS_LIMITS.neighborhood),
  city: optionalText(APP_SETTINGS_LIMITS.city),
  state: optionalText(APP_SETTINGS_LIMITS.state),
  postalCode: optionalText(APP_SETTINGS_LIMITS.postalCode),
  country: optionalText(APP_SETTINGS_LIMITS.country),
  businessHours: optionalText(APP_SETTINGS_LIMITS.businessHours),
  logoUrl: optionalText(APP_SETTINGS_LIMITS.logoUrl),
  logoDarkUrl: optionalText(APP_SETTINGS_LIMITS.logoUrl),
  faviconUrl: optionalText(APP_SETTINGS_LIMITS.logoUrl),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Use uma cor hexadecimal (#034742).")
    .default("#034742"),
  defaultPrintFormat: z.enum(PRINT_FORMATS),
  pricingDefaultMode: z.enum(PRICING_DEFAULT_MODES),
  pricingDefaultValue: z.number().finite().min(0).max(10_000),
  weightDecimalPlaces: z.number().int().min(0).max(4),
  productionDefaultDueDays: z.number().int().min(0).max(365),
  productionShowProcessChecklist: z.boolean(),
  productionTrackLoss: z.boolean(),
  thermalFlags: z.object(
    Object.fromEntries(PRINT_FLAG_KEYS.map((key) => [key, z.boolean()])) as Record<
      (typeof PRINT_FLAG_KEYS)[number],
      z.ZodBoolean
    >
  ),
  a4Flags: z.object(
    Object.fromEntries(PRINT_FLAG_KEYS.map((key) => [key, z.boolean()])) as Record<
      (typeof PRINT_FLAG_KEYS)[number],
      z.ZodBoolean
    >
  ),
});

export type AppSettingsFormInput = z.infer<typeof appSettingsFormSchema>;

const FALLBACK_COMPANY: CompanyIdentity = {
  storeName: "AllAtiva Joias",
  legalName: "",
  tradeName: "",
  documentNumber: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  instagram: "",
  address: "",
  addressNumber: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  postalCode: "",
  country: "BR",
  businessHours: "",
  logoUrl: "",
  logoDarkUrl: "",
  faviconUrl: "",
  ogImageUrl: "",
  primaryColor: "#034742",
  brandTagline: "",
  facebookUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
};

const FALLBACK_THERMAL: PrintProfileView = {
  id: "pp_receipt_thermal",
  code: PRINT_PROFILE_CODES.thermal,
  name: "Recibo de venda (80mm)",
  kind: "RECEIPT",
  format: "THERMAL_80MM",
  showPrices: true,
  showCustomerData: true,
  showMaterials: true,
  showStoreHeader: true,
  showOrderNumber: true,
  showDate: true,
  showSeller: true,
  showNotes: true,
  showTotals: true,
  showPayment: true,
  showProductionData: false,
};

const FALLBACK_A4: PrintProfileView = {
  id: "pp_production_a4",
  code: PRINT_PROFILE_CODES.a4,
  name: "Ordem de Produção (A4)",
  kind: "PRODUCTION_ORDER",
  format: "A4",
  showPrices: false,
  showCustomerData: true,
  showMaterials: true,
  showStoreHeader: true,
  showOrderNumber: true,
  showDate: true,
  showSeller: true,
  showNotes: true,
  showTotals: false,
  showPayment: false,
  showProductionData: true,
};

export const FALLBACK_APP_SETTINGS: AppSettingsView = {
  ...FALLBACK_COMPANY,
  defaultPrintFormat: "THERMAL_80MM",
  pricingDefaultMode: "markupPercent",
  pricingDefaultValue: 100,
  weightDecimalPlaces: 2,
  productionDefaultDueDays: 15,
  productionShowProcessChecklist: true,
  productionTrackLoss: true,
  thermalProfile: FALLBACK_THERMAL,
  a4Profile: FALLBACK_A4,
  theme: DEFAULT_THEME,
};

export function toPrintContext(
  settings: AppSettingsView,
  format: PrintFormatCode = settings.defaultPrintFormat
): PrintContext {
  const isA4 = format === "A4";
  return {
    format,
    company: settings,
    profile: isA4 ? settings.a4Profile : settings.thermalProfile,
    productionDefaultDueDays: settings.productionDefaultDueDays,
    productionShowProcessChecklist: settings.productionShowProcessChecklist,
    productionTrackLoss: settings.productionTrackLoss,
    weightDecimalPlaces: settings.weightDecimalPlaces,
  };
}

function boolFromForm(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function numFromForm(formData: FormData, key: string): number {
  const value = Number(String(formData.get(key) ?? ""));
  return Number.isFinite(value) ? value : NaN;
}

function flagsFromForm(formData: FormData, prefix: string): PrintFlags {
  return {
    showPrices: boolFromForm(formData, `${prefix}.showPrices`),
    showCustomerData: boolFromForm(formData, `${prefix}.showCustomerData`),
    showMaterials: boolFromForm(formData, `${prefix}.showMaterials`),
    showStoreHeader: boolFromForm(formData, `${prefix}.showStoreHeader`),
    showOrderNumber: boolFromForm(formData, `${prefix}.showOrderNumber`),
    showDate: boolFromForm(formData, `${prefix}.showDate`),
    showSeller: boolFromForm(formData, `${prefix}.showSeller`),
    showNotes: boolFromForm(formData, `${prefix}.showNotes`),
    showTotals: boolFromForm(formData, `${prefix}.showTotals`),
    showPayment: boolFromForm(formData, `${prefix}.showPayment`),
    showProductionData: boolFromForm(formData, `${prefix}.showProductionData`),
  };
}

export function parseAppSettingsForm(formData: FormData) {
  return appSettingsFormSchema.safeParse({
    storeName: String(formData.get("storeName") ?? ""),
    legalName: String(formData.get("legalName") ?? ""),
    tradeName: String(formData.get("tradeName") ?? ""),
    documentNumber: String(formData.get("documentNumber") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    website: String(formData.get("website") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    address: String(formData.get("address") ?? ""),
    addressNumber: String(formData.get("addressNumber") ?? ""),
    complement: String(formData.get("complement") ?? ""),
    neighborhood: String(formData.get("neighborhood") ?? ""),
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    country: String(formData.get("country") ?? "BR") || "BR",
    businessHours: String(formData.get("businessHours") ?? ""),
    logoUrl: String(formData.get("logoUrl") ?? ""),
    logoDarkUrl: String(formData.get("logoDarkUrl") ?? ""),
    faviconUrl: String(formData.get("faviconUrl") ?? ""),
    primaryColor: String(formData.get("primaryColor") ?? "#034742"),
    defaultPrintFormat: String(formData.get("defaultPrintFormat") ?? "THERMAL_80MM"),
    pricingDefaultMode: String(formData.get("pricingDefaultMode") ?? "markupPercent"),
    pricingDefaultValue: numFromForm(formData, "pricingDefaultValue"),
    weightDecimalPlaces: numFromForm(formData, "weightDecimalPlaces"),
    productionDefaultDueDays: numFromForm(formData, "productionDefaultDueDays"),
    productionShowProcessChecklist: boolFromForm(
      formData,
      "productionShowProcessChecklist"
    ),
    productionTrackLoss: boolFromForm(formData, "productionTrackLoss"),
    thermalFlags: flagsFromForm(formData, "thermal"),
    a4Flags: flagsFromForm(formData, "a4"),
  });
}

export function toAppSettingsView(
  data: AppSettingsFormInput,
  base: AppSettingsView
): AppSettingsView {
  return {
    ...base,
    storeName: data.storeName,
    legalName: data.legalName,
    tradeName: data.tradeName,
    documentNumber: data.documentNumber,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
    website: data.website,
    instagram: data.instagram,
    address: data.address,
    addressNumber: data.addressNumber,
    complement: data.complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
    businessHours: data.businessHours,
    logoUrl: data.logoUrl,
    logoDarkUrl: data.logoDarkUrl,
    faviconUrl: data.faviconUrl,
    primaryColor: data.primaryColor,
    defaultPrintFormat: data.defaultPrintFormat,
    pricingDefaultMode: data.pricingDefaultMode,
    pricingDefaultValue: data.pricingDefaultValue,
    weightDecimalPlaces: data.weightDecimalPlaces,
    productionDefaultDueDays: data.productionDefaultDueDays,
    productionShowProcessChecklist: data.productionShowProcessChecklist,
    productionTrackLoss: data.productionTrackLoss,
    thermalProfile: { ...base.thermalProfile, ...data.thermalFlags },
    a4Profile: { ...base.a4Profile, ...data.a4Flags },
  };
}

export function formatCompanyAddress(company: CompanyIdentity): string | null {
  const line1 = [company.address, company.addressNumber]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
  const cityState = [company.city.trim(), company.state.trim()]
    .filter(Boolean)
    .join(" — ");
  const parts = [
    line1,
    company.complement.trim(),
    company.neighborhood.trim(),
    cityState,
    company.postalCode.trim(),
  ].filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function whatsappHref(whatsapp: string): string | null {
  const digits = whatsapp.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function instagramHref(instagram: string): string | null {
  const value = instagram.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  if (!handle) return null;
  return `https://www.instagram.com/${handle}/`;
}

export function websiteHref(website: string): string | null {
  const value = website.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/** Href http(s) seguro para redes sociais e site. Rejeita javascript:/data:. */
export function safeHttpHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/javascript:|data:|vbscript:/i.test(trimmed)) return null;
  const href = websiteHref(trimmed);
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (/javascript:|data:|vbscript:/i.test(url.href)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export const DEFAULT_PRODUCTION_STEPS = [
  "CAD",
  "Impressão 3D",
  "Fundição",
  "Desbaste",
  "Acabamento",
  "Cravação",
  "Polimento",
  "Banho",
  "Controle de Qualidade",
  "Embalagem",
] as const;
