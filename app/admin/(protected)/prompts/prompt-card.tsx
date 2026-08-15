"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Eye, Pencil, Star } from "lucide-react";

import { toggleFavoritePrompt, deletePrompt } from "@/app/admin/prompts/actions";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { previewPromptContent } from "@/lib/ai-prompt";
import { PromptCopyButton } from "./prompt-copy-button";
import type { PromptCardModel, PromptToast } from "./prompt-types";

export function PromptCard({
  prompt,
  onView,
  onEdit,
  onDuplicate,
  onDeleted,
  onToast,
}: {
  prompt: PromptCardModel;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDeleted: () => void;
  onToast: (toast: NonNullable<PromptToast>) => void;
}) {
  const [favorite, setFavorite] = useState(prompt.isFavorite);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFavorite(prompt.isFavorite);
  }, [prompt.isFavorite]);

  function handleFavorite() {
    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleFavoritePrompt(prompt.id);
      if (result.error) {
        setFavorite(!next);
        onToast({ type: "error", message: result.error });
        return;
      }
      if (typeof result.isFavorite === "boolean") {
        setFavorite(result.isFavorite);
      }
    });
  }

  return (
    <article className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="brand">{prompt.category.name}</Badge>
            <Badge variant="secondary">{prompt.purpose.name}</Badge>
          </div>
          <h2 className="font-serif text-lg font-semibold leading-snug text-stone-800">
            {prompt.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={handleFavorite}
          disabled={isPending}
          aria-pressed={favorite}
          aria-label={favorite ? "Remover dos favoritos" : "Favoritar"}
          className={cn(
            "shrink-0 rounded p-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
            favorite ? "text-amber-500" : "text-slate-300 hover:text-amber-400"
          )}
        >
          <Star className={cn("h-5 w-5", favorite && "fill-current")} />
        </button>
      </header>

      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
        {prompt.description || "Sem descrição."}
      </p>
      <p className="mt-2 line-clamp-3 font-mono text-xs leading-relaxed text-slate-500">
        {previewPromptContent(prompt.content)}
      </p>

      {prompt.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {prompt.tags.slice(0, 6).map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <footer className="mt-auto space-y-3 pt-4">
        <PromptCopyButton
          promptId={prompt.id}
          content={prompt.content}
          onToast={onToast}
          fullWidth
        />
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Visualizar"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Editar"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Duplicar"
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DeleteConfirmDialog
            title="Excluir este prompt?"
            description="Tem certeza que deseja excluir este prompt? Essa ação não poderá ser desfeita."
            onConfirm={async () => {
              const result = await deletePrompt(prompt.id);
              if (result.error) {
                onToast({ type: "error", message: result.error });
              } else {
                onToast({ type: "success", message: "Prompt excluído." });
                onDeleted();
              }
              return result;
            }}
          />
        </div>
      </footer>
    </article>
  );
}
