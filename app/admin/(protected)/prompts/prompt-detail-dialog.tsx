"use client";

import { Copy, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PromptCopyButton } from "./prompt-copy-button";
import type { PromptCardModel, PromptToast } from "./prompt-types";

export function PromptDetailDialog({
  prompt,
  open,
  onOpenChange,
  onEdit,
  onDuplicate,
  onToast,
}: {
  prompt: PromptCardModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToast: (toast: NonNullable<PromptToast>) => void;
}) {
  if (!prompt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8 font-serif text-xl">
            {prompt.title}
          </DialogTitle>
          <DialogDescription>
            {prompt.category.name} · {prompt.purpose.name}
            {prompt.tool ? ` · ${prompt.tool}` : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {prompt.description && (
            <p className="text-sm leading-relaxed text-slate-700">
              {prompt.description}
            </p>
          )}

          {prompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {prompt.variables.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Variáveis
              </p>
              <div className="flex flex-wrap gap-1.5">
                {prompt.variables.map((name) => (
                  <Badge key={name} variant="brand" className="font-mono">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Prompt
            </p>
            <pre className="max-h-[40vh] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm leading-relaxed text-slate-800">
              {prompt.content}
            </pre>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDuplicate}>
            <Copy className="h-4 w-4" />
            Duplicar
          </Button>
          <Button type="button" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
          <PromptCopyButton
            promptId={prompt.id}
            content={prompt.content}
            onToast={onToast}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
