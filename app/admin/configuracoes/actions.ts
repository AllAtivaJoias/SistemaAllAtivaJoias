"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import {
  APP_SETTINGS_ID,
  PRINT_PROFILE_CODES,
  parseAppSettingsForm,
} from "@/lib/app-settings";
import { revalidateAppSettings } from "@/lib/app-settings-query";

export type SettingsActionState = {
  error?: string;
  success?: boolean;
};

export async function updateAppSettings(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const session = await requireAdmin();

  const parsed = parseAppSettingsForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const before = await prisma.appSettings.findUnique({
    where: { id: APP_SETTINGS_ID },
    select: {
      defaultPrintFormat: true,
      pricingDefaultMode: true,
      pricingDefaultValue: true,
    },
  });

  try {
    await prisma.$transaction([
      prisma.appSettings.upsert({
        where: { id: APP_SETTINGS_ID },
        create: {
          id: APP_SETTINGS_ID,
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
        },
        update: {
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
        },
      }),
      prisma.printProfile.upsert({
        where: { code: PRINT_PROFILE_CODES.thermal },
        create: {
          id: "pp_receipt_thermal",
          code: PRINT_PROFILE_CODES.thermal,
          name: "Recibo de venda (80mm)",
          kind: "RECEIPT",
          format: "THERMAL_80MM",
          isSystem: true,
          ...data.thermalFlags,
        },
        update: data.thermalFlags,
      }),
      prisma.printProfile.upsert({
        where: { code: PRINT_PROFILE_CODES.a4 },
        create: {
          id: "pp_production_a4",
          code: PRINT_PROFILE_CODES.a4,
          name: "Ordem de Produção (A4)",
          kind: "PRODUCTION_ORDER",
          format: "A4",
          isSystem: true,
          ...data.a4Flags,
        },
        update: data.a4Flags,
      }),
    ]);
  } catch (error) {
    logger.error("app_settings.update_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível salvar as configurações." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "APP_SETTINGS_UPDATE",
    entity: "AppSettings",
    entityId: APP_SETTINGS_ID,
    before: before
      ? {
          defaultPrintFormat: before.defaultPrintFormat,
          pricingDefaultMode: before.pricingDefaultMode,
          pricingDefaultValue: Number(before.pricingDefaultValue),
        }
      : undefined,
    after: {
      defaultPrintFormat: data.defaultPrintFormat,
      pricingDefaultMode: data.pricingDefaultMode,
      pricingDefaultValue: data.pricingDefaultValue,
      storeName: data.storeName,
    },
  });

  revalidateAppSettings();
  revalidatePath("/admin/configuracoes");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/pedidos/historico");
  revalidatePath("/admin/ficha-tecnica");
  revalidatePath("/");
  return { success: true };
}
