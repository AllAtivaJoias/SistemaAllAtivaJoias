"use client";

import { useEffect, useState, useTransition } from "react";
import { Star } from "lucide-react";

import { toggleProductFeatured } from "@/app/admin/produtos/actions";
import { cn } from "@/lib/utils";

interface FeaturedToggleProps {
  productId: string;
  isFeatured: boolean;
  /** Produtos sem categoria não podem ser destacados na vitrine. */
  disabled?: boolean;
}

export function FeaturedToggle({
  productId,
  isFeatured,
  disabled = false,
}: FeaturedToggleProps) {
  const [featured, setFeatured] = useState(isFeatured);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reflete atualizações vindas do servidor (revalidação).
  useEffect(() => {
    setFeatured(isFeatured);
  }, [isFeatured]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  function handleClick() {
    if (disabled || isPending) return;
    setError(null);
    const next = !featured;
    setFeatured(next); // otimista

    startTransition(async () => {
      const result = await toggleProductFeatured(productId);
      if (result?.error) {
        setFeatured(!next); // reverte
        setError(result.error);
      } else if (typeof result?.isFeatured === "boolean") {
        setFeatured(result.isFeatured);
      }
    });
  }

  const label = disabled
    ? "Produto sem categoria não pode ser destacado"
    : featured
      ? "Remover destaque"
      : "Marcar como destaque";

  return (
    <div className="relative flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isPending}
        aria-pressed={featured}
        aria-label={label}
        title={label}
        className={cn(
          "rounded p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40",
          featured
            ? "text-amber-500 hover:text-amber-600"
            : "text-stone-300 hover:text-amber-400"
        )}
      >
        <Star className={cn("h-5 w-5", featured && "fill-current")} />
      </button>

      {error && (
        <span
          role="alert"
          className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md bg-red-50 px-2 py-1 text-left text-xs text-red-600 shadow-md"
        >
          {error}
        </span>
      )}
    </div>
  );
}
