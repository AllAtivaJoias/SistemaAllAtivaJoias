import { describe, expect, it } from "vitest";

import {
  appSettingsFormSchema,
  formatCompanyAddress,
  instagramHref,
  parseAppSettingsForm,
  toPrintContext,
  websiteHref,
  whatsappHref,
  FALLBACK_APP_SETTINGS,
} from "@/lib/app-settings";

describe("formatCompanyAddress", () => {
  it("omite partes vazias", () => {
    expect(
      formatCompanyAddress({
        ...FALLBACK_APP_SETTINGS,
        address: "Rua das Joias",
        addressNumber: "123",
        city: "São Paulo",
        state: "SP",
        complement: "",
        neighborhood: "",
        postalCode: "",
      })
    ).toBe("Rua das Joias, 123 · São Paulo — SP");
  });

  it("retorna null quando não há endereço", () => {
    expect(formatCompanyAddress(FALLBACK_APP_SETTINGS)).toBeNull();
  });
});

describe("contact hrefs", () => {
  it("monta WhatsApp com DDI 55", () => {
    expect(whatsappHref("11936211188")).toBe("https://wa.me/5511936211188");
    expect(whatsappHref("")).toBeNull();
  });

  it("aceita handle ou URL do Instagram", () => {
    expect(instagramHref("allativajoias")).toBe(
      "https://www.instagram.com/allativajoias/"
    );
    expect(instagramHref("@loja")).toBe("https://www.instagram.com/loja/");
    expect(instagramHref("https://instagram.com/x")).toBe(
      "https://instagram.com/x"
    );
  });

  it("normaliza website", () => {
    expect(websiteHref("www.allativa.com.br")).toBe(
      "https://www.allativa.com.br"
    );
  });
});

describe("toPrintContext", () => {
  it("A4 usa o perfil de oficina sem preços", () => {
    const ctx = toPrintContext({
      ...FALLBACK_APP_SETTINGS,
      defaultPrintFormat: "A4",
    });
    expect(ctx.format).toBe("A4");
    expect(ctx.profile.showPrices).toBe(false);
    expect(ctx.profile.showProductionData).toBe(true);
  });

  it("térmico usa o perfil de balcão com preços", () => {
    const ctx = toPrintContext(FALLBACK_APP_SETTINGS);
    expect(ctx.format).toBe("THERMAL_80MM");
    expect(ctx.profile.showPrices).toBe(true);
  });

  it("aceita override de formato para prévia", () => {
    const ctx = toPrintContext(FALLBACK_APP_SETTINGS, "A4");
    expect(ctx.format).toBe("A4");
    expect(ctx.profile.showPrices).toBe(false);
  });
});

describe("appSettingsFormSchema", () => {
  it("rejeita cor inválida e exige nome", () => {
    const parsed = appSettingsFormSchema.safeParse({
      ...FALLBACK_APP_SETTINGS,
      storeName: "",
      primaryColor: "green",
      thermalFlags: FALLBACK_APP_SETTINGS.thermalProfile,
      a4Flags: FALLBACK_APP_SETTINGS.a4Profile,
    });
    expect(parsed.success).toBe(false);
  });

  it("aceita payload válido", () => {
    const parsed = appSettingsFormSchema.safeParse({
      ...FALLBACK_APP_SETTINGS,
      thermalFlags: FALLBACK_APP_SETTINGS.thermalProfile,
      a4Flags: FALLBACK_APP_SETTINGS.a4Profile,
    });
    expect(parsed.success).toBe(true);
  });
});

describe("parseAppSettingsForm", () => {
  it("interpreta checkboxes ausentes como false", () => {
    const form = new FormData();
    form.set("storeName", "Joalheria Teste");
    form.set("primaryColor", "#034742");
    form.set("defaultPrintFormat", "A4");
    form.set("pricingDefaultMode", "marginPercent");
    form.set("pricingDefaultValue", "40");
    form.set("weightDecimalPlaces", "3");
    form.set("productionDefaultDueDays", "10");
    form.set("a4.showMaterials", "on");

    const parsed = parseAppSettingsForm(form);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.storeName).toBe("Joalheria Teste");
    expect(parsed.data.defaultPrintFormat).toBe("A4");
    expect(parsed.data.a4Flags.showMaterials).toBe(true);
    expect(parsed.data.a4Flags.showPrices).toBe(false);
    expect(parsed.data.productionShowProcessChecklist).toBe(false);
  });
});
