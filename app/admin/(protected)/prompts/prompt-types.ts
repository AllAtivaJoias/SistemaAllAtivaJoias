import type { AiPromptSort } from "@/lib/ai-prompt";

export type TaxonomyOption = {
  id: string;
  name: string;
  slug: string;
};

export type PromptCardModel = {
  id: string;
  title: string;
  description: string;
  content: string;
  tool: string;
  language: string;
  variables: string[];
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  category: TaxonomyOption;
  purpose: TaxonomyOption;
  tags: TaxonomyOption[];
};

export type PromptListQuery = {
  q: string;
  category: string | null;
  purpose: string | null;
  tool: string | null;
  tag: string | null;
  favorites: boolean;
  sort: AiPromptSort;
  page: number;
};

export type PromptToast = { type: "success" | "error"; message: string } | null;
