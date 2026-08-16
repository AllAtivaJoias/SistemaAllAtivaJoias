"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Loader2, Printer, Receipt } from "lucide-react";

import {
  updateAppSettings,
  type SettingsActionState,
} from "@/app/admin/configuracoes/actions";
import { ImageUpload } from "@/components/admin/image-upload";
import { PrintPreviewDialog } from "@/components/print/print-preview-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  APP_SETTINGS_LIMITS,
  PRINT_FLAG_KEYS,
  PRINT_FLAG_LABELS,
  parseAppSettingsForm,
  toAppSettingsView,
  toPrintContext,
  type AppSettingsView,
  type PrintContext,
  type PrintFlags,
} from "@/lib/app-settings";
import { cn } from "@/lib/utils";

const PRICING_MODE_OPTIONS = [
  {
    value: "markupPercent",
    label: "Markup % (lucro sobre o custo)",
    hint: "Preço = custo × (1 + markup/100). Markup 100% dobra o custo.",
  },
  {
    value: "marginPercent",
    label: "Margem % (lucro sobre o preço)",
    hint: "Preço = custo / (1 − margem/100). Margem 50% não é o mesmo que markup 50%.",
  },
  {
    value: "fixedProfit",
    label: "Lucro fixo (R$)",
    hint: "Preço = custo + valor informado.",
  },
  {
    value: "finalPrice",
    label: "Preço final informado",
    hint: "O valor informado é o preço de venda; o sistema calcula a margem.",
  },
] as const;

