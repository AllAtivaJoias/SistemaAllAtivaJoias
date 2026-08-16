"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { APP_SETTINGS_ID } from "@/lib/app-settings";
import { revalidateAppSettings } from "@/lib/app-settings-query";
import { appearancePayloadSchema } from "@/lib/theme/schema";
import { DEFAULT_THEME } from "@/lib/theme/tokens";

export type ThemeActionState = {
  error?: string;
  success?: boolean;
};

export async function publishAppearance(
  _prev: ThemeActionState,
  formData: FormData
): Promise<ThemeActionState> {
  const session = await requireAdmin();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? "{}"));
  } catch {
    return { error: "Payload inválido." };
  }

  const parsed = appearancePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;
  const before = await prisma.appSettings.findUnique({
    where: { id: APP_SETTINGS_ID },
    select: {
      storeName: true,
      logoUrl: true,
      faviconUrl: true,
      primaryColor: true,
      themePreset: true,
      themeMode: true,
    },
  });

  try {
    await prisma.appSettings.upsert({
      where: { id: APP_SETTINGS_ID },
      create: {
        id: APP_SETTINGS_ID,
        storeName: data.storeName,
        brandTagline: data.brandTagline,
        logoUrl: data.logoUrl,
        logoDarkUrl: data.logoDarkUrl,
        faviconUrl: data.faviconUrl,
        ogImageUrl: data.ogImageUrl,
        website: data.website,
        instagram: data.instagram,
        facebookUrl: data.facebookUrl,
        youtubeUrl: data.youtubeUrl,
        tiktokUrl: data.tiktokUrl,
        primaryColor: data.theme.light.primary,
        themePreset: data.theme.preset,
        themeMode: data.theme.mode,
        themeAllowUserToggle: data.theme.allowUserToggle,
        themeRadius: data.theme.radius,
        themeDensity: data.theme.density,
        fontHeading: data.theme.fontHeading,
        fontBody: data.theme.fontBody,
        themeLight: data.theme.light,
        themeDark: data.theme.dark,
        themePublishedAt: new Date(),
      },
      update: {
        storeName: data.storeName,
        brandTagline: data.brandTagline,
        logoUrl: data.logoUrl,
        logoDarkUrl: data.logoDarkUrl,
        faviconUrl: data.faviconUrl,
        ogImageUrl: data.ogImageUrl,
        website: data.website,
        instagram: data.instagram,
        facebookUrl: data.facebookUrl,
        youtubeUrl: data.youtubeUrl,
        tiktokUrl: data.tiktokUrl,
        primaryColor: data.theme.light.primary,
        themePreset: data.theme.preset,
        themeMode: data.theme.mode,
        themeAllowUserToggle: data.theme.allowUserToggle,
        themeRadius: data.theme.radius,
        themeDensity: data.theme.density,
        fontHeading: data.theme.fontHeading,
        fontBody: data.theme.fontBody,
        themeLight: data.theme.light,
        themeDark: data.theme.dark,
        themePublishedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("appearance.publish_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível publicar a aparência." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "THEME_PUBLISH",
    entity: "AppSettings",
    entityId: APP_SETTINGS_ID,
    before: before ?? undefined,
    after: {
      storeName: data.storeName,
      logoUrl: data.logoUrl,
      faviconUrl: data.faviconUrl,
      primary: data.theme.light.primary,
      preset: data.theme.preset,
      mode: data.theme.mode,
    },
  });

  revalidateAppSettings();
  revalidatePath("/");
  revalidatePath("/admin/aparencia");
  revalidatePath("/admin/login");
  revalidatePath("/admin");
  return { success: true };
}

export async function resetAppearanceTheme(): Promise<ThemeActionState> {
  const session = await requireAdmin();
  try {
    await prisma.appSettings.upsert({
      where: { id: APP_SETTINGS_ID },
      create: {
        id: APP_SETTINGS_ID,
        primaryColor: DEFAULT_THEME.light.primary,
        themePreset: DEFAULT_THEME.preset,
        themeMode: DEFAULT_THEME.mode,
        themeAllowUserToggle: false,
        themeRadius: DEFAULT_THEME.radius,
        themeDensity: DEFAULT_THEME.density,
        fontHeading: DEFAULT_THEME.fontHeading,
        fontBody: DEFAULT_THEME.fontBody,
        themeLight: DEFAULT_THEME.light,
        themeDark: DEFAULT_THEME.dark,
        themePublishedAt: new Date(),
      },
      update: {
        primaryColor: DEFAULT_THEME.light.primary,
        themePreset: DEFAULT_THEME.preset,
        themeMode: DEFAULT_THEME.mode,
        themeAllowUserToggle: false,
        themeRadius: DEFAULT_THEME.radius,
        themeDensity: DEFAULT_THEME.density,
        fontHeading: DEFAULT_THEME.fontHeading,
        fontBody: DEFAULT_THEME.fontBody,
        themeLight: DEFAULT_THEME.light,
        themeDark: DEFAULT_THEME.dark,
        themePublishedAt: new Date(),
      },
    });
  } catch (error) {
    logger.error("appearance.reset_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível restaurar o tema." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "THEME_RESET",
    entity: "AppSettings",
    entityId: APP_SETTINGS_ID,
    after: { preset: DEFAULT_THEME.preset },
  });

  revalidateAppSettings();
  revalidatePath("/");
  revalidatePath("/admin/aparencia");
  return { success: true };
}
