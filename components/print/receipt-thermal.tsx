import type { ReactNode } from "react";

import { formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { formatOrderId } from "@/lib/order-period";
import type { WorkOrderData } from "@/lib/receipt";
import {
  formatCentimeters,
  formatGrams,
  formatStoneQty,
  type LengthRequisition,
  type MaterialRequisition,
} from "@/lib/material-requisition";
import {
  formatCompanyAddress,
  type CompanyIdentity,
  type PrintFlags,
} from "@/lib/app-settings";

export function ReceiptThermal({
  data,
  company,
  profile,
  weightDecimalPlaces = 2,
}: {
  data: WorkOrderData;
  company: CompanyIdentity;
  profile: PrintFlags;
  weightDecimalPlaces?: number;
}) {
  const createdAt = new Date(data.createdAt);
  const hasAdvance = (data.advancePayment ?? 0) > 0;
  const remaining = Math.max(0, data.totalAmount - (data.advancePayment ?? 0));
  const address = formatCompanyAddress(company);

  return (
    <div className="work-order-receipt-content box-border w-[72mm] bg-white px-[2.5mm] py-2 font-mono text-[10px] leading-tight text-black">
      {profile.showStoreHeader && (
        <>
          <p className="text-center text-[12px] font-bold uppercase tracking-wide">
            {company.storeName}
          </p>
          {address && (
            <p className="text-center text-[8px] leading-snug">{address}</p>
          )}
          {company.phone && (
            <p className="text-center text-[8px]">
              Tel.: {formatPhone(company.phone)}
            </p>
          )}
        </>
      )}
      <p className="mb-2 text-center text-[10px] font-semibold uppercase">
        Comprovante de Compra
      </p>

      <div className="my-2 border-t border-dashed border-black" />

      {profile.showOrderNumber && (
        <p>
          <span className="font-bold">Pedido Nº:</span> #
          {formatOrderId(data.orderId)}
        </p>
      )}
      {profile.showCustomerData && (
        <>
          <p>
            <span className="font-bold">Cliente:</span> {data.customerName}
          </p>
          {data.customerPhone && (
            <p>
              <span className="font-bold">WhatsApp:</span>{" "}
              {formatPhone(data.customerPhone)}
            </p>
          )}
        </>
      )}
      {profile.showSeller && data.sellerName && (
        <p>
          <span className="font-bold">Vendedor(a):</span> {data.sellerName}
        </p>
      )}
      {profile.showDate && (
        <p>
          <span className="font-bold">Data:</span> {formatDateTime(createdAt)}
        </p>
      )}

      <div className="my-2 border-t border-dashed border-black" />

      <p className="mb-1 font-bold uppercase">Peças</p>
      <ul className="space-y-1">
        {data.items.map((item, index) => (
          <li key={index} className="flex gap-2">
            <span className="shrink-0 font-bold">{item.quantity}x</span>
            <span className="min-w-0 flex-1 break-words">{item.title}</span>
            {profile.showPrices && (
              <span className="shrink-0">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            )}
          </li>
        ))}
      </ul>

      {profile.showTotals && profile.showPrices && (
        <>
          <div className="my-2 border-t border-dashed border-black" />
          {profile.showPayment && hasAdvance ? (
            <div className="space-y-0.5">
              <div className="flex justify-between gap-2">
                <span>Total da Compra:</span>
                <span className="shrink-0">{formatPrice(data.totalAmount)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Sinal Pago:</span>
                <span className="shrink-0">
                  - {formatPrice(data.advancePayment)}
                </span>
              </div>
              <div className="mt-1 flex justify-between gap-2 border-t border-black pt-1 text-[11px] font-bold">
                <span>FALTA PAGAR:</span>
                <span className="shrink-0">{formatPrice(remaining)}</span>
              </div>
            </div>
          ) : (
            <p className="text-right text-[11px] font-bold">
              TOTAL: {formatPrice(data.totalAmount)}
            </p>
          )}
        </>
      )}

      {profile.showNotes && (
        <>
          <div className="my-2 border-t border-dashed border-black" />
          <p className="text-center text-[10px]">Obrigado pela preferência!</p>
        </>
      )}

      {profile.showMaterials && (
        <>
          <div className="my-3 flex items-center gap-1 text-[9px] text-black">
            <span aria-hidden>✂</span>
            <span className="flex-1 border-t border-dashed border-black" />
            <span className="uppercase tracking-wide">corte aqui</span>
            <span className="flex-1 border-t border-dashed border-black" />
          </div>

          <p className="text-center text-[12px] font-bold uppercase tracking-wide">
            Requisição de Materiais
          </p>
          <p className="mb-2 text-center text-[9px] uppercase">
            Via do Joalheiro — Lista de Compra
          </p>

          {profile.showOrderNumber && (
            <p>
              <span className="font-bold">Pedido:</span> #
              {formatOrderId(data.orderId)}
            </p>
          )}
          {profile.showCustomerData && (
            <p>
              <span className="font-bold">Cliente:</span> {data.customerName}
            </p>
          )}
          {profile.showDate && (
            <p>
              <span className="font-bold">Data:</span> {formatDateTime(createdAt)}
            </p>
          )}

          <div className="my-2 border-t border-dashed border-black" />

          <p className="mb-1 font-bold uppercase">Peças a produzir</p>
          <ul className="mb-2 space-y-1">
            {data.items.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="shrink-0 font-bold">{item.quantity}x</span>
                <span className="min-w-0 flex-1 break-words">{item.title}</span>
              </li>
            ))}
          </ul>

          <RequisitionSections
            requisition={data.requisition}
            weightDecimalPlaces={weightDecimalPlaces}
          />

          <div className="my-2 border-t border-dashed border-black" />
          <p className="text-center text-[9px] uppercase">
            Conferir com o fornecedor antes de encomendar
          </p>
        </>
      )}
    </div>
  );
}