export function SettingsForm({ settings }: { settings: AppSettingsView }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(updateAppSettings, {});
  const [showSuccess, setShowSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContext, setPreviewContext] = useState<PrintContext | null>(
    null
  );

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  function openPreview() {
    const form = formRef.current;
    if (!form) return;
    const parsed = parseAppSettingsForm(new FormData(form));
    const view = parsed.success
      ? toAppSettingsView(parsed.data, settings)
      : settings;
    setPreviewContext(toPrintContext(view));
    setPreviewOpen(true);
  }

  return (
    <>
      <PrintPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        context={previewContext}
      />

      <form ref={formRef} action={formAction} className="space-y-6">
        <Tabs defaultValue="geral">
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="empresa">Empresa</TabsTrigger>
            <TabsTrigger value="contatos">Contatos</TabsTrigger>
            <TabsTrigger value="impressao">Impressão</TabsTrigger>
            <TabsTrigger value="ficha">Ficha Técnica</TabsTrigger>
            <TabsTrigger value="producao">Produção</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="sistema">Sistema</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" forceMount className="space-y-6">
            <Section title="Identidade" description="Nome e marca usados em documentos, OS e vitrine.">
              <Field id="storeName" label="Nome da loja" required>
                <Input
                  id="storeName"
                  name="storeName"
                  defaultValue={settings.storeName}
                  maxLength={APP_SETTINGS_LIMITS.storeName}
                  required
                />
              </Field>
              <Field id="tradeName" label="Nome fantasia">
                <Input
                  id="tradeName"
                  name="tradeName"
                  defaultValue={settings.tradeName}
                  maxLength={APP_SETTINGS_LIMITS.tradeName}
                />
              </Field>
              <Field id="legalName" label="Razão social">
                <Input
                  id="legalName"
                  name="legalName"
                  defaultValue={settings.legalName}
                  maxLength={APP_SETTINGS_LIMITS.legalName}
                />
              </Field>
              <Field id="documentNumber" label="CNPJ / CPF">
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  defaultValue={settings.documentNumber}
                  maxLength={APP_SETTINGS_LIMITS.documentNumber}
                />
              </Field>
            </Section>

            <Section
              title="Identidade visual"
              description="Logos ficam em arquivo (upload), não no banco. A cor aparece na Ordem de Produção A4."
            >
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <ImageUpload name="logoUrl" defaultValue={settings.logoUrl} />
                </div>
                <div className="space-y-2">
                  <Label>Logo (fundo escuro)</Label>
                  <ImageUpload
                    name="logoDarkUrl"
                    defaultValue={settings.logoDarkUrl}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <ImageUpload
                    name="faviconUrl"
                    defaultValue={settings.faviconUrl}
                  />
                </div>
              </div>
              <Field id="primaryColor" label="Cor primária">
                <div className="flex items-center gap-3">
                  <input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue={settings.primaryColor || "#034742"}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-200 bg-white p-1"
                  />
                  <p className="text-xs text-slate-500">
                    Usada como destaque na OS A4. Não altera o tema do painel.
                  </p>
                </div>
              </Field>
            </Section>
          </TabsContent>

          <TabsContent value="empresa" forceMount className="space-y-6">
            <Section
              title="Endereço"
              description="Campos estruturados — usados no rodapé, recibo e ordem de produção."
            >
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-3">
                  <Field id="address" label="Logradouro">
                    <Input
                      id="address"
                      name="address"
                      defaultValue={settings.address}
                      maxLength={APP_SETTINGS_LIMITS.address}
                    />
                  </Field>
                </div>
                <Field id="addressNumber" label="Número">
                  <Input
                    id="addressNumber"
                    name="addressNumber"
                    defaultValue={settings.addressNumber}
                    maxLength={APP_SETTINGS_LIMITS.addressNumber}
                  />
                </Field>
              </div>
              <Field id="complement" label="Complemento">
                <Input
                  id="complement"
                  name="complement"
                  defaultValue={settings.complement}
                  maxLength={APP_SETTINGS_LIMITS.complement}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  <Field id="neighborhood" label="Bairro">
                    <Input
                      id="neighborhood"
                      name="neighborhood"
                      defaultValue={settings.neighborhood}
                      maxLength={APP_SETTINGS_LIMITS.neighborhood}
                    />
                  </Field>
                </div>
                <Field id="city" label="Cidade">
                  <Input
                    id="city"
                    name="city"
                    defaultValue={settings.city}
                    maxLength={APP_SETTINGS_LIMITS.city}
                  />
                </Field>
                <Field id="state" label="UF">
                  <Input
                    id="state"
                    name="state"
                    defaultValue={settings.state}
                    maxLength={APP_SETTINGS_LIMITS.state}
                    className="uppercase"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="postalCode" label="CEP">
                  <Input
                    id="postalCode"
                    name="postalCode"
                    defaultValue={settings.postalCode}
                    maxLength={APP_SETTINGS_LIMITS.postalCode}
                  />
                </Field>
                <Field id="country" label="País">
                  <Input
                    id="country"
                    name="country"
                    defaultValue={settings.country || "BR"}
                    maxLength={APP_SETTINGS_LIMITS.country}
                  />
                </Field>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="contatos" forceMount className="space-y-6">
            <Section
              title="Canais"
              description="Campos vazios não aparecem no rodapé público nem nos documentos."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="phone" label="Telefone">
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={settings.phone}
                    maxLength={APP_SETTINGS_LIMITS.phone}
                  />
                </Field>
                <Field id="whatsapp" label="WhatsApp">
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    defaultValue={settings.whatsapp}
                    maxLength={APP_SETTINGS_LIMITS.whatsapp}
                    placeholder="11936211188"
                  />
                </Field>
                <Field id="email" label="E-mail">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={settings.email}
                    maxLength={APP_SETTINGS_LIMITS.email}
                  />
                </Field>
                <Field id="instagram" label="Instagram">
                  <Input
                    id="instagram"
                    name="instagram"
                    defaultValue={settings.instagram}
                    maxLength={APP_SETTINGS_LIMITS.instagram}
                    placeholder="@loja ou URL"
                  />
                </Field>
                <Field id="website" label="Site">
                  <Input
                    id="website"
                    name="website"
                    defaultValue={settings.website}
                    maxLength={APP_SETTINGS_LIMITS.website}
                  />
                </Field>
                <Field id="businessHours" label="Horário de atendimento">
                  <Input
                    id="businessHours"
                    name="businessHours"
                    defaultValue={settings.businessHours}
                    maxLength={APP_SETTINGS_LIMITS.businessHours}
                  />
                </Field>
              </div>
            </Section>
          </TabsContent>

          <TabsContent value="impressao" forceMount className="space-y-6">
            <Section
              title="Formato padrão"
              description="O sistema imprime um documento por vez. Recibo 80 mm no caixa; A4 como Ordem de Produção na oficina."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormatCard
                  value="THERMAL_80MM"
                  defaultChecked={settings.defaultPrintFormat === "THERMAL_80MM"}
                  icon={<Receipt className="h-6 w-6" />}
                  title="Bobina 80 mm"
                  subtitle="Balcão / caixa — recibo compacto"
                />
                <FormatCard
                  value="A4"
                  defaultChecked={settings.defaultPrintFormat === "A4"}
                  icon={<FileText className="h-6 w-6" />}
                  title="A4"
                  subtitle="OS / produção — oficina e PDF"
                />
              </div>
            </Section>

            <Section
              title="Recibo térmico (balcão)"
              description="Desmarque Preços para uma via operacional. A via de materiais nunca mostra preço."
            >
              <FlagGrid prefix="thermal" defaults={settings.thermalProfile} />
            </Section>

            <Section
              title="Ordem de Produção A4"
              description="Impressão cega: deixe Preços desmarcado para a oficina não ver venda, margem ou desconto."
            >
              <FlagGrid prefix="a4" defaults={settings.a4Profile} />
            </Section>

            <Button type="button" variant="outline" onClick={openPreview}>
              <Printer className="h-4 w-4" />
              Visualizar impressão
            </Button>
          </TabsContent>

          <TabsContent value="ficha" forceMount className="space-y-6">
            <Section
              title="Estratégia de preço padrão"
              description="Usada só como valor inicial da Ficha Técnica em peças ainda sem estratégia salva. Markup e margem são fórmulas diferentes."
            >
              <Field id="pricingDefaultMode" label="Modo padrão">
                <select
                  id="pricingDefaultMode"
                  name="pricingDefaultMode"
                  defaultValue={settings.pricingDefaultMode}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {PRICING_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="pricingDefaultValue" label="Valor padrão">
                <Input
                  id="pricingDefaultValue"
                  name="pricingDefaultValue"
                  type="number"
                  min={0}
                  max={10000}
                  step="0.01"
                  defaultValue={settings.pricingDefaultValue}
                />
              </Field>
              <ul className="space-y-2 text-sm text-slate-600">
                {PRICING_MODE_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <span className="font-medium text-slate-800">
                      {option.label}:
                    </span>{" "}
                    {option.hint}
                  </li>
                ))}
              </ul>
            </Section>
          </TabsContent>

          <TabsContent value="producao" forceMount className="space-y-6">
            <Section
              title="Ordem de Produção"
              description="Essas opções alimentam o documento A4 agora. Job Bag, consumo real e QC virão no módulo de produção."
            >
              <Field
                id="productionDefaultDueDays"
                label="Prazo padrão (dias a partir do pedido)"
              >
                <Input
                  id="productionDefaultDueDays"
                  name="productionDefaultDueDays"
                  type="number"
                  min={0}
                  max={365}
                  defaultValue={settings.productionDefaultDueDays}
                />
              </Field>
              <CheckField
                name="productionShowProcessChecklist"
                defaultChecked={settings.productionShowProcessChecklist}
                label="Checklist de processos na OS (CAD → fundição → cravação → QC)"
              />
              <CheckField
                name="productionTrackLoss"
                defaultChecked={settings.productionTrackLoss}
                label="Tabela Planejado / Consumido / Diferença (consumido fica “—” até haver apontamento)"
              />
            </Section>
          </TabsContent>

          <TabsContent value="estoque" forceMount className="space-y-6">
            <Section
              title="Pesagem"
              description="Metais preciosos usam Decimal no banco. Este valor só formata gramas na impressão da BOM."
            >
              <Field id="weightDecimalPlaces" label="Casas decimais do peso (g)">
                <Input
                  id="weightDecimalPlaces"
                  name="weightDecimalPlaces"
                  type="number"
                  min={0}
                  max={4}
                  defaultValue={settings.weightDecimalPlaces}
                />
              </Field>
              <p className="text-sm text-slate-500">
                Controle por lote, certificado de pedra e localização de estoque
                entram no roadmap de metais e gemas — não há toggle ocioso aqui.
              </p>
            </Section>
          </TabsContent>

          <TabsContent value="sistema" forceMount className="space-y-6">
            <Section
              title="Operação"
              description="Este ERP é single-tenant. Textos da vitrine continuam em Aparência da Loja."
            >
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <InfoTerm label="Instância" value="Empresa única (sem tenantId)" />
                <InfoTerm label="Sessão" value="24 horas — logout limpa o estado" />
                <InfoTerm
                  label="Auditoria"
                  value="Alterações de formato, preço e produção vão para o Audit Log"
                />
                <InfoTerm
                  label="Aparência da vitrine"
                  value="Título, subtítulo e tagline: /admin/aparencia"
                />
              </dl>
            </Section>
          </TabsContent>
        </Tabs>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Salvar configurações
          </Button>
          {showSuccess && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Configurações salvas.
            </span>
          )}
        </div>
      </form>
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="max-w-3xl space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-serif text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      {children}
    </div>
  );
}

function CheckField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600"
      />
      <span>{label}</span>
    </label>
  );
}

function FlagGrid({
  prefix,
  defaults,
}: {
  prefix: string;
  defaults: PrintFlags;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PRINT_FLAG_KEYS.map((key) => (
        <CheckField
          key={`${prefix}.${key}`}
          name={`${prefix}.${key}`}
          defaultChecked={defaults[key]}
          label={PRINT_FLAG_LABELS[key]}
        />
      ))}
    </div>
  );
}

function FormatCard({
  value,
  defaultChecked,
  icon,
  title,
  subtitle,
}: {
  value: string;
  defaultChecked: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-4 transition-colors",
        "has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50"
      )}
    >
      <input
        type="radio"
        name="defaultPrintFormat"
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span className="text-brand-700">{icon}</span>
      <span>
        <span className="block font-medium text-slate-900">{title}</span>
        <span className="text-sm text-slate-500">{subtitle}</span>
      </span>
    </label>
  );
}

function InfoTerm({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}
