import type { Metadata } from "next";
import { Gem } from "lucide-react";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login — Painel AllAtiva Joias",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-md border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-100">
            <Gem className="h-6 w-6 text-brand-600" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900">
            AllAtiva Joias
          </h1>
          <p className="text-sm text-slate-500">
            Painel de administração — acesso restrito
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
