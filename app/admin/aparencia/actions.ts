"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { STORE_SETTINGS_ID, storeSettingsSchema } from "@/lib/store-settings";

export type AppearanceActionState = {
  error?: string;
  success?: boolean;
};

/**
 * Persiste os textos da vitrine (singleton). O upsert por ID fixo garante um
 * único registro mesmo sob concorrência, e revalida a landing page.
 */
export async function updateStoreSettings(
  _prevState: AppearanceActionState,
  formData: FormData
): Promise<AppearanceActionState> {
  const session = await requireAdmin();

  const parsed = storeSettingsSchema.safeParse({
    heroTitle: String(formData.get("heroTitle") ?? ""),
    heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
    footerText: String(formData.get("footerText") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await prisma.storeSettings.upsert({
      where: { id: STORE_SETTINGS_ID },
      update: parsed.data,
      create: { id: STORE_SETTINGS_ID, ...parsed.data },
    });
  } catch (error) {
    logger.error("store_settings.update_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível salvar as alterações." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "STORE_SETTINGS_UPDATE",
    entity: "StoreSettings",
    entityId: STORE_SETTINGS_ID,
    after: parsed.data,
  });

  revalidatePath("/");
  revalidatePath("/admin/aparencia");
  return { success: true };
}
