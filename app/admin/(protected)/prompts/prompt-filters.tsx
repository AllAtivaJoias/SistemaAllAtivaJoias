"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, X } from "lucide-react";

import type { AiPromptSort } from "@/lib/ai-prompt";
import { AI_PROMPT_SORTS, AI_PROMPT_TOOLS } from "@/lib/ai-prompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PromptListQuery, TaxonomyOption } from "./prompt-types";

const SORT_LABELS: Record<AiPromptSort, string> = {
  recent: "Mais recentes",
  oldest: "Mais antigos",
  used: "Mais utilizados",
  alpha: "Alfabético",
  favorites: "Favoritos primeiro",
};

const ALL = "__all__";

function buildUrl(next: PromptListQuery): string {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.purpose) params.set("purpose", next.purpose);
  if (next.tool) params.set("tool", next.tool);
  if (next.tag) params.set("tag", next.tag);
  if (next.favorites) params.set("fav", "1");
  if (next.sort && next.sort !== "recent") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `/admin/prompts?${qs}` : "/admin/prompts";
}

export function PromptFilters({
  query,
  categories,
  purposes,
  tags,
}: {
  query: PromptListQuery;
  categories: TaxonomyOption[];
  purposes: TaxonomyOption[];
  tags: TaxonomyOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(query.q);
  const skipDebounce = useRef(true);

  useEffect(() => {
    setDraft(query.q);
  }, [query.q]);

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    const handle = window.setTimeout(() => {
      if (draft.trim() === query.q) return;
      router.push(buildUrl({ ...query, q: draft.trim(), page: 1 }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [draft, query, router]);

  function patch(partial: Partial<PromptListQuery>) {
    router.push(buildUrl({ ...query, ...partial, page: 1 }));
  }

  const hasFilters = Boolean(
    query.q ||
      query.category ||
      query.purpose ||
      query.tool ||
      query.tag ||
      query.favorites ||
      query.sort !== "recent"
  );

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar prompts..."
          aria-label="Buscar prompts"
          className="pl-9"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FilterSelect
          label="Categoria"
          value={query.category ?? ALL}
          onChange={(value) =>
            patch({ category: value === ALL ? null : value })
          }
          options={categories}
        />
        <FilterSelect
          label="Finalidade"
          value={query.purpose ?? ALL}
          onChange={(value) =>
            patch({ purpose: value === ALL ? null : value })
          }
          options={purposes}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Ferramenta</Label>
          <Select
            value={query.tool ?? ALL}
            onValueChange={(value) =>
              patch({ tool: value === ALL ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {AI_PROMPT_TOOLS.map((tool) => (
                <SelectItem key={tool} value={tool}>
                  {tool}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FilterSelect
          label="Tags"
          value={query.tag ?? ALL}
          onChange={(value) => patch({ tag: value === ALL ? null : value })}
          options={tags}
          emptyLabel="Todas"
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Ordenar</Label>
          <Select
            value={query.sort}
            onValueChange={(value) =>
              patch({
                sort: AI_PROMPT_SORTS.includes(value as AiPromptSort)
                  ? (value as AiPromptSort)
                  : "recent",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_PROMPT_SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {SORT_LABELS[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={query.favorites ? "default" : "outline"}
          size="sm"
          onClick={() => patch({ favorites: !query.favorites })}
          className={
            query.favorites
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : ""
          }
        >
          <Star className={query.favorites ? "fill-current" : ""} />
          Favoritos
        </Button>
        {hasFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/prompts")}
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  emptyLabel = "Todas",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: TaxonomyOption[];
  emptyLabel?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-500">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={emptyLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{emptyLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
