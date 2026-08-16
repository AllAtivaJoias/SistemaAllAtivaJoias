"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function ColorSchemeToggle({
  enabled,
  collapsed,
}: {
  enabled: boolean;
  collapsed?: boolean;
}) {
  const [scheme, setScheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const stored = window.localStorage.getItem("allativa-color-scheme");
    if (stored === "dark" || stored === "light") setScheme(stored);
    else {
      setScheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    }
  }, [enabled]);

  if (!enabled) return null;

  function toggle() {
    const next = scheme === "dark" ? "light" : "dark";
    setScheme(next);
    window.localStorage.setItem("allativa-color-scheme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size={collapsed ? "icon" : "sm"}
      onClick={toggle}
      className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      title={scheme === "dark" ? "Modo claro" : "Modo escuro"}
    >
      {scheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!collapsed && (
        <span>{scheme === "dark" ? "Modo claro" : "Modo escuro"}</span>
      )}
    </Button>
  );
}
