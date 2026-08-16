"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Redo2,
  RotateCcw,
  Undo2,
} from "lucide-react";

import {
  publishAppearance,
  resetAppearanceTheme,
  type ThemeActionState,
} from "@/app/admin/aparencia/theme-actions";
import { AppearanceForm, type AppearanceFormValues } from "./appearance-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { ThemeColorPicker } from "@/components/theme/theme-color-picker";
import { ThemePreview } from "@/components/theme/theme-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { AppSettingsView } from "@/lib/app-settings";
import { contrastRatio, wcagLevel } from "@/lib/theme/color";
import { THEME_PRESETS } from "@/lib/theme/presets";
import {
  COLOR_TOKEN_KEYS,
  CONTRAST_PAIRS,
  CORE_TOKEN_KEYS,
  DEFAULT_THEME,
  DENSITIES,
  FONT_OPTIONS,
  RADIUS_PRESETS,
  THEME_MODES,
  TOKEN_LABELS,
  deriveDarkFromPrimary,
  deriveLightFromPrimary,
  type ColorTokenKey,
  type ThemeConfig,
  type ThemeTokens,
} from "@/lib/theme/tokens";
import { cloneTheme } from "@/lib/theme/schema";
import { cn } from "@/lib/utils";

type Identity = {
  storeName: string;
  brandTagline: string;
  logoUrl: string;
  logoDarkUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
  website: string;
  instagram: string;
  facebookUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
};

type Draft = { identity: Identity; theme: ThemeConfig };

function identityFrom(settings: AppSettingsView): Identity {
  return {
    storeName: settings.storeName,
    brandTagline: settings.brandTagline,
    logoUrl: settings.logoUrl,
    logoDarkUrl: settings.logoDarkUrl,
    faviconUrl: settings.faviconUrl,
    ogImageUrl: settings.ogImageUrl,
    website: settings.website,
    instagram: settings.instagram,
    facebookUrl: settings.facebookUrl,
    youtubeUrl: settings.youtubeUrl,
    tiktokUrl: settings.tiktokUrl,
  };
}

