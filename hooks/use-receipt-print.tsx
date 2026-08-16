"use client";

import { useCallback, useEffect, useState } from "react";

import { OrderPrintContainer } from "@/components/print/order-print-container";
import { canPrintOnCashierPc, handlePrint } from "@/lib/print";
import {
  FALLBACK_APP_SETTINGS,
  toPrintContext,
  type PrintContext,
} from "@/lib/app-settings";
import type { WorkOrderData } from "@/lib/receipt";

export function useReceiptPrint(printContext?: PrintContext) {
  const context = printContext ?? toPrintContext(FALLBACK_APP_SETTINGS);
  const [receiptToPrint, setReceiptToPrint] = useState<WorkOrderData | null>(
    null
  );
  const [printMessage, setPrintMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!receiptToPrint || !canPrintOnCashierPc()) return;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handlePrint();
      });
    });

    const onAfterPrint = () => {
      setReceiptToPrint(null);
    };

    window.addEventListener("afterprint", onAfterPrint);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [receiptToPrint]);

  const printReceipt = useCallback((data: WorkOrderData) => {
    setPrintMessage(null);

    if (!canPrintOnCashierPc()) {
      setPrintMessage("Reimpressão disponível apenas no PC do caixa.");
      return;
    }

    setReceiptToPrint(data);
  }, []);

  const ReceiptLayer =
    receiptToPrint !== null ? (
      <OrderPrintContainer data={receiptToPrint} context={context} />
    ) : null;

  return {
    printReceipt,
    printMessage,
    clearPrintMessage: () => setPrintMessage(null),
    canPrint: canPrintOnCashierPc(),
    ReceiptLayer,
  };
}
