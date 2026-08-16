import { getAppSettings } from "@/lib/app-settings-query";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const settings = await getAppSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-stone-800">
          Configurações
        </h1>
        <p className="mt-1 text-stone-500">
          Identidade da joalheria, impressão operacional e padrões da ficha
          técnica — uma fonte para vendas, oficina e vitrine.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
