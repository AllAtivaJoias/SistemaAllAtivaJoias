"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X } from "lucide-react";

import {
  createPrompt,
  updatePrompt,
  type PromptActionState,
} from "@/app/admin/prompts/actions";
import {
  AI_PROMPT_LIMITS,
  AI_PROMPT_TOOLS,
  extractPromptVariables,
  normalizeTagNames,
} from "@/lib/ai-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { PromptCardModel, TaxonomyOption } from "./prompt-types";

const NEW = "__new__";
const NONE = "__none__";

const formSchema = z.object({
  title: z.string().trim().min(1, "Informe o título."),
  description: z.string(),
  content: z
    .string()
    .refine((value) => value.trim().length > 0, "Informe o conteúdo do prompt."),
  categoryId: z.string().min(1, "Selecione a categoria."),
  purposeId: z.string().min(1, "Selecione a finalidade."),
  newCategoryName: z.string(),
  newPurposeName: z.string(),
  tool: z.string(),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

function toValues(prompt?: PromptCardModel | null): FormValues {
  return {
    title: prompt?.title ?? "",
    description: prompt?.description ?? "",
    content: prompt?.content ?? "",
    categoryId: prompt?.category.id ?? "",
    purposeId: prompt?.purpose.id ?? "",
    newCategoryName: "",
    newPurposeName: "",
    tool: prompt?.tool ?? "",
    tags: prompt?.tags.map((tag) => tag.name) ?? [],
  };
}

export function PromptFormSheet({
  open,
  onOpenChange,
  prompt,
  categories,
  purposes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt?: PromptCardModel | null;
  categories: TaxonomyOption[];
  purposes: TaxonomyOption[];
}) {
  const isEditing = Boolean(prompt?.id);
  const [state, formAction, isPending] = useActionState<
    PromptActionState,
    FormData
  >(isEditing ? updatePrompt : createPrompt, {});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toValues(prompt),
  });

  const [tagDraft, setTagDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    form.reset(toValues(prompt));
    setTagDraft("");
  }, [open, prompt, form]);

  useEffect(() => {
    if (state?.success) onOpenChange(false);
  }, [state, onOpenChange]);

  const content = form.watch("content");
  const categoryId = form.watch("categoryId");
  const purposeId = form.watch("purposeId");
  const tags = form.watch("tags");
  const variables = useMemo(() => extractPromptVariables(content ?? ""), [content]);

  function addTag(raw: string) {
    const next = normalizeTagNames([...tags, raw]);
    form.setValue("tags", next, { shouldValidate: true });
    setTagDraft("");
  }

  function onValid(values: FormValues) {
    const fd = new FormData();
    if (isEditing && prompt?.id) fd.set("id", prompt.id);
    fd.set("title", values.title);
    fd.set("description", values.description);
    fd.set("content", values.content);
    fd.set("categoryId", values.categoryId);
    fd.set("purposeId", values.purposeId);
    fd.set("newCategoryName", values.newCategoryName);
    fd.set("newPurposeName", values.newPurposeName);
    fd.set("tool", values.tool);
    fd.set("tags", values.tags.join(","));
    formAction(fd);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Editar prompt" : "Novo prompt"}
          </SheetTitle>
          <SheetDescription>
            Organize o texto para reutilizar na criação de imagens e conteúdos.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onValid)}
          className="flex min-h-0 flex-1 flex-col"
          noValidate
        >
          <SheetBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Título</Label>
              <Input
                id="prompt-title"
                maxLength={AI_PROMPT_LIMITS.title}
                placeholder="Ex.: Pulseira de ouro em estúdio premium"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-description">Descrição</Label>
              <Textarea
                id="prompt-description"
                rows={2}
                maxLength={AI_PROMPT_LIMITS.description}
                placeholder="Para que serve este prompt?"
                {...form.register("description")}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={categoryId || undefined}
                  onValueChange={(value) =>
                    form.setValue("categoryId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW}>+ Nova categoria</SelectItem>
                  </SelectContent>
                </Select>
                {categoryId === NEW && (
                  <Input
                    placeholder="Nome da categoria"
                    {...form.register("newCategoryName")}
                  />
                )}
                {form.formState.errors.categoryId && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.categoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Finalidade</Label>
                <Select
                  value={purposeId || undefined}
                  onValueChange={(value) =>
                    form.setValue("purposeId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {purposes.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={NEW}>+ Nova finalidade</SelectItem>
                  </SelectContent>
                </Select>
                {purposeId === NEW && (
                  <Input
                    placeholder="Nome da finalidade"
                    {...form.register("newPurposeName")}
                  />
                )}
                {form.formState.errors.purposeId && (
                  <p className="text-xs text-red-600">
                    {form.formState.errors.purposeId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ferramenta</Label>
              <Select
                value={form.watch("tool") || NONE}
                onValueChange={(value) =>
                  form.setValue("tool", value === NONE ? "" : value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Não especificar</SelectItem>
                  {AI_PROMPT_TOOLS.map((tool) => (
                    <SelectItem key={tool} value={tool}>
                      {tool}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-tags">Tags</Label>
              <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5">
                {tags.map((tag) => (
                  <Badge key={tag} variant="brand" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remover ${tag}`}
                      className="rounded p-0.5 hover:bg-brand-200/60"
                      onClick={() =>
                        form.setValue(
                          "tags",
                          tags.filter((item) => item !== tag)
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  id="prompt-tags"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addTag(tagDraft);
                    }
                  }}
                  placeholder={tags.length === 0 ? "ouro, luxo, estúdio" : "Adicionar"}
                  className="h-7 min-w-[8rem] flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
                />
              </div>
              <p className="text-xs text-slate-500">
                Enter ou vírgula adiciona. Máximo de {AI_PROMPT_LIMITS.maxTags} tags.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-content">Conteúdo do Prompt</Label>
              <Textarea
                id="prompt-content"
                {...form.register("content")}
                className="min-h-48 resize-y font-mono text-sm leading-relaxed"
                maxLength={AI_PROMPT_LIMITS.content}
                placeholder={
                  "Crie uma imagem profissional de uma {TIPO_DE_JOIA}, confeccionada em {MATERIAL}..."
                }
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>Quebras de linha e espaços são preservados.</span>
                <span>
                  {(content ?? "").length}/{AI_PROMPT_LIMITS.content}
                </span>
              </div>
              {form.formState.errors.content && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.content.message}
                </p>
              )}
            </div>

            {variables.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Variáveis detectadas
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((name) => (
                    <Badge key={name} variant="outline" className="font-mono">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {state?.error && (
              <p className="text-sm text-red-600">{state.error}</p>
            )}
          </SheetBody>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Salvar" : "Criar prompt"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
