import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { ADMIN_PROMPTS_PAGE_SIZE } from "@/lib/list-limits";
import {
  AI_PROMPT_SELECT,
  buildPromptOrderBy,
  buildPromptWhere,
  parsePromptListParams,
  promptListSkip,
} from "@/lib/ai-prompt";
import { PromptsLibrary } from "./prompts-library";
import type { PromptCardModel, TaxonomyOption } from "./prompt-types";

export const dynamic = "force-dynamic";

interface PromptsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function serializePrompt(row: {
  id: string;
  title: string;
  description: string;
  content: string;
  tool: string;
  language: string;
  variables: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: Date;
  category: TaxonomyOption;
  purpose: TaxonomyOption;
  tags: { tag: TaxonomyOption }[];
}): PromptCardModel {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    tool: row.tool,
    language: row.language,
    variables: row.variables,
    isFavorite: row.isFavorite,
    usageCount: row.usageCount,
    createdAt: row.createdAt.toISOString(),
    category: row.category,
    purpose: row.purpose,
    tags: row.tags.map((item) => item.tag),
  };
}

async function loadPrompts(params: ReturnType<typeof parsePromptListParams>) {
  const where = buildPromptWhere(params);
  const [items, total] = await Promise.all([
    prisma.aiPrompt.findMany({
      where,
      orderBy: buildPromptOrderBy(params.sort),
      skip: promptListSkip(params.page),
      take: ADMIN_PROMPTS_PAGE_SIZE,
      select: AI_PROMPT_SELECT,
    }),
    prisma.aiPrompt.count({ where }),
  ]);
  return { items, total };
}

export default async function BibliotecaPromptsPage({
  searchParams,
}: PromptsPageProps) {
  const raw = (await searchParams) ?? {};
  const query = parsePromptListParams(raw);

  let prompts: PromptCardModel[] = [];
  let total = 0;
  let categories: TaxonomyOption[] = [];
  let purposes: TaxonomyOption[] = [];
  let tags: TaxonomyOption[] = [];
  let loadError: string | null = null;

  try {
    const [list, categoryRows, purposeRows, tagRows] = await Promise.all([
      loadPrompts(query),
      prisma.aiPromptCategory.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.aiPromptPurpose.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, name: true, slug: true },
      }),
      prisma.aiPromptTag.findMany({
        orderBy: { name: "asc" },
        take: 80,
        select: { id: true, name: true, slug: true },
      }),
    ]);
    prompts = list.items.map(serializePrompt);
    total = list.total;
    categories = categoryRows;
    purposes = purposeRows;
    tags = tagRows.map((tag) => ({
      id: tag.slug,
      name: tag.name,
      slug: tag.slug,
    }));
  } catch (error) {
    logger.error("ai_prompt.list_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    loadError =
      "Não foi possível carregar a biblioteca. Verifique se o banco de dados está atualizado.";
  }

  const hasFilters = Boolean(
    query.q ||
      query.category ||
      query.purpose ||
      query.tool ||
      query.tag ||
      query.favorites
  );

  return (
    <div className="space-y-4">
      {loadError && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {loadError}
        </p>
      )}
      <PromptsLibrary
        prompts={prompts}
        total={total}
        query={query}
        categories={categories}
        purposes={purposes}
        tags={tags}
        hasFilters={hasFilters}
      />
    </div>
  );
}
