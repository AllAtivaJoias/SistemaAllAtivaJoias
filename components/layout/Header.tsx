"use client";

import { useState } from "react";
import { Gem, Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
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
  storeName?: string;
  logoUrl?: string;
}

export function Header({
  categories,
  storeName = "AllAtiva Joias",
  logoUrl,
}: HeaderProps) {
  const [open, setOpen] = useState(false);
  const activeId = useScrollSpy(categories.map((category) => category.id));

  function handleNavigate(id: string) {
    setOpen(false);
    // Aguarda o fechamento do Sheet antes de rolar suavemente até a seção.
    window.setTimeout(() => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        // Fora da home (ex.: /categoria/[slug]): navega até a âncora na home.
        window.location.href = `/#${id}`;
      }
    }, 150);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 text-card-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container relative flex h-16 items-center">
        {/* Lado esquerdo: Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent hover:text-accent-foreground"
              aria-label="Abrir menu de categorias"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-72 bg-background">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-serif text-2xl font-semibold text-foreground">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-6 w-auto object-contain" />
                ) : (
                  <Gem className="h-5 w-5 text-primary" />
                )}
                {storeName}
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                Navegue pelas categorias do catálogo.
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="mt-2">
            <nav className="flex flex-col gap-1">
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
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors",
                        isActive ? "bg-primary-foreground" : "bg-muted-foreground"
                      )}
                    />
                    {category.label}
                  </button>
                );
              })}
            </nav>
            </SheetBody>
          </SheetContent>
        </Sheet>

        {/* Centro: Nome da joalheria */}
        <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-7 w-auto object-contain" />
          ) : (
            <Gem className="h-5 w-5 text-primary" />
          )}
          <span className="font-serif text-xl font-semibold tracking-wide text-foreground sm:text-2xl">
            {storeName}
          </span>
        </div>
      </div>
    </header>
  );
}
