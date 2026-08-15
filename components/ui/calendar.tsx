"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Calendário (react-day-picker v10) com locale pt-BR e paleta jade da marca.
 * As cores usam as CSS custom properties do próprio react-day-picker.
 */
export function Calendar({ className, style, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays
      className={cn("p-3", className)}
      style={
        {
          "--rdp-accent-color": "#034742",
          "--rdp-accent-background-color": "#f0f7f6",
          "--rdp-range_middle-background-color": "#f0f7f6",
          "--rdp-range_middle-color": "#023a36",
          "--rdp-today-color": "#034742",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
