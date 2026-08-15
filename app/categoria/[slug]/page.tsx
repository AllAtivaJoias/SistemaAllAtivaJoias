import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ProductCard";
import { asClient } from "@/lib/decimal";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Produtos por página no catálogo da categoria. */
const PAGE_SIZE = 12;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!category) {
    return { title: "Categoria não encontrada | AllAtiva Joias" };
  }

  return {
    title: `${category.name} | AllAtiva Joias`,
    description: `Explore as peças da categoria ${category.name} na AllAtiva Joias — joalheria de alto padrão.`,
  };
}

function parsePage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const sp = (await searchParams) ?? {};

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });

  if (!category) notFound();

  const page = parsePage(sp.page);
  const where = {
    categoryId: category.id,
    isAvailable: true,
    isDeleted: false,
  } as const;

  const [total, categories, settings, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, name: true },
    }),
    getStoreSettings(),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const headerCategories = categories.map((c) => ({
    id: c.slug,
    label: c.name,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header categories={headerCategories} />

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="container flex flex-col gap-3 py-10">
            <nav className="text-sm text-slate-500" aria-label="Trilha de navegação">
              <Link href="/" className="hover:text-brand-700">
                Início
              </Link>
              <span className="mx-2 text-slate-300">/</span>
              <span className="text-slate-700">{category.name}</span>
            </nav>
            <h1 className="font-serif text-3xl font-semibold text-slate-900 sm:text-4xl">
              {category.name}
            </h1>
            <p className="text-sm text-slate-500">
              {total === 0
                ? "Nenhuma peça disponível nesta categoria no momento."
                : `${total} ${total === 1 ? "peça disponível" : "peças disponíveis"}.`}
            </p>
          </div>
        </section>

        <div className="container py-10">
          {products.length === 0 ? (
            <div className="py-20 text-center text-slate-500">
              <p>Nenhuma peça encontrada nesta página.</p>
              {page > 1 && (
                <Link
                  href={`/categoria/${category.slug}`}
                  className="mt-3 inline-block font-medium text-brand-700 hover:underline"
                >
                  Voltar ao início da categoria
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={asClient(product)} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-10 flex items-center justify-center gap-3"
                  aria-label="Paginação"
                >
                  <PaginationLink
                    slug={category.slug}
                    page={page - 1}
                    disabled={page <= 1}
                    ariaLabel="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </PaginationLink>

                  <span className="text-sm text-slate-600">
                    Página {page} de {totalPages}
                  </span>

                  <PaginationLink
                    slug={category.slug}
                    page={page + 1}
                    disabled={page >= totalPages}
                    ariaLabel="Próxima página"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </PaginationLink>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      <Footer tagline={settings.footerText} />
    </div>
  );
}

function PaginationLink({
  slug,
  page,
  disabled,
  ariaLabel,
  children,
}: {
  slug: string;
  page: number;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
    disabled
      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
      : "border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700"
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={page <= 1 ? `/categoria/${slug}` : `/categoria/${slug}?page=${page}`}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
}
