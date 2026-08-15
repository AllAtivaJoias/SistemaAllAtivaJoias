import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { slugify } from "@/lib/slugify";
import { ADMIN_PROMPTS_PAGE_SIZE } from "@/lib/list-limits";

export const AI_PROMPT_TOOLS = [
  "ChatGPT",
  "Midjourney",
  "Gemini",
  "Claude",
  "Adobe Firefly",
  "DALL-E",
  "Outros",
] as const;

export type AiPromptTool = (typeof AI_PROMPT_TOOLS)[number];

export const AI_PROMPT_SORTS = [
  "recent",
  "oldest",
  "used",
  "alpha",
  "favorites",
] as const;

export type AiPromptSort = (typeof AI_PROMPT_SORTS)[number];

export const AI_PROMPT_LIMITS = {
  title: 120,
  description: 400,
  content: 20_000,
  tool: 40,
  language: 16,
  tagName: 40,
  maxTags: 12,
  maxSearchTokens: 8,
  minTokenLength: 2,
} as const;

/** `{IDENTIFICADOR}` — letras, dígitos e underscore; 1.ª posição alfabética. */
const VARIABLE_RE = /\{([A-Za-zÀ-ÿ_][A-Za-zÀ-ÿ0-9_]*)\}/g;

export function extractPromptVariables(content: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of content.matchAll(VARIABLE_RE)) {
    const name = match[1] ?? "";
    if (!name) continue;
    const key = name.toLocaleUpperCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    ordered.push(name);
  }
  return ordered;
}

export function tokenizeSearchQuery(raw: string): string[] {
  return raw
    .trim()
    .split(/\s+/)
    .map((token) => token.slice(0, 64))
    .filter((token) => token.length >= AI_PROMPT_LIMITS.minTokenLength)
    .slice(0, AI_PROMPT_LIMITS.maxSearchTokens);
}

