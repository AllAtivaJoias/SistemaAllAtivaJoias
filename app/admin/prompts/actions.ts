"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { slugify } from "@/lib/slugify";
import {
  AI_PROMPT_LIMITS,
  aiPromptFormSchema,
  extractPromptVariables,
  normalizeTagNames,
} from "@/lib/ai-prompt";

export type PromptActionState = {
  error?: string;
  success?: boolean;
  id?: string;
};

const NEW_TAXONOMY = "__new__";

function revalidatePrompts() {
  revalidatePath("/admin/prompts");
}

const idSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[\w-]+$/);

async function resolveTaxonomyId(params: {
  kind: "category" | "purpose";
  selectedId: string;
  newName?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (params.selectedId !== NEW_TAXONOMY) {
    if (params.kind === "category") {
      const found = await prisma.aiPromptCategory.findFirst({
        where: { id: params.selectedId, isActive: true },
        select: { id: true },
      });
      if (!found) return { ok: false, error: "Categoria inválida." };
      return { ok: true, id: found.id };
    }
    const found = await prisma.aiPromptPurpose.findFirst({
      where: { id: params.selectedId, isActive: true },
      select: { id: true },
    });
    if (!found) return { ok: false, error: "Finalidade inválida." };
    return { ok: true, id: found.id };
  }

  const name = (params.newName ?? "").trim();
  if (!name) {
    return {
      ok: false,
      error:
        params.kind === "category"
          ? "Informe o nome da nova categoria."
          : "Informe o nome da nova finalidade.",
    };
  }

  const slug = slugify(name);
  if (!slug) {
    return { ok: false, error: "Nome inválido." };
  }

  try {
    if (params.kind === "category") {
      const existing = await prisma.aiPromptCategory.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing) return { ok: true, id: existing.id };
      const last = await prisma.aiPromptCategory.aggregate({
        _max: { order: true },
      });
      const created = await prisma.aiPromptCategory.create({
        data: {
          name,
          slug,
          order: (last._max.order ?? -1) + 1,
        },
        select: { id: true },
      });
      return { ok: true, id: created.id };
    }

    const existing = await prisma.aiPromptPurpose.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing) return { ok: true, id: existing.id };
    const last = await prisma.aiPromptPurpose.aggregate({
      _max: { order: true },
    });
    const created = await prisma.aiPromptPurpose.create({
      data: {
        name,
        slug,
        order: (last._max.order ?? -1) + 1,
      },
      select: { id: true },
    });
    return { ok: true, id: created.id };
  } catch (error) {
    logger.error("ai_prompt.taxonomy_failed", {
      kind: params.kind,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { ok: false, error: "Não foi possível salvar a taxonomia." };
  }
}

async function connectTags(names: string[]) {
  const normalized = normalizeTagNames(names);
  const records: { id: string }[] = [];
  for (const name of normalized) {
    const slug = slugify(name);
    if (!slug) continue;
    const tag = await prisma.aiPromptTag.upsert({
      where: { slug },
      create: { name, slug },
      update: { name },
      select: { id: true },
    });
    records.push(tag);
  }
  return records;
}

function parseForm(formData: FormData) {
  const tagsRaw = String(formData.get("tags") ?? "");
  const tags = tagsRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return aiPromptFormSchema.safeParse({
    id: String(formData.get("id") ?? "") || undefined,
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    content: String(formData.get("content") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    purposeId: String(formData.get("purposeId") ?? ""),
    newCategoryName: String(formData.get("newCategoryName") ?? ""),
    newPurposeName: String(formData.get("newPurposeName") ?? ""),
    tool: String(formData.get("tool") ?? ""),
    language: String(formData.get("language") ?? "pt-BR") || "pt-BR",
    tags,
    isActive: formData.get("isActive") !== "off",
  });
}

export async function createPrompt(
  _prev: PromptActionState,
  formData: FormData
): Promise<PromptActionState> {
  const session = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const category = await resolveTaxonomyId({
    kind: "category",
    selectedId: parsed.data.categoryId,
    newName: parsed.data.newCategoryName,
  });
  if (!category.ok) return { error: category.error };

  const purpose = await resolveTaxonomyId({
    kind: "purpose",
    selectedId: parsed.data.purposeId,
    newName: parsed.data.newPurposeName,
  });
  if (!purpose.ok) return { error: purpose.error };

  const variables = extractPromptVariables(parsed.data.content);
  const tags = await connectTags(parsed.data.tags);

  try {
    const created = await prisma.aiPrompt.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        content: parsed.data.content,
        categoryId: category.id,
        purposeId: purpose.id,
        tool: parsed.data.tool,
        language: parsed.data.language || "pt-BR",
        variables,
        isActive: parsed.data.isActive,
        authorId: session.user.id,
        tags: {
          create: tags.map((tag) => ({ tagId: tag.id })),
        },
      },
      select: { id: true },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_PROMPT_CREATE",
      entity: "AiPrompt",
      entityId: created.id,
      after: { title: parsed.data.title },
    });

    revalidatePrompts();
    return { success: true, id: created.id };
  } catch (error) {
    logger.error("ai_prompt.create_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível criar o prompt." };
  }
}

