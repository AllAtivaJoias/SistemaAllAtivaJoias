import { Plus } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "./category-form-dialog";
import { CategoriesBoard } from "./categories-board";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      order: true,
      _count: {
        select: { products: { where: { isDeleted: false } } },
      },
    },
  });

  const items = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    order: category.order,
    productCount: category._count.products,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-stone-800">
            Categorias
          </h1>
          <p className="mt-1 text-stone-500">
            Organize as seções do catálogo. Arraste para reordenar.
          </p>
        </div>

        <CategoryFormDialog
          trigger={
            <Button className="bg-brand-600 text-white hover:bg-brand-700">
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          }
        />
      </div>

      <CategoriesBoard categories={items} />
    </div>
  );
}
