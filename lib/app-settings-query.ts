import { unstable_cache, revalidateTag } from "next/cache";
import type { PrintFormat } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  APP_SETTINGS_CACHE_TAG,
  APP_SETTINGS_ID,
  FALLBACK_APP_SETTINGS,
  PRINT_PROFILE_CODES,
  type AppSettingsView,
  type PrintProfileView,
} from "@/lib/app-settings";
import { parseThemeConfig } from "@/lib/theme/schema";

function toProfileView(row: {
  id: string;
  code: string;
  name: string;
  kind: string;
  format: PrintFormat;
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
}): PrintProfileView {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    kind: row.kind,
    format: row.format,
    showPrices: row.showPrices,
    showCustomerData: row.showCustomerData,
    showMaterials: row.showMaterials,
    showStoreHeader: row.showStoreHeader,
    showOrderNumber: row.showOrderNumber,
    showDate: row.showDate,
    showSeller: row.showSeller,
    showNotes: row.showNotes,
    showTotals: row.showTotals,
    showPayment: row.showPayment,
    showProductionData: row.showProductionData,
  };
}

async function loadAppSettings(): Promise<AppSettingsView> {
  const [settings, profiles] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: APP_SETTINGS_ID } }),
    prisma.printProfile.findMany({
      where: {
        code: { in: [PRINT_PROFILE_CODES.thermal, PRINT_PROFILE_CODES.a4] },
      },
    }),
  ]);

  const thermal =
    profiles
      .map(toProfileView)
      .find((row) => row.code === PRINT_PROFILE_CODES.thermal) ??
    FALLBACK_APP_SETTINGS.thermalProfile;
  const a4 =
    profiles
      .map(toProfileView)
      .find((row) => row.code === PRINT_PROFILE_CODES.a4) ??
    FALLBACK_APP_SETTINGS.a4Profile;

  if (!settings) {
    return { ...FALLBACK_APP_SETTINGS, thermalProfile: thermal, a4Profile: a4 };
  }

  return {
    storeName: settings.storeName,
    legalName: settings.legalName,
    tradeName: settings.tradeName,
    documentNumber: settings.documentNumber,
    email: settings.email,
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    website: settings.website,
    instagram: settings.instagram,
    address: settings.address,
    addressNumber: settings.addressNumber,
    complement: settings.complement,
    neighborhood: settings.neighborhood,
    city: settings.city,
    state: settings.state,
    postalCode: settings.postalCode,
    country: settings.country,
    businessHours: settings.businessHours,
    logoUrl: settings.logoUrl,
    logoDarkUrl: settings.logoDarkUrl,
    faviconUrl: settings.faviconUrl,
    ogImageUrl: settings.ogImageUrl,
    primaryColor: settings.primaryColor,
    brandTagline: settings.brandTagline,
    facebookUrl: settings.facebookUrl,
    youtubeUrl: settings.youtubeUrl,
    tiktokUrl: settings.tiktokUrl,
    defaultPrintFormat: settings.defaultPrintFormat,
    pricingDefaultMode: settings.pricingDefaultMode,
    pricingDefaultValue: Number(settings.pricingDefaultValue),
    weightDecimalPlaces: settings.weightDecimalPlaces,
    productionDefaultDueDays: settings.productionDefaultDueDays,
    productionShowProcessChecklist: settings.productionShowProcessChecklist,
    productionTrackLoss: settings.productionTrackLoss,
    thermalProfile: thermal,
    a4Profile: a4,
    theme: parseThemeConfig({
      themeLight: settings.themeLight,
      themeDark: settings.themeDark,
      themePreset: settings.themePreset,
      themeMode: settings.themeMode,
      themeAllowUserToggle: settings.themeAllowUserToggle,
      themeRadius: settings.themeRadius,
      themeDensity: settings.themeDensity,
      fontHeading: settings.fontHeading,
      fontBody: settings.fontBody,
      primaryColor: settings.primaryColor,
    }),
  };
}

const getAppSettingsCached = unstable_cache(loadAppSettings, ["app-settings"], {
  tags: [APP_SETTINGS_CACHE_TAG],
});

export async function getAppSettings(): Promise<AppSettingsView> {
  try {
    return await getAppSettingsCached();
  } catch (error) {
    logger.error("app_settings.load_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return FALLBACK_APP_SETTINGS;
  }
}

export function revalidateAppSettings() {
  revalidateTag(APP_SETTINGS_CACHE_TAG);
}
