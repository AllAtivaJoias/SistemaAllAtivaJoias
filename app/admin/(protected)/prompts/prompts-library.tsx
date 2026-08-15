"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/admin/help-button";
import { ADMIN_PROMPTS_PAGE_SIZE } from "@/lib/list-limits";
import { PromptCard } from "./prompt-card";
import { PromptDetailDialog } from "./prompt-detail-dialog";
import { PromptFilters } from "./prompt-filters";
import { PromptFormSheet } from "./prompt-form-sheet";
import type {
  PromptCardModel,
  PromptListQuery,
  PromptToast,
  TaxonomyOption,
} from "./prompt-types";

const COPY_SUFFIX = " — Cópia";

function cloneForDuplicate(prompt: PromptCardModel): PromptCardModel {
  const max = 120;
  const base = prompt.title.slice(0, Math.max(1, max - COPY_SUFFIX.length));
  return {
    ...prompt,
    id: "",
    title: `${base}${COPY_SUFFIX}`,
    isFavorite: false,
    usageCount: 0,
  };
}

export function PromptsLibrary({
  prompts,
  total,
  query,
  categories,
  purposes,
  tags,
  hasFilters,
}: {
  prompts: PromptCardModel[];
  total: number;
  query: PromptListQuery;
  categories: TaxonomyOption[];
  purposes: TaxonomyOption[];
  tags: TaxonomyOption[];
  hasFilters: boolean;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<PromptToast>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formPrompt, setFormPrompt] = useState<PromptCardModel | null>(null);
  const [detail, setDetail] = useState<PromptCardModel | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / ADMIN_PROMPTS_PAGE_SIZE));

  function openCreate() {
    setFormPrompt(null);
    setFormOpen(true);
  }

  function openEdit(prompt: PromptCardModel) {
    setDetail(null);
    setFormPrompt(prompt);
    setFormOpen(true);
  }

  function openDuplicate(prompt: PromptCardModel) {
    setDetail(null);
    setFormPrompt(cloneForDuplicate(prompt));
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-800">
            Biblioteca de Prompts
          </h1>
          <p className="mt-1 text-stone-500">
            Centralize os prompts de IA da joalheria para encontrar e reutilizar
            com um clique.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton moduleKey="prompts" />
          <Button
            type="button"
            onClick={openCreate}
            className="bg-brand-600 text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Criar Prompt
          </Button>
        </div>
      </div>

      <PromptFilters
        query={query}
        categories={categories}
        purposes={purposes}
        tags={tags}
      />

      {prompts.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onCreate={openCreate} />
      ) : (
        <>
          <p className="text-sm text-slate-500">
            {total} prompt{total === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onView={() => setDetail(prompt)}
                onEdit={() => openEdit(prompt)}
                onDuplicate={() => openDuplicate(prompt)}
                onDeleted={() => router.refresh()}
                onToast={setToast}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={query.page} totalPages={totalPages} query={query} />
          )}
        </>
      )}

      <PromptFormSheet
        key={formPrompt?.id || "new"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setFormPrompt(null);
        }}
        prompt={formPrompt}
        categories={categories}
        purposes={purposes}
      />

      <PromptDetailDialog
        prompt={detail}
        open={Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onEdit={() => {
          if (detail) openEdit(detail);
        }}
        onDuplicate={() => {
          if (detail) openDuplicate(detail);
        }}
        onToast={setToast}
      />

      <LibraryToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function EmptyState({
  hasFilters,
  onCreate,
}: {
  hasFilters: boolean;
  onCreate: () => void;
}) {
  if (hasFilters) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-brand-600" />
        <p className="mt-3 font-medium text-slate-800">
          Nenhum prompt corresponde aos filtros atuais.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => {
            window.location.href = "/admin/prompts";
          }}
        >
          Limpar filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Sparkles className="mx-auto h-8 w-8 text-brand-600" />
      <p className="mt-3 font-medium text-slate-800">Nenhum prompt encontrado.</p>
      <p className="mt-1 text-sm text-slate-500">
        Crie seu primeiro prompt para começar a construir sua biblioteca de IA.
      </p>
      <Button
        type="button"
        onClick={onCreate}
        className="mt-4 bg-brand-600 text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" />
        Criar Prompt
      </Button>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query: PromptListQuery;
}) {
  function href(nextPage: number) {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.category) params.set("category", query.category);
    if (query.purpose) params.set("purpose", query.purpose);
    if (query.tool) params.set("tool", query.tool);
    if (query.tag) params.set("tag", query.tag);
    if (query.favorites) params.set("fav", "1");
    if (query.sort !== "recent") params.set("sort", query.sort);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/prompts?${qs}` : "/admin/prompts";
  }

  return (
    <div className="flex items-center justify-center gap-3">
      {page <= 1 ? (
        <Button variant="outline" size="sm" disabled>
          Anterior
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <a href={href(page - 1)}>Anterior</a>
        </Button>
      )}
      <span className="text-sm text-slate-500">
        Página {page} de {totalPages}
      </span>
      {page >= totalPages ? (
        <Button variant="outline" size="sm" disabled>
          Próxima
        </Button>
      ) : (
        <Button variant="outline" size="sm" asChild>
          <a href={href(page + 1)}>Próxima</a>
        </Button>
      )}
    </div>
  );
}

function LibraryToast({
  toast,
  onClose,
}: {
  toast: PromptToast;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onClose, 3500);
    return () => window.clearTimeout(id);
  }, [toast, onClose]);

  if (!toast) return null;
  const isSuccess = toast.type === "success";

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-[70] flex max-w-sm items-start gap-2 rounded-md border px-4 py-3 text-sm shadow-lg ${
        isSuccess
          ? "border-brand-200 bg-brand-50 text-brand-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {isSuccess && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