export async function updatePrompt(
  _prev: PromptActionState,
  formData: FormData
): Promise<PromptActionState> {
  const session = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const id = parsed.data.id;
  if (!id) return { error: "Prompt inválido." };

  const existing = await prisma.aiPrompt.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Prompt não encontrado." };

  const category = await resolveTaxonomyId({
    kind: "category",
    selectedId: parsed.data.categoryId,
    newName: parsed.data.newCategoryName,
  });
  if (!category.ok) return { error: category.error };

  const purpose = await resolveTaxonomyId({
    kind: "purpose",
    selectedId: parsed.data.purposeId,
    newName: parsed.data.newPurposeName,
  });
  if (!purpose.ok) return { error: purpose.error };

  const variables = extractPromptVariables(parsed.data.content);
  const tags = await connectTags(parsed.data.tags);

  try {
    await prisma.$transaction([
      prisma.aiPromptOnTag.deleteMany({ where: { promptId: id } }),
      prisma.aiPrompt.update({
        where: { id },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          content: parsed.data.content,
          categoryId: category.id,
          purposeId: purpose.id,
          tool: parsed.data.tool,
          language: parsed.data.language || "pt-BR",
          variables,
          isActive: parsed.data.isActive,
          tags: {
            create: tags.map((tag) => ({ tagId: tag.id })),
          },
        },
      }),
    ]);

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_PROMPT_UPDATE",
      entity: "AiPrompt",
      entityId: id,
      after: { title: parsed.data.title },
    });

    revalidatePrompts();
    return { success: true, id };
  } catch (error) {
    logger.error("ai_prompt.update_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível atualizar o prompt." };
  }
}

export async function deletePrompt(promptId: string): Promise<PromptActionState> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(promptId);
  if (!parsed.success) return { error: "Prompt inválido." };

  try {
    const deleted = await prisma.aiPrompt.delete({
      where: { id: parsed.data },
      select: { id: true, title: true },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_PROMPT_DELETE",
      entity: "AiPrompt",
      entityId: deleted.id,
      before: { title: deleted.title },
    });

    revalidatePrompts();
    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Prompt não encontrado." };
    }
    logger.error("ai_prompt.delete_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível excluir o prompt." };
  }
}

export async function duplicatePrompt(
  promptId: string
): Promise<PromptActionState> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(promptId);
  if (!parsed.success) return { error: "Prompt inválido." };

  const source = await prisma.aiPrompt.findUnique({
    where: { id: parsed.data },
    include: { tags: { select: { tagId: true } } },
  });
  if (!source) return { error: "Prompt não encontrado." };

  const suffix = " — Cópia";
  const maxTitle = AI_PROMPT_LIMITS.title;
  const base = source.title.slice(0, Math.max(1, maxTitle - suffix.length));
  const title = `${base}${suffix}`;

  try {
    const created = await prisma.aiPrompt.create({
      data: {
        title,
        description: source.description,
        content: source.content,
        categoryId: source.categoryId,
        purposeId: source.purposeId,
        tool: source.tool,
        language: source.language,
        variables: source.variables,
        isFavorite: false,
        isActive: true,
        usageCount: 0,
        authorId: session.user.id,
        tags: {
          create: source.tags.map((row) => ({ tagId: row.tagId })),
        },
      },
      select: { id: true },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_PROMPT_DUPLICATE",
      entity: "AiPrompt",
      entityId: created.id,
      after: { from: source.id, title },
    });

    revalidatePrompts();
    return { success: true, id: created.id };
  } catch (error) {
    logger.error("ai_prompt.duplicate_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível duplicar o prompt." };
  }
}

export async function toggleFavoritePrompt(
  promptId: string
): Promise<PromptActionState & { isFavorite?: boolean }> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse(promptId);
  if (!parsed.success) return { error: "Prompt inválido." };

  try {
    const current = await prisma.aiPrompt.findUnique({
      where: { id: parsed.data },
      select: { isFavorite: true },
    });
    if (!current) return { error: "Prompt não encontrado." };

    const updated = await prisma.aiPrompt.update({
      where: { id: parsed.data },
      data: { isFavorite: !current.isFavorite },
      select: { isFavorite: true },
    });

    await writeAuditLog({
      userId: session.user.id,
      action: "AI_PROMPT_FAVORITE",
      entity: "AiPrompt",
      entityId: parsed.data,
      after: { isFavorite: updated.isFavorite },
    });

    revalidatePrompts();
    return { success: true, isFavorite: updated.isFavorite };
  } catch (error) {
    logger.error("ai_prompt.favorite_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível atualizar o favorito." };
  }
}

export async function recordPromptCopy(
  promptId: string
): Promise<PromptActionState> {
  await requireAdmin();
  const parsed = idSchema.safeParse(promptId);
  if (!parsed.success) return { error: "Prompt inválido." };

  try {
    await prisma.aiPrompt.update({
      where: { id: parsed.data },
      data: { usageCount: { increment: 1 } },
      select: { id: true },
    });
    revalidatePrompts();
    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { error: "Prompt não encontrado." };
    }
    logger.error("ai_prompt.copy_track_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível registrar o uso." };
  }
}