export function AppearanceStudio({
  settings,
  vitrine,
  vitrineLimits,
  vitrinePlaceholders,
}: {
  settings: AppSettingsView;
  vitrine: AppearanceFormValues;
  vitrineLimits: { heroTitle: number; heroSubtitle: number; footerText: number };
  vitrinePlaceholders: AppearanceFormValues;
}) {
  const [draft, setDraft] = useState<Draft>({
    identity: identityFrom(settings),
    theme: cloneTheme(settings.theme),
  });
  const [past, setPast] = useState<Draft[]>([]);
  const [future, setFuture] = useState<Draft[]>([]);
  const [scheme, setScheme] = useState<"light" | "dark">("light");
  const [presetPending, setPresetPending] = useState<string | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<ThemeActionState, FormData>(
    publishAppearance,
    {}
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({ identity: identityFrom(settings), theme: settings.theme })
  );
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    if (!state?.success) return;
    setShowSuccess(true);
    setSavedSnapshot(JSON.stringify(draftRef.current));
    const timer = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [state]);

  const dirty = JSON.stringify(draft) !== savedSnapshot;

  useEffect(() => {
    if (!dirty) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const commit = useCallback(
    (next: Draft) => {
      setPast((prev) => [...prev.slice(-19), draft]);
      setFuture([]);
      setDraft(next);
    },
    [draft]
  );

  const tokens = scheme === "dark" ? draft.theme.dark : draft.theme.light;

  function patchIdentity(patch: Partial<Identity>) {
    commit({ ...draft, identity: { ...draft.identity, ...patch } });
  }

  function patchTheme(patch: Partial<ThemeConfig>) {
    commit({ ...draft, theme: { ...draft.theme, ...patch } });
  }

  function setToken(key: ColorTokenKey, hex: string) {
    const map: ThemeTokens = { ...tokens, [key]: hex };
    patchTheme({
      preset: "custom",
      light: scheme === "light" ? map : draft.theme.light,
      dark: scheme === "dark" ? map : draft.theme.dark,
    });
  }

  function undo() {
    const prev = past.at(-1);
    if (!prev) return;
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [draft, ...items]);
    setDraft(prev);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setFuture((items) => items.slice(1));
    setPast((items) => [...items, draft]);
    setDraft(next);
  }

  const issues = useMemo(() => {
    return CONTRAST_PAIRS.flatMap(([fg, bg]) => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      if (!ratio || wcagLevel(ratio) !== "fail") return [];
      return [
        `${TOKEN_LABELS[fg].label} sobre ${TOKEN_LABELS[bg].label}: ${ratio.toFixed(1)}:1`,
      ];
    });
  }, [tokens]);

  const payload = { ...draft.identity, theme: draft.theme };
  const tokenKeys = showAllTokens ? COLOR_TOKEN_KEYS : CORE_TOKEN_KEYS;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 py-3 backdrop-blur">
        <form action={formAction}>
          <input type="hidden" name="payload" value={JSON.stringify(payload)} />
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </form>
        <Button type="button" variant="outline" asChild>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            Visualizar
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={undo} disabled={past.length === 0}>
          <Undo2 className="h-4 w-4" />
          Desfazer
        </Button>
        <Button type="button" variant="outline" onClick={redo} disabled={future.length === 0}>
          <Redo2 className="h-4 w-4" />
          Refazer
        </Button>
        <Button type="button" variant="ghost" onClick={() => setResetOpen(true)}>
          <RotateCcw className="h-4 w-4" />
          Restaurar padrão
        </Button>
        {dirty && !isPending && (
          <span className="text-sm text-warning">Alterações não salvas</span>
        )}
        {showSuccess && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Salvo agora
          </span>
        )}
        {state?.error && <span className="text-sm text-destructive">{state.error}</span>}
      </div>

      {resetOpen && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <p>Restaurar o tema jade padrão? Identidade (nome/logo) não será apagada.</p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={async () => {
                await resetAppearanceTheme();
                setDraft({
                  identity: draft.identity,
                  theme: cloneTheme(DEFAULT_THEME),
                });
                setResetOpen(false);
              }}
            >
              Confirmar
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          <p className="font-medium">Contraste abaixo do WCAG AA</p>
          <ul className="mt-1 list-disc pl-4">
            {issues.slice(0, 6).map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <Tabs defaultValue="identidade">
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="identidade">Identidade</TabsTrigger>
          <TabsTrigger value="tema">Tema</TabsTrigger>
          <TabsTrigger value="vitrine">Vitrine</TabsTrigger>
        </TabsList>

        <TabsContent value="identidade" className="space-y-4">
          <section className="grid max-w-3xl gap-4 rounded-lg border border-border bg-card p-5">
            <Field label="Nome da marca">
              <Input
                value={draft.identity.storeName}
                onChange={(event) => patchIdentity({ storeName: event.target.value })}
                maxLength={80}
              />
            </Field>
            <Field label="Tagline / descrição">
              <Input
                value={draft.identity.brandTagline}
                onChange={(event) => patchIdentity({ brandTagline: event.target.value })}
                maxLength={280}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label>Logo</Label>
                <ImageUpload
                  name="logoUrlPreview"
                  defaultValue={draft.identity.logoUrl}
                  onChange={(url) => patchIdentity({ logoUrl: url })}
                />
              </div>
              <div>
                <Label>Logo escuro</Label>
                <ImageUpload
                  name="logoDarkUrlPreview"
                  defaultValue={draft.identity.logoDarkUrl}
                  onChange={(url) => patchIdentity({ logoDarkUrl: url })}
                />
              </div>
              <div>
                <Label>Favicon</Label>
                <ImageUpload
                  name="faviconUrlPreview"
                  defaultValue={draft.identity.faviconUrl}
                  onChange={(url) => patchIdentity({ faviconUrl: url })}
                />
              </div>
            </div>
            <Field label="Imagem Open Graph">
              <ImageUpload
                name="ogImageUrlPreview"
                defaultValue={draft.identity.ogImageUrl}
                onChange={(url) => patchIdentity({ ogImageUrl: url })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Site">
                <Input
                  value={draft.identity.website}
                  onChange={(event) => patchIdentity({ website: event.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <Input
                  value={draft.identity.instagram}
                  onChange={(event) => patchIdentity({ instagram: event.target.value })}
                />
              </Field>
              <Field label="Facebook">
                <Input
                  value={draft.identity.facebookUrl}
                  onChange={(event) => patchIdentity({ facebookUrl: event.target.value })}
                />
              </Field>
              <Field label="YouTube">
                <Input
                  value={draft.identity.youtubeUrl}
                  onChange={(event) => patchIdentity({ youtubeUrl: event.target.value })}
                />
              </Field>
              <Field label="TikTok">
                <Input
                  value={draft.identity.tiktokUrl}
                  onChange={(event) => patchIdentity({ tiktokUrl: event.target.value })}
                />
              </Field>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="tema">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="space-y-6">
              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <h2 className="font-serif text-lg font-semibold">Presets</h2>
                <p className="text-sm text-muted-foreground">
                  O preset só entra no rascunho depois de confirmar. Nada é publicado sozinho.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPresetPending(preset.id)}
                      className={cn(
                        "rounded-md border border-border p-3 text-left text-sm hover:bg-accent",
                        draft.theme.preset === preset.id && "border-primary"
                      )}
                    >
                      <span
                        className="mb-2 block h-6 w-full rounded"
                        style={{ background: preset.primary }}
                      />
                      <span className="font-medium">{preset.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
                {presetPending && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    Aplicar “
                    {THEME_PRESETS.find((item) => item.id === presetPending)?.name}” ao rascunho?
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const preset = THEME_PRESETS.find((item) => item.id === presetPending);
                          if (preset) {
                            commit({
                              ...draft,
                              theme: {
                                ...preset.theme,
                                mode: draft.theme.mode,
                                allowUserToggle: draft.theme.allowUserToggle,
                                density: draft.theme.density,
                                fontBody: draft.theme.fontBody,
                                fontHeading: draft.theme.fontHeading,
                              },
                            });
                          }
                          setPresetPending(null);
                        }}
                      >
                        Aplicar no rascunho
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setPresetPending(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-serif text-lg font-semibold">Cores</h2>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={scheme === "light" ? "default" : "outline"}
                      onClick={() => setScheme("light")}
                    >
                      Claro
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={scheme === "dark" ? "default" : "outline"}
                      onClick={() => setScheme("dark")}
                    >
                      Escuro
                    </Button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const primary = tokens.primary;
                    patchTheme({
                      light:
                        scheme === "light"
                          ? deriveLightFromPrimary(primary)
                          : draft.theme.light,
                      dark:
                        scheme === "dark"
                          ? deriveDarkFromPrimary(primary)
                          : deriveDarkFromPrimary(draft.theme.light.primary),
                    });
                  }}
                >
                  Gerar paleta a partir da primária
                </Button>
                <div className="grid gap-3 md:grid-cols-2">
                  {tokenKeys.map((key) => {
                    const pair = CONTRAST_PAIRS.find(([fg, bg]) => fg === key || bg === key);
                    const against =
                      pair && pair[1] === key
                        ? tokens[pair[0]]
                        : pair && pair[0] === key
                          ? tokens[pair[1]]
                          : undefined;
                    return (
                      <ThemeColorPicker
                        key={key}
                        label={TOKEN_LABELS[key].label}
                        hint={TOKEN_LABELS[key].hint}
                        value={tokens[key]}
                        pairValue={against}
                        pairLabel={
                          pair
                            ? TOKEN_LABELS[pair[0] === key ? pair[1] : pair[0]].label
                            : undefined
                        }
                        onChange={(hex) => setToken(key, hex)}
                        onReset={() =>
                          setToken(
                            key,
                            (scheme === "dark" ? DEFAULT_THEME.dark : DEFAULT_THEME.light)[key]
                          )
                        }
                      />
                    );
                  })}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTokens((value) => !value)}
                >
                  {showAllTokens ? "Mostrar só o essencial" : "Mostrar todos os tokens"}
                </Button>
              </section>

              <section className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
                <Field label="Tipografia do corpo">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.theme.fontBody}
                    onChange={(event) =>
                      patchTheme({ fontBody: event.target.value as ThemeConfig["fontBody"] })
                    }
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipografia dos títulos">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.theme.fontHeading}
                    onChange={(event) =>
                      patchTheme({
                        fontHeading: event.target.value as ThemeConfig["fontHeading"],
                      })
                    }
                  >
                    {FONT_OPTIONS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Raio">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.theme.radius}
                    onChange={(event) => patchTheme({ radius: event.target.value })}
                  >
                    {RADIUS_PRESETS.map((item) => (
                      <option key={item.id} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Densidade">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.theme.density}
                    onChange={(event) =>
                      patchTheme({ density: event.target.value as ThemeConfig["density"] })
                    }
                  >
                    {DENSITIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Modo padrão">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.theme.mode}
                    onChange={(event) =>
                      patchTheme({ mode: event.target.value as ThemeConfig["mode"] })
                    }
                  >
                    {THEME_MODES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.theme.allowUserToggle}
                    onChange={(event) =>
                      patchTheme({ allowUserToggle: event.target.checked })
                    }
                  />
                  Permitir que o usuário alterne claro/escuro
                </label>
              </section>
            </div>

            <div className="xl:sticky xl:top-24">
              <h2 className="mb-2 font-serif text-lg font-semibold">Prévia ao vivo</h2>
              <ThemePreview
                theme={draft.theme}
                tokens={tokens}
                storeName={draft.identity.storeName}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="vitrine">
          <AppearanceForm
            defaultValues={vitrine}
            limits={vitrineLimits}
            placeholders={vitrinePlaceholders}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