export function previewPromptContent(content: string, max = 140): string {
  const collapsed = content.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1).trimEnd()}…`;
}

export function normalizeTagNames(raw: string[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of raw) {
    const name = item.trim().replace(/\s+/g, " ");
    if (!name) continue;
    if (name.length > AI_PROMPT_LIMITS.tagName) continue;
    const key = slugify(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= AI_PROMPT_LIMITS.maxTags) break;
  }
  return names;
}

const idSchema = z
  .string()
  .trim()
  .min(1, "Identificador inválido.")
  .max(64, "Identificador inválido.")
  .regex(/^[\w-]+$/, "Identificador inválido.");

export const aiPromptFormSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .trim()
    .min(1, "Informe o título.")
    .max(AI_PROMPT_LIMITS.title, `Título com no máximo ${AI_PROMPT_LIMITS.title} caracteres.`),
  description: z
    .string()
    .trim()
    .max(
      AI_PROMPT_LIMITS.description,
      `Descrição com no máximo ${AI_PROMPT_LIMITS.description} caracteres.`
    ),
  content: z
    .string()
    .max(
      AI_PROMPT_LIMITS.content,
      `Conteúdo com no máximo ${AI_PROMPT_LIMITS.content} caracteres.`
    )
    .refine((value) => value.trim().length > 0, "Informe o conteúdo do prompt."),
  categoryId: idSchema,
  purposeId: idSchema,
  newCategoryName: z.string().trim().max(80).optional(),
  newPurposeName: z.string().trim().max(80).optional(),
  tool: z
    .string()
    .trim()
    .max(AI_PROMPT_LIMITS.tool)
    .refine(
      (value) => value === "" || AI_PROMPT_TOOLS.includes(value as AiPromptTool),
      "Ferramenta inválida."
    ),
  language: z.string().trim().max(AI_PROMPT_LIMITS.language).default("pt-BR"),
  tags: z.array(z.string()).max(AI_PROMPT_LIMITS.maxTags),
  isActive: z.boolean().default(true),
});

export type AiPromptFormValues = z.infer<typeof aiPromptFormSchema>;

export type AiPromptListParams = {
  q: string;
  category: string | null;
  purpose: string | null;
  tool: string | null;
  tag: string | null;
  favorites: boolean;
  sort: AiPromptSort;
  page: number;
};

function firstParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parsePromptListParams(
  searchParams: Record<string, string | string[] | undefined>
): AiPromptListParams {
  const q = String(firstParam(searchParams.q) ?? "").trim().slice(0, 120);
  const category = String(firstParam(searchParams.category) ?? "").trim();
  const purpose = String(firstParam(searchParams.purpose) ?? "").trim();
  const tool = String(firstParam(searchParams.tool) ?? "").trim();
  const tag = String(firstParam(searchParams.tag) ?? "").trim();
  const fav = String(firstParam(searchParams.fav) ?? "");
  const sortRaw = String(firstParam(searchParams.sort) ?? "recent");
  const pageRaw = Number(firstParam(searchParams.page) ?? "1");

  const sort: AiPromptSort = AI_PROMPT_SORTS.includes(sortRaw as AiPromptSort)
    ? (sortRaw as AiPromptSort)
    : "recent";

  const page = Number.isFinite(pageRaw) ? Math.max(1, Math.min(500, Math.floor(pageRaw))) : 1;

  return {
    q,
    category: category && /^[\w-]+$/.test(category) ? category : null,
    purpose: purpose && /^[\w-]+$/.test(purpose) ? purpose : null,
    tool:
      tool && AI_PROMPT_TOOLS.includes(tool as AiPromptTool) ? tool : null,
    tag: tag && /^[\w-]+$/.test(tag) ? tag : null,
    favorites: fav === "1" || fav === "true",
    sort,
    page,
  };
}

export function buildPromptWhere(
  params: AiPromptListParams
): Prisma.AiPromptWhereInput {
  const tokens = tokenizeSearchQuery(params.q);

  const tokenFilters: Prisma.AiPromptWhereInput[] = tokens.map((token) => ({
    OR: [
      { title: { contains: token, mode: "insensitive" } },
      { description: { contains: token, mode: "insensitive" } },
      { content: { contains: token, mode: "insensitive" } },
      { tool: { contains: token, mode: "insensitive" } },
      { category: { name: { contains: token, mode: "insensitive" } } },
      { purpose: { name: { contains: token, mode: "insensitive" } } },
      {
        tags: {
          some: { tag: { name: { contains: token, mode: "insensitive" } } },
        },
      },
    ],
  }));

  return {
    isActive: true,
    ...(params.category ? { categoryId: params.category } : {}),
    ...(params.purpose ? { purposeId: params.purpose } : {}),
    ...(params.tool ? { tool: params.tool } : {}),
    ...(params.favorites ? { isFavorite: true } : {}),
    ...(params.tag
      ? { tags: { some: { tag: { slug: params.tag } } } }
      : {}),
    ...(tokenFilters.length > 0 ? { AND: tokenFilters } : {}),
  };
}

export function buildPromptOrderBy(
  sort: AiPromptSort
): Prisma.AiPromptOrderByWithRelationInput[] {
  switch (sort) {
    case "oldest":
      return [{ createdAt: "asc" }];
    case "used":
      return [{ usageCount: "desc" }, { createdAt: "desc" }];
    case "alpha":
      return [{ title: "asc" }];
    case "favorites":
      return [{ isFavorite: "desc" }, { createdAt: "desc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export function promptListSkip(page: number): number {
  return (page - 1) * ADMIN_PROMPTS_PAGE_SIZE;
}

export const AI_PROMPT_SELECT = {
  id: true,
  title: true,
  description: true,
  content: true,
  tool: true,
  language: true,
  variables: true,
  isFavorite: true,
  isActive: true,
  usageCount: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  purposeId: true,
  category: { select: { id: true, name: true, slug: true } },
  purpose: { select: { id: true, name: true, slug: true } },
  tags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;
