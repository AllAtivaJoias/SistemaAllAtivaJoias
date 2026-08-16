import {
  getStoreSettingsRaw,
  STORE_DEFAULTS,
  STORE_TEXT_LIMITS,
} from "@/lib/store-settings";
import { getAppSettings } from "@/lib/app-settings-query";
import { AppearanceStudio } from "./appearance-studio";

export const dynamic = "force-dynamic";

export default async function AparenciaPage() {
  const [vitrine, settings] = await Promise.all([
    getStoreSettingsRaw(),
    getAppSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          Aparência
        </h1>
        <p className="mt-1 text-muted-foreground">
          Identidade, tema white-label e textos da vitrine. Alterações só entram
          no ar ao salvar.
        </p>
      </div>

      <AppearanceStudio
        settings={settings}
        vitrine={vitrine}
        vitrineLimits={STORE_TEXT_LIMITS}
        vitrinePlaceholders={STORE_DEFAULTS}
      />
    </div>
  );
}
