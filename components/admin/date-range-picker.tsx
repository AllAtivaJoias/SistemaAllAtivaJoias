"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  /** Datas iniciais validadas no servidor (formato YYYY-MM-DD). */
  from?: string;
  to?: string;
  basePath?: string;
}

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** YYYY-MM-DD a partir dos componentes locais (sem deslocamento de fuso). */
function toParam(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Constrói um Date em meia-noite local a partir de YYYY-MM-DD. */
function fromParam(value?: string): Date | undefined {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function formatLabel(range: DateRange | undefined): string {
  if (!range?.from) return "Selecionar período";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return dayFormatter.format(range.from);
  }
  return `${dayFormatter.format(range.from)} — ${dayFormatter.format(range.to)}`;
}

export function DateRangePicker({
  from,
  to,
  basePath = "/admin/pedidos/historico",
}: DateRangePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initialRange: DateRange | undefined = fromParam(from)
    ? { from: fromParam(from), to: fromParam(to) ?? fromParam(from) }
    : undefined;

  const [range, setRange] = useState<DateRange | undefined>(initialRange);

  function apply() {
    if (!range?.from) return;
    const params = new URLSearchParams();
    params.set("from", toParam(range.from));
    params.set("to", toParam(range.to ?? range.from));
    setOpen(false);
    router.push(`${basePath}?${params.toString()}`);
  }

  function clear() {
    setRange(undefined);
    setOpen(false);
    router.push(basePath);
  }

  const hasFilter = Boolean(from);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start gap-2 text-left font-normal",
              !initialRange && "text-stone-500"
            )}
            aria-label="Selecionar período do histórico"
          >
            <CalendarIcon className="h-4 w-4" />
            {formatLabel(range)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            defaultMonth={range?.from}
          />
          <div className="flex items-center justify-end gap-2 border-t border-stone-200 p-3">
            <Button variant="ghost" size="sm" onClick={clear}>
              Limpar
            </Button>
            <Button
              size="sm"
              className="bg-brand-600 text-white hover:bg-brand-700"
              onClick={apply}
              disabled={!range?.from}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-stone-500"
        >
          <X className="h-4 w-4" />
          Limpar filtro
        </Button>
      )}
    </div>
  );
}
