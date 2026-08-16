import type { Metadata } from "next";
import { Gem } from "lucide-react";

import { getAppSettings } from "@/lib/app-settings-query";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings();
  return { title: `Login — ${settings.storeName}` };
}

export default async function LoginPage() {
  const settings = await getAppSettings();
  const name = settings.storeName.trim() || "AllAtiva Joias";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-md border border-border bg-card p-8 text-card-foreground shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent">
            {settings.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="" className="h-8 w-8 object-contain" />
            ) : (
              <Gem className="h-6 w-6 text-primary" />
            )}
          </div>
          <h1 className="font-serif text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            Painel de administração — acesso restrito
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
