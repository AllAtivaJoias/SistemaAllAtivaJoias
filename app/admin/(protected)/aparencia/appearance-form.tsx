"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import {
  updateStoreSettings,
  type AppearanceActionState,
} from "@/app/admin/aparencia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface AppearanceFormValues {
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
}

interface AppearanceFormProps {
  defaultValues: AppearanceFormValues;
  limits: { heroTitle: number; heroSubtitle: number; footerText: number };
  placeholders: AppearanceFormValues;
}

export function AppearanceForm({
  defaultValues,
  limits,
  placeholders,
}: AppearanceFormProps) {
  const [state, formAction, isPending] = useActionState<
    AppearanceActionState,
    FormData
  >(updateStoreSettings, {});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="heroTitle">Título principal</Label>
        <Input
          id="heroTitle"
          name="heroTitle"
          defaultValue={defaultValues.heroTitle}
          placeholder={placeholders.heroTitle}
          maxLength={limits.heroTitle}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="heroSubtitle">Subtítulo</Label>
        <Textarea
          id="heroSubtitle"
          name="heroSubtitle"
          defaultValue={defaultValues.heroSubtitle}
          placeholder={placeholders.heroSubtitle}
          maxLength={limits.heroSubtitle}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="footerText">Texto do rodapé</Label>
        <Textarea
          id="footerText"
          name="footerText"
          defaultValue={defaultValues.footerText}
          placeholder={placeholders.footerText}
          maxLength={limits.footerText}
          rows={2}
        />
      </div>

      <p className="text-xs text-stone-500">
        Deixe um campo em branco para usar o texto padrão da loja.
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {showSuccess && (
        <p className="inline-flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" />
          Alterações salvas.
        </p>
      )}

      <div>
        <Button
          type="submit"
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  );
}
