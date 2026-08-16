import { ReceiptThermal } from "@/components/print/receipt-thermal";
import {
  FALLBACK_APP_SETTINGS,
  toPrintContext,
} from "@/lib/app-settings";
import type { WorkOrderData } from "@/lib/receipt";

/** Compatibilidade: use `OrderPrintContainer` para o formato configurado. */
export function OrderAndRequisitionReceipt({
  data,
}: {
  data: WorkOrderData;
}) {
  const context = toPrintContext(FALLBACK_APP_SETTINGS);
  return (
    <ReceiptThermal
      data={data}
      company={context.company}
      profile={context.profile}
      weightDecimalPlaces={context.weightDecimalPlaces}
    />
  );
}
