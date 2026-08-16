"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";

import { OrderPrintContainer } from "@/components/print/order-print-container";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PrintContext } from "@/lib/app-settings";
import { SAMPLE_WORK_ORDER } from "@/lib/print-sample";
import { canPrintOnCashierPc, handlePrint } from "@/lib/print";

export function PrintPreviewDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: PrintContext | null;
}) {
  const [printArmed, setPrintArmed] = useState(false);

  useEffect(() => {
    if (!printArmed || !context) return;

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        handlePrint();
      });
    });

    const onAfterPrint = () => setPrintArmed(false);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printArmed, context]);

  useEffect(() => {
    if (!open) setPrintArmed(false);
  }, [open]);

  if (!context) return null;

  const isA4 = context.format === "A4";

  return (
    <>
      {printArmed && (
        <OrderPrintContainer data={SAMPLE_WORK_ORDER} context={context} />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prévia de impressão</DialogTitle>
            <DialogDescription>
              {isA4
                ? "Ordem de Produção em A4 — oficina / PDF."
                : "Recibo térmico 80 mm — balcão / caixa."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="bg-slate-100">
            <div className="overflow-auto">
              <OrderPrintContainer
                data={SAMPLE_WORK_ORDER}
                context={context}
                preview
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => setPrintArmed(true)}
              disabled={!canPrintOnCashierPc()}
            >
              <Printer className="h-4 w-4" />
              Imprimir amostra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
