import type { ReactNode } from "react";

import { formatDate, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { formatOrderId } from "@/lib/order-period";
import type { WorkOrderData } from "@/lib/receipt";
import {
  formatCentimeters,
  formatGrams,
  formatStoneQty,
} from "@/lib/material-requisition";
import {
  DEFAULT_PRODUCTION_STEPS,
  formatCompanyAddress,
  type PrintContext,
} from "@/lib/app-settings";

export function ProductionOrderA4({
  data,
  context,
}: {
  data: WorkOrderData;
  context: PrintContext;
}) {
  const { company, profile } = context;
  const createdAt = new Date(data.createdAt);
  const due = new Date(createdAt);
  due.setDate(due.getDate() + context.productionDefaultDueDays);
  const accent = company.primaryColor || "#034742";
  const address = formatCompanyAddress(company);
  const remaining = Math.max(0, data.totalAmount - (data.advancePayment ?? 0));

  return (
    <div className="print-a4-sheet bg-white text-slate-900">
      {profile.showStoreHeader && (
        <header
          className="flex items-start justify-between gap-4 border-b-2 pb-3"
          style={{ borderColor: accent }}
        >
          <div className="min-w-0">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- impressão precisa da URL original
              <img
                src={company.logoUrl}
                alt={company.storeName}
                className="mb-2 h-12 w-auto object-contain"
              />
            ) : null}
            <p className="font-serif text-2xl font-semibold" style={{ color: accent }}>
              {company.storeName}
            </p>
            {company.legalName && (
              <p className="text-xs text-slate-500">{company.legalName}</p>
            )}
            {address && <p className="mt-1 text-xs text-slate-600">{address}</p>}
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-600">
              {company.phone && <span>Tel. {formatPhone(company.phone)}</span>}
              {company.email && <span>{company.email}</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Ordem de Produção
            </p>
            {profile.showOrderNumber && (
              <p className="font-serif text-xl font-semibold">
                #{formatOrderId(data.orderId)}
              </p>
            )}
          </div>
        </header>
      )}

      <section className="mt-4 grid grid-cols-2 gap-3 text-sm">
        {profile.showCustomerData && (
          <InfoBlock title="Cliente">
            <p className="font-medium">{data.customerName}</p>
            {data.customerPhone && <p>{formatPhone(data.customerPhone)}</p>}
          </InfoBlock>
        )}
        <InfoBlock title="Pedido">
          {profile.showDate && <p>Emissão: {formatDateTime(createdAt)}</p>}
          {profile.showProductionData && (
            <p>Prazo: {formatDate(due)}</p>
          )}
          {profile.showSeller && data.sellerName && (
            <p>Vendedor(a): {data.sellerName}</p>
          )}
        </InfoBlock>
      </section>

      <section className="mt-4">
        <SectionTitle accent={accent}>Peças</SectionTitle>
        <table className="mt-1 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-1.5">Qtd</th>
              <th className="py-1.5">Modelo</th>
              {profile.showPrices && <th className="py-1.5 text-right">Valor</th>}
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-slate-100">
                <td className="py-1.5 tabular-nums">{item.quantity}×</td>
                <td className="py-1.5">{item.title}</td>
                {profile.showPrices && (
                  <td className="py-1.5 text-right tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {profile.showMaterials && (
        <section className="mt-4">
          <SectionTitle accent={accent}>Materiais (BOM)</SectionTitle>
          <MaterialsTable
            data={data}
            trackLoss={context.productionTrackLoss}
            digits={context.weightDecimalPlaces}
          />
        </section>
      )}

      {profile.showProductionData && context.productionShowProcessChecklist && (
        <section className="mt-4">
          <SectionTitle accent={accent}>Processos</SectionTitle>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {DEFAULT_PRODUCTION_STEPS.map((step) => (
              <label key={step} className="flex items-center gap-2">
                <span className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-400" />
                {step}
              </label>
            ))}
          </div>
        </section>
      )}

      {profile.showNotes && (
        <section className="mt-4">
          <SectionTitle accent={accent}>Observações</SectionTitle>
          <div className="mt-1 min-h-[48px] rounded border border-dashed border-slate-300 p-2 text-xs text-slate-400">
            Anotações da oficina
          </div>
        </section>
      )}

      {profile.showPrices && profile.showTotals && (
        <section className="mt-4 text-sm">
          <div className="ml-auto w-56 space-y-1">
            <Row label="Total" value={formatPrice(data.totalAmount)} />
            {profile.showPayment && data.advancePayment > 0 && (
              <>
                <Row label="Sinal" value={formatPrice(data.advancePayment)} />
                <Row label="Saldo" value={formatPrice(remaining)} bold />
              </>
            )}
          </div>
        </section>
      )}

      {profile.showProductionData && (
        <section className="mt-8 grid grid-cols-3 gap-6 text-center text-xs">
          <SignLine label="Responsável" />
          <SignLine label="Data" />
          <SignLine label="Conferência / QC" />
        </section>
      )}
    </div>
  );
}

function SectionTitle({
  children,
  accent,
}: {
  children: ReactNode;
  accent: string;
}) {
  return (
    <h3
      className="border-b pb-1 text-xs font-semibold uppercase tracking-wide"
      style={{ borderColor: accent, color: accent }}
    >
      {children}
    </h3>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded border border-slate-200 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <div className="mt-1 space-y-0.5">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div>
      <div className="mb-1 h-8 border-b border-slate-400" />
      <p className="uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}

function MaterialsTable({
  data,
  trackLoss,
  digits,
}: {
  data: WorkOrderData;
  trackLoss: boolean;
  digits: number;
}) {
  const req = data.requisition;
  if (req.isEmpty) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        Nenhum insumo na ficha técnica das peças.
      </p>
    );
  }

  const rows: { group: string; qty: string; label: string }[] = [
    ...req.stones.map((s) => ({
      group: "Pedra",
      qty: formatStoneQty(s.quantity),
      label: s.label,
    })),
    ...req.metals.map((m) => ({
      group: "Metal",
      qty: formatGrams(m.grams, digits),
      label: m.label,
    })),
    ...req.chains.map((c) => ({
      group: "Corrente",
      qty: formatCentimeters(c.cm),
      label: c.label,
    })),
    ...req.wires.map((w) => ({
      group: "Fio/Chapa",
      qty: formatCentimeters(w.cm),
      label: w.label,
    })),
    ...req.others.map((o) => ({
      group: "Componente",
      qty: `${o.quantity} ${o.unit}`,
      label: o.label,
    })),
  ];

  return (
    <table className="mt-1 w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="py-1.5">Tipo</th>
          <th className="py-1.5">Material</th>
          <th className="py-1.5 text-right">Planejado</th>
          {trackLoss && (
            <>
              <th className="py-1.5 text-right">Consumido</th>
              <th className="py-1.5 text-right">Diferença</th>
            </>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.group}-${row.label}-${index}`} className="border-b border-slate-100">
            <td className="py-1.5 text-slate-500">{row.group}</td>
            <td className="py-1.5">{row.label}</td>
            <td className="py-1.5 text-right tabular-nums">{row.qty}</td>
            {trackLoss && (
              <>
                <td className="py-1.5 text-right text-slate-400">—</td>
                <td className="py-1.5 text-right text-slate-400">—</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
