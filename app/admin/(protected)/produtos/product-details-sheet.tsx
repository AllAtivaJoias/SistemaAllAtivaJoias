"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Coins,
  FileText,
  Gem,
  Link2,
  Package,
  Pencil,
  RefreshCw,
  Waves,
} from "lucide-react";
import type { Category } from "@prisma/client";

import { formatPrice } from "@/lib/format";
import {
  formatLengthCm,
  formatNumberPtBr,
  formatWeightG,
  type ChainSpecRow,
  type MetalSpecRow,
  type OtherSpecRow,
  type ProductSpec,
  type StoneSpecRow,
  type WireSpecRow,
} from "@/lib/product-spec";
import {
  getProductSpec,
  type ProductSpecResult,
} from "@/app/admin/produtos/product-spec-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProductFormSheet, type ProductFormModel } from "./product-form-sheet";

const PLACEHOLDER_IMAGE =
  "https://placehold.co/800x800/f5f5f4/78716c?text=Sem+imagem";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; spec: ProductSpec }
  | { status: "not_found" }
  | { status: "error" };

interface ProductDetailsSheetProps {
  product: ProductFormModel;
  categories: Category[];
  trigger: React.ReactNode;
}

export function ProductDetailsSheet({
  product,
  categories,
  trigger,
}: ProductDetailsSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const result: ProductSpecResult = await getProductSpec(product.id);
    if (result.status === "ok") setState({ status: "ready", spec: result.spec });
    else if (result.status === "not_found") setState({ status: "not_found" });
    else setState({ status: "error" });
  }, [product.id]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setState({ status: "loading" });
    getProductSpec(product.id).then((result) => {
      if (!active) return;
      if (result.status === "ok")
        setState({ status: "ready", spec: result.spec });
      else if (result.status === "not_found")
        setState({ status: "not_found" });
      else setState({ status: "error" });
    });
    return () => {
      active = false;
    };
  }, [open, product.id]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Ao fechar, sincroniza a listagem com eventuais edições feitas no painel.
    if (!next) router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader className="space-y-1 border-b border-stone-200 bg-stone-50/70 p-6 text-left">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="font-serif text-xl text-stone-800">
              Especificações da Peça
            </SheetTitle>
            {state.status === "ready" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={load}
                aria-label="Atualizar dados"
                className="text-stone-500"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
          <SheetDescription>
            Visão consolidada para conferência e auditoria da peça.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 p-6">
          {state.status === "loading" || state.status === "idle" ? (
            <SpecSkeleton />
          ) : state.status === "not_found" ? (
            <EmptyMessage
              icon={<Package className="h-8 w-8" />}
              title="Peça não encontrada"
              message="A peça pode ter sido removida ou não está disponível."
            />
          ) : state.status === "error" ? (
            <div className="space-y-4">
              <EmptyMessage
                icon={<AlertTriangle className="h-8 w-8 text-amber-500" />}
                title="Não foi possível carregar as especificações"
                message="Ocorreu um erro ao buscar os dados desta peça."
              />
              <div className="flex justify-center">
                <Button variant="outline" onClick={load}>
                  <RefreshCw className="h-4 w-4" />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : (
            <SpecContent
              spec={state.spec}
              product={product}
              categories={categories}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SpecContent({
  spec,
  product,
  categories,
}: {
  spec: ProductSpec;
  product: ProductFormModel;
  categories: Category[];
}) {
  return (
    <>
      <SpecHeader spec={spec} />
      <SummarySection spec={spec} />
      <MetalsSection data={spec.metals} />
      <StonesSection data={spec.stones} />
      <WiresSection data={spec.wires} />
      <ChainsSection data={spec.chains} />
      {spec.others.rows.length > 0 && <OthersSection data={spec.others} />}
      <CompositionSection spec={spec} />
      <DetailsActions spec={spec} product={product} categories={categories} />
    </>
  );
}

function SpecHeader({ spec }: { spec: ProductSpec }) {
  const [src, setSrc] = useState(spec.imageUrl || PLACEHOLDER_IMAGE);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
        <Image
          src={src}
          alt={spec.title}
          fill
          sizes="128px"
          className="object-cover"
          onError={() => setSrc(PLACEHOLDER_IMAGE)}
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 className="font-serif text-2xl font-semibold text-stone-800">
          {spec.title}
        </h2>
        <p className="font-mono text-xs text-stone-500">
          SKU: {spec.productCode ?? "—"}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{spec.categoryName ?? "Sem categoria"}</Badge>
          <StatusBadge isAvailable={spec.isAvailable} />
        </div>
        <p className="pt-1 text-2xl font-semibold text-brand-700">
          {formatPrice(spec.price)}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ isAvailable }: { isAvailable: boolean }) {
  if (isAvailable) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Disponível
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600">
      Indisponível
    </span>
  );
}

function SummarySection({ spec }: { spec: ProductSpec }) {
  return (
    <Section title="Resumo" icon={<ClipboardList className="h-4 w-4" />}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        <SummaryItem label="Itens na composição" value={String(spec.itemCount)} />
        <SummaryItem label="Preço de venda" value={formatPrice(spec.price)} />
        <SummaryItem
          label="Custo estimado"
          value={spec.costPrice > 0 ? formatPrice(spec.costPrice) : "—"}
        />
        <SummaryItem
          label="Margem"
          value={
            spec.marginPercent != null
              ? `${formatNumberPtBr(spec.marginPercent, 1)}%`
              : "—"
          }
        />
        <SummaryItem
          label="Peso total"
          value={spec.totalWeightG != null ? formatWeightG(spec.totalWeightG) : "—"}
        />
        <SummaryItem
          label="Custo dos insumos"
          value={spec.compositionCost > 0 ? formatPrice(spec.compositionCost) : "—"}
        />
      </dl>
    </Section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-stone-500">{label}</dt>
      <dd className="text-sm font-medium text-stone-800">{value}</dd>
    </div>
  );
}

function MetalsSection({ data }: { data: ProductSpec["metals"] }) {
  return (
    <Section title="Ouro / Metais" icon={<Coins className="h-4 w-4" />}>
      {data.rows.length === 0 ? (
        <EmptyHint>Nenhum metal utilizado nesta peça.</EmptyHint>
      ) : (
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd.</TableHead>
                  <TableHead className="text-right">Peso</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row: MetalSpecRow) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <span className="font-medium text-stone-800">
                        {row.material}
                      </span>
                      {(row.alloy || row.purityPercent != null) && (
                        <span className="block text-xs text-stone-500">
                          {[
                            row.alloy,
                            row.purityPercent != null
                              ? `Teor ${formatNumberPtBr(row.purityPercent, 1)}%`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumberPtBr(row.quantity)} {row.unit}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.weightG != null ? formatWeightG(row.weightG) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(row.totalCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TotalsRow
            left={`Total: ${formatWeightG(data.totalWeightG)}`}
            right={`Custo: ${formatPrice(data.totalCost)}`}
          />
        </div>
      )}
    </Section>
  );
}

function StonesSection({ data }: { data: ProductSpec["stones"] }) {
  return (
    <Section title="Pedras / Gemas" icon={<Gem className="h-4 w-4" />}>
      {data.rows.length === 0 ? (
        <EmptyHint>Nenhuma pedra utilizada nesta peça.</EmptyHint>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.rows.map((row: StoneSpecRow) => (
              <div
                key={row.key}
                className="rounded-md border border-stone-200 p-3"
              >
                <p className="font-medium text-stone-800">{row.material}</p>
                <dl className="mt-1.5 space-y-0.5 text-xs text-stone-600">
                  <SpecLine label="Cor" value={row.color ?? "—"} />
                  <SpecLine label="Lapidação" value={row.cut ?? "—"} />
                  <SpecLine label="Dimensão" value={row.dimension} />
                  <SpecLine
                    label="Quantidade"
                    value={`${formatNumberPtBr(row.quantity)}`}
                  />
                  <SpecLine label="Custo" value={formatPrice(row.totalCost)} />
                </dl>
              </div>
            ))}
          </div>
          <TotalsRow
            left={`Total de pedras: ${formatNumberPtBr(data.totalQuantity)}`}
            right={`Custo: ${formatPrice(data.totalCost)}`}
          />
        </div>
      )}
    </Section>
  );
}

function WiresSection({ data }: { data: ProductSpec["wires"] }) {
  return (
    <Section title="Fios" icon={<Waves className="h-4 w-4" />}>
      {data.rows.length === 0 ? (
        <EmptyHint>Nenhum fio utilizado nesta peça.</EmptyHint>
      ) : (
        <div className="space-y-3">
          {data.rows.map((row: WireSpecRow) => (
            <div key={row.key} className="rounded-md border border-stone-200 p-3">
              <p className="font-medium text-stone-800">{row.name}</p>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600">
                <SpecLine label="Liga" value={row.material ?? "—"} />
                <SpecLine label="Perfil" value={row.profile ?? "—"} />
                <SpecLine
                  label="Espessura"
                  value={
                    row.gaugeMm != null
                      ? `${formatNumberPtBr(row.gaugeMm)}mm`
                      : "—"
                  }
                />
                <SpecLine label="Peso" value={formatWeightG(row.weightG)} />
                <SpecLine label="Comprimento" value={formatLengthCm(row.lengthCm)} />
                <SpecLine label="Custo" value={formatPrice(row.totalCost)} />
              </dl>
            </div>
          ))}
          <TotalsRow right={`Custo: ${formatPrice(data.totalCost)}`} />
        </div>
      )}
    </Section>
  );
}

function ChainsSection({ data }: { data: ProductSpec["chains"] }) {
  return (
    <Section title="Correntes" icon={<Link2 className="h-4 w-4" />}>
      {data.rows.length === 0 ? (
        <EmptyHint>Nenhuma corrente utilizada nesta peça.</EmptyHint>
      ) : (
        <div className="space-y-3">
          {data.rows.map((row: ChainSpecRow) => (
            <div key={row.key} className="rounded-md border border-stone-200 p-3">
              <p className="font-medium text-stone-800">{row.name}</p>
              <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-stone-600">
                <SpecLine label="Malha" value={row.mesh ?? "—"} />
                <SpecLine
                  label="Espessura"
                  value={
                    row.thicknessMm != null
                      ? `${formatNumberPtBr(row.thicknessMm)}mm`
                      : "—"
                  }
                />
                <SpecLine label="Comprimento" value={formatLengthCm(row.lengthCm)} />
                <SpecLine label="Peso" value={formatWeightG(row.weightG)} />
                <SpecLine label="Custo" value={formatPrice(row.totalCost)} />
              </dl>
            </div>
          ))}
          <TotalsRow right={`Custo: ${formatPrice(data.totalCost)}`} />
        </div>
      )}
    </Section>
  );
}

function OthersSection({ data }: { data: ProductSpec["others"] }) {
  return (
    <Section title="Outros componentes" icon={<Package className="h-4 w-4" />}>
      <div className="space-y-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Componente</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row: OtherSpecRow) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium text-stone-800">
                    {row.name}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumberPtBr(row.quantity)} {row.unit}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TotalsRow right={`Custo: ${formatPrice(data.totalCost)}`} />
      </div>
    </Section>
  );
}

function CompositionSection({ spec }: { spec: ProductSpec }) {
  return (
    <Section
      title="Composição completa"
      icon={<FileText className="h-4 w-4" />}
    >
      {spec.composition.length === 0 ? (
        <EmptyHint>
          Esta peça ainda não possui ficha técnica cadastrada.
        </EmptyHint>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead>Dimensão</TableHead>
                <TableHead className="text-right">Custo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spec.composition.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium text-stone-800">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.categoryLabel}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.quantityLabel}
                  </TableCell>
                  <TableCell className="text-stone-600">
                    {row.detailLabel}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(row.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Section>
  );
}

function DetailsActions({
  spec,
  product,
  categories,
}: {
  spec: ProductSpec;
  product: ProductFormModel;
  categories: Category[];
}) {
  return (
    <div className="sticky bottom-0 -mx-6 flex flex-col gap-2 border-t border-stone-200 bg-white/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
      <ProductFormSheet
        product={product}
        categories={categories}
        trigger={
          <Button variant="outline" className="w-full sm:w-auto">
            <Pencil className="h-4 w-4" />
            Editar Dados Básicos
          </Button>
        }
      />
      <Button
        asChild
        className="w-full bg-brand-600 text-white hover:bg-brand-700 sm:w-auto"
      >
        <Link href={`/admin/ficha-tecnica?productId=${spec.id}`}>
          <FileText className="h-4 w-4" />
          Editar Ficha Técnica
        </Link>
      </Button>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
        <span className="text-brand-600">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function SpecLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-stone-700">{value}</dd>
    </div>
  );
}

function TotalsRow({ left, right }: { left?: string; right: string }) {
  return (
    <>
      <Separator />
      <div className="flex items-center justify-between text-sm font-semibold text-stone-800">
        <span>{left ?? ""}</span>
        <span>{right}</span>
      </div>
    </>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-4 text-center text-sm text-stone-500">
      {children}
    </p>
  );
}

function EmptyMessage({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="text-stone-400">{icon}</div>
      <p className="text-base font-medium text-stone-700">{title}</p>
      <p className="max-w-sm text-sm text-stone-500">{message}</p>
    </div>
  );
}

function SpecSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex gap-4">
        <div className="h-32 w-32 shrink-0 rounded-lg bg-stone-200" />
        <div className="flex-1 space-y-3 py-2">
          <div className="h-6 w-3/4 rounded bg-stone-200" />
          <div className="h-4 w-1/3 rounded bg-stone-200" />
          <div className="h-8 w-1/2 rounded bg-stone-200" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 rounded bg-stone-200" />
          <div className="h-20 w-full rounded bg-stone-100" />
        </div>
      ))}
    </div>
  );
}
