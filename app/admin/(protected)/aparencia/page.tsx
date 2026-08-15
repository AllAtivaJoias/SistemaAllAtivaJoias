import {
  getStoreSettingsRaw,
  STORE_DEFAULTS,
  STORE_TEXT_LIMITS,
} from "@/lib/store-settings";
import { AppearanceForm } from "./appearance-form";

export const dynamic = "force-dynamic";

export default async function AparenciaPage() {
  const settings = await getStoreSettingsRaw();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-800">
          Aparência da Loja
        </h1>
        <p className="mt-1 text-stone-500">
          Edite os textos exibidos na vitrine pública.
        </p>
      </div>

      <AppearanceForm
        defaultValues={settings}
        limits={STORE_TEXT_LIMITS}
        placeholders={STORE_DEFAULTS}
      />
    </div>
  );
}
