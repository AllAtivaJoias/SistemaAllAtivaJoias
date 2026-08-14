"use client";

import { useState } from "react";
import { Gem, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

export interface HeaderCategory {
  id: string;
  label: string;
}

interface HeaderProps {
  categories: HeaderCategory[];
}

export function Header({ categories }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const activeId = useScrollSpy(categories.map((category) => category.id));

  function handleNavigate(id: string) {
    setOpen(false);
    // Aguarda o fechamento do Sheet antes de rolar suavemente até a seção.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container relative flex h-16 items-center">
        {/* Lado esquerdo: Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-800 hover:bg-brand-50 hover:text-brand-700"
              aria-label="Abrir menu de categorias"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 bg-slate-50">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-serif text-2xl font-semibold text-brand-800">
                <Gem className="h-5 w-5 text-brand-600" />
                AllAtiva Joias
              </SheetTitle>
              <SheetDescription className="text-slate-500">
                Navegue pelas categorias do catálogo.
              </SheetDescription>
            </SheetHeader>

            <nav className="mt-8 flex flex-col gap-1">
              {categories.map((category) => {
                const isActive = category.id === activeId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleNavigate(category.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-3 text-left text-base font-medium transition-colors",
                      isActive
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-700 hover:bg-brand-100 hover:text-brand-800"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors",
                        isActive ? "bg-white" : "bg-brand-300"
                      )}
                    />
                    {category.label}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Centro: Nome da joalheria */}
        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          <Gem className="h-5 w-5 text-brand-600" />
          <span className="font-serif text-xl font-semibold tracking-wide text-slate-900 sm:text-2xl">
            AllAtiva Joias
          </span>
        </div>
      </div>
    </header>
  );
}