function RequisitionSections({
  requisition,
  weightDecimalPlaces,
}: {
  requisition: MaterialRequisition;
  weightDecimalPlaces: number;
}) {
  if (requisition.isEmpty) {
    return (
      <p className="border-t border-dashed border-black pt-2 text-center text-[9px]">
        Nenhum insumo na ficha técnica das peças.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {requisition.stones.length > 0 && (
        <Section title="Pedras">
          {requisition.stones.map((s) => (
            <Row key={s.key} left={formatStoneQty(s.quantity)} right={s.label} />
          ))}
        </Section>
      )}
      {requisition.metals.length > 0 && (
        <Section title="Metais">
          {requisition.metals.map((m) => (
            <Row
              key={m.key}
              left={formatGrams(m.grams, weightDecimalPlaces)}
              right={m.label}
            />
          ))}
        </Section>
      )}
      {requisition.chains.length > 0 && (
        <Section title="Correntes">
          {requisition.chains.map((c) => (
            <LengthRow
              key={c.key}
              line={c}
              weightDecimalPlaces={weightDecimalPlaces}
            />
          ))}
        </Section>
      )}
      {requisition.wires.length > 0 && (
        <Section title="Fios e Chapas">
          {requisition.wires.map((w) => (
            <LengthRow
              key={w.key}
              line={w}
              weightDecimalPlaces={weightDecimalPlaces}
            />
          ))}
        </Section>
      )}
      {requisition.others.length > 0 && (
        <Section title="Componentes">
          {requisition.others.map((o) => (
            <Row
              key={o.key}
              left={`${o.quantity} ${o.unit}`}
              right={o.label}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="border-t border-black pt-1 text-[10px] font-bold uppercase">
        -- {title} --
      </p>
      <ul className="mt-1 space-y-0.5">{children}</ul>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="w-[16mm] shrink-0 font-bold tabular-nums">{left}</span>
      <span className="min-w-0 flex-1 break-words text-right">{right}</span>
    </li>
  );
}

function LengthRow({
  line,
  weightDecimalPlaces,
}: {
  line: LengthRequisition;
  weightDecimalPlaces: number;
}) {
  const left = formatCentimeters(line.cm);
  const right =
    line.grams > 0
      ? `${line.label} (aprox. ${formatGrams(line.grams, weightDecimalPlaces)})`
      : line.label;
  return <Row left={left} right={right} />;
}
