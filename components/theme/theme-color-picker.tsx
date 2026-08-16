"use client";

import { Copy, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  contrastRatio,
  hexToHsl,
  hexToRgb,
  hslToHex,
  parseColorInput,
  rgbToHex,
  wcagLevel,
} from "@/lib/theme/color";
import { cn } from "@/lib/utils";

export function ThemeColorPicker({
  label,
  hint,
  value,
  pairValue,
  pairLabel,
  onChange,
  onReset,
}: {
  label: string;
  hint?: string;
  value: string;
  pairValue?: string;
  pairLabel?: string;
  onChange: (hex: string) => void;
  onReset?: () => void;
}) {
  const [mode, setMode] = useState<"hex" | "rgb" | "hsl">("hex");
  const rgb = hexToRgb(value);
  const hsl = hexToHsl(value);
  const ratio = pairValue ? contrastRatio(value, pairValue) : null;
  const level = ratio ? wcagLevel(ratio) : null;

  const rgbText = useMemo(() => {
    if (!rgb) return "";
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  }, [rgb]);

  const hslText = useMemo(() => {
    if (!hsl) return "";
    return `${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%`;
  }, [hsl]);

  function applyRaw(raw: string) {
    const hex = parseColorInput(raw);
    if (hex) onChange(hex);
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{label}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            title="Copiar HEX"
            onClick={() => void navigator.clipboard.writeText(value)}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          {onReset ? (
            <button
              type="button"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              title="Resetar"
              onClick={onReset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(event) => applyRaw(event.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-0.5"
          aria-label={label}
        />
        <div className="min-w-0 flex-1">
          <Label className="sr-only" htmlFor={`color-${label}`}>
            {label}
          </Label>
          {mode === "hex" && (
            <Input
              id={`color-${label}`}
              value={value}
              onChange={(event) => applyRaw(event.target.value)}
              className="font-mono uppercase"
            />
          )}
          {mode === "rgb" && rgb && (
            <div className="grid grid-cols-3 gap-1">
              {(["r", "g", "b"] as const).map((channel) => (
                <Input
                  key={channel}
                  type="number"
                  min={0}
                  max={255}
                  value={rgb[channel]}
                  onChange={(event) =>
                    onChange(
                      rgbToHex({ ...rgb, [channel]: Number(event.target.value) })
                    )
                  }
                />
              ))}
            </div>
          )}
          {mode === "hsl" && hsl && (
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                value={Math.round(hsl.h)}
                onChange={(event) =>
                  onChange(hslToHex({ ...hsl, h: Number(event.target.value) }))
                }
              />
              <Input
                type="number"
                value={Math.round(hsl.s)}
                onChange={(event) =>
                  onChange(hslToHex({ ...hsl, s: Number(event.target.value) }))
                }
              />
              <Input
                type="number"
                value={Math.round(hsl.l)}
                onChange={(event) =>
                  onChange(hslToHex({ ...hsl, l: Number(event.target.value) }))
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        {(["hex", "rgb", "hsl"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={cn(
              "rounded px-1.5 py-0.5 uppercase",
              mode === item && "bg-accent text-accent-foreground"
            )}
          >
            {item}
          </button>
        ))}
        <span className="font-mono">
          {mode === "rgb" ? rgbText : mode === "hsl" ? hslText : value}
        </span>
      </div>

      {ratio !== null && level && pairLabel && (
        <p
          className={cn(
            "text-xs",
            level === "fail" ? "text-destructive" : "text-success"
          )}
        >
          Contraste com {pairLabel}: {ratio.toFixed(1)}:1 · WCAG {level === "fail" ? "✗" : `✓ ${level}`}
        </p>
      )}
    </div>
  );
}
