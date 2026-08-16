import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { getAppSettings } from "@/lib/app-settings-query";
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
  const [{ slug }, appSettings] = await Promise.all([params, getAppSettings()]);
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });
  const brand = appSettings.storeName.trim() || "AllAtiva Joias";

  if (!category) {
    return { title: `Categoria não encontrada | ${brand}` };
  }

  return {
    title: `${category.name} | ${brand}`,
    description:
      appSettings.brandTagline.trim() ||
      `Explore as peças da categoria ${category.name} em ${brand}.`,
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

  const [total, categories, settings, appSettings, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, name: true },
    }),
    getStoreSettings(),
    getAppSettings(),
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header
        categories={headerCategories}
        storeName={appSettings.storeName}
        logoUrl={appSettings.logoUrl || undefined}
      />

      <main className="flex-1">
        <section className="border-b border-border bg-card">
          <div className="container flex flex-col gap-3 py-10">
            <nav className="text-sm text-muted-foreground" aria-label="Trilha de navegação">
              <Link href="/" className="hover:text-link">
                Início
              </Link>
              <span className="mx-2 text-border">/</span>
              <span className="text-foreground">{category.name}</span>
            </nav>
            <h1 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {category.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {total === 0
                ? "Nenhuma peça disponível nesta categoria no momento."
                : `${total} ${total === 1 ? "peça disponível" : "peças disponíveis"}.`}
            </p>
          </div>
        </section>

        <div className="container py-10">
          {products.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Nenhuma peça encontrada nesta página.</p>
              {page > 1 && (
                <Link
                  href={`/categoria/${category.slug}`}
                  className="mt-3 inline-block font-medium text-link hover:text-link-hover hover:underline"
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

                  <span className="text-sm text-muted-foreground">
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
      ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
      : "border-border bg-card text-foreground hover:border-primary/40 hover:text-link"
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
