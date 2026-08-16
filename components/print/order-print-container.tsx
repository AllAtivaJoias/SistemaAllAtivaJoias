import { ReceiptThermal } from "@/components/print/receipt-thermal";
import { ProductionOrderA4 } from "@/components/print/production-order-a4";
import type { PrintContext } from "@/lib/app-settings";
import type { WorkOrderData } from "@/lib/receipt";
import { cn } from "@/lib/utils";

export function OrderPrintContainer({
  data,
  context,
  preview = false,
}: {
  data: WorkOrderData;
  context: PrintContext;
  preview?: boolean;
}) {
  const isA4 = context.format === "A4";

  return (
    <div
      className={cn(
        preview
          ? isA4
            ? "print-preview-surface print-preview-a4"
            : "print-preview-surface print-preview-thermal"
          : isA4
            ? "print-root print-document-a4"
            : "print-root print-document-thermal"
      )}
      aria-hidden={preview ? undefined : true}
    >
      {isA4 ? (
        <ProductionOrderA4 data={data} context={context} />
      ) : (
        <ReceiptThermal
          data={data}
          company={context.company}
          profile={context.profile}
          weightDecimalPlaces={context.weightDecimalPlaces}
        />
      )}
    </div>
  );
}
