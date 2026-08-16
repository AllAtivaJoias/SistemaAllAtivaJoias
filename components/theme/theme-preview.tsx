"use client";

import type { CSSProperties } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { themePreviewStyle } from "@/lib/theme/registry";
import type { ThemeConfig, ThemeTokens } from "@/lib/theme/tokens";

export function ThemePreview({
  theme,
  tokens,
  storeName,
}: {
  theme: ThemeConfig;
  tokens: ThemeTokens;
  storeName: string;
}) {
  const style = themePreviewStyle(tokens, theme) as CSSProperties;

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-background text-foreground shadow-sm"
      style={style}
    >
      <div className="flex min-h-[420px]">
        <aside className="hidden w-36 shrink-0 bg-sidebar p-3 text-sidebar-foreground sm:block">
          <p className="mb-3 font-serif text-sm font-semibold">{storeName}</p>
          <div className="space-y-1 text-xs">
            <div className="rounded-md bg-sidebar-primary px-2 py-1.5 text-sidebar-primary-foreground">
              Dashboard
            </div>
            <div className="rounded-md px-2 py-1.5 hover:bg-sidebar-accent">Pedidos</div>
            <div className="rounded-md px-2 py-1.5 hover:bg-sidebar-accent">Aparência</div>
          </div>
        </aside>
        <div className="flex-1 space-y-3 p-3">
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg font-semibold">Painel</p>
            <Badge>Novo</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0">
                <Input placeholder="Campo de exemplo" />
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm">Salvar</Button>
                  <Button size="sm" variant="outline">
                    Cancelar
                  </Button>
                  <Button size="sm" variant="destructive">
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="text-sm">Estados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-3 pt-0 text-xs">
                <p className="rounded bg-success/15 px-2 py-1 text-success">Sucesso</p>
                <p className="rounded bg-warning/15 px-2 py-1 text-warning">Alerta</p>
                <p className="rounded bg-destructive/15 px-2 py-1 text-destructive">Erro</p>
                <p className="rounded bg-info/15 px-2 py-1 text-info">Info</p>
              </CardContent>
            </Card>
          </div>
          <Tabs defaultValue="a">
            <TabsList>
              <TabsTrigger value="a">Vendas</TabsTrigger>
              <TabsTrigger value="b">Oficina</TabsTrigger>
            </TabsList>
            <TabsContent value="a" className="text-xs text-muted-foreground">
              Tabela e gráficos usam chart-1…5 e bordas do tema.
              <div className="mt-2 flex h-8 overflow-hidden rounded">
                {(["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"] as const).map(
                  (cls) => (
                    <div key={cls} className={`flex-1 ${cls}`} />
                  )
                )}
              </div>
            </TabsContent>
            <TabsContent value="b" className="text-xs text-muted-foreground">
              Produção, BOM e QC herdam os mesmos tokens.
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
