import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  // Vitrine pública: seleciona APENAS campos visíveis ao cliente.
  // productCode (SKU interno) fica de fora de propósito.
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      products: {
        where: { isAvailable: true, isDeleted: false },
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
        },
      },
    },
  });

  // Mantém no catálogo apenas categorias que tenham ao menos um produto.
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
              AllAtiva Joias
            </h1>
            <p className="max-w-xl text-base text-slate-500">
              Peças exclusivas pensadas com precisão e elegância. Explore o
              catálogo e descubra joias que celebram cada momento.
            </p>
          </div>
        </section>

        {/* Seções por categoria */}
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
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                  {category.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
