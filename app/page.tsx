import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/store-settings";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ProductCard";
import { asClient } from "@/lib/decimal";

export const dynamic = "force-dynamic";

/** Máximo de destaques exibidos por categoria na vitrine. */
const FEATURED_LIMIT = 4;

export default async function Home() {
  // Vitrine editorial: cada categoria mostra até 4 produtos em destaque.
  // Uma única consulta (categorias + destaques aninhados) evita N+1.
  const [settings, categories] = await Promise.all([
    getStoreSettings(),
    prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        products: {
          where: { isFeatured: true, isAvailable: true, isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: FEATURED_LIMIT,
          select: {
            id: true,
            title: true,
            description: true,
            imageUrl: true,
            price: true,
          },
        },
      },
    }),
  ]);

  // Só exibe categorias que tenham ao menos um destaque.
  const visibleCategories = categories.filter(
    (category) => category.products.length > 0
  );

  const headerCategories = visibleCategories.map((category) => ({
    id: category.slug,
    label: category.name,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header categories={headerCategories} />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-slate-200 bg-white">
          <div className="container flex flex-col items-center gap-4 py-16 text-center">
            <span className="rounded-sm bg-brand-100 px-4 py-1 text-sm font-medium tracking-wide text-brand-700">
              Joalheria de Alto Padrão
            </span>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {settings.heroTitle}
            </h1>
            <p className="max-w-xl text-base text-slate-500">
              {settings.heroSubtitle}
            </p>
          </div>
        </section>

        {/* Seções por categoria (apenas destaques) */}
        <div className="container py-12">
          {visibleCategories.length === 0 ? (
            <p className="py-20 text-center text-slate-500">
              O catálogo está sendo atualizado. Volte em breve!
            </p>
          ) : (
            visibleCategories.map((category) => (
              <section
                key={category.id}
                id={category.slug}
                className="scroll-mt-20 py-10"
              >
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="font-serif text-3xl font-semibold text-slate-900">
                    {category.name}
                  </h2>
                  <span className="h-px flex-1 bg-slate-200" />
                  <Link
                    href={`/categoria/${category.slug}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 transition-colors hover:text-brand-800"
                  >
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={asClient(product)} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer tagline={settings.footerText} />
    </div>
  );
}
