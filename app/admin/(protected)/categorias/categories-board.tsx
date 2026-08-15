"use client";

import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Pencil } from "lucide-react";

import {
  deleteCategory,
  reorderCategories,
} from "@/app/admin/categorias/actions";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import { CategoryFormDialog } from "./category-form-dialog";

export interface CategoryBoardItem {
  id: string;
  name: string;
  slug: string;
  order: number;
  productCount: number;
}

interface CategoriesBoardProps {
  categories: CategoryBoardItem[];
}

export function CategoriesBoard({ categories }: CategoriesBoardProps) {
  const [items, setItems] = useState(categories);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sincroniza quando o servidor revalida (ex.: criar/editar/excluir categoria).
  useEffect(() => {
    setItems(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Evita que um clique em Editar/Excluir seja interpretado como arraste.
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered); // otimista
    setError(null);

    startTransition(async () => {
      const result = await reorderCategories(reordered.map((item) => item.id));
      if (result?.error) {
        setItems(previous); // reverte
        setError(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-stone-200 bg-white p-10 text-center text-stone-500 shadow-sm">
        Nenhuma categoria cadastrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          Arraste pela alça para reordenar. A ordem define a exibição na vitrine.
        </p>
        {isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs text-stone-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Salvando ordem...
          </span>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-md border border-stone-200 bg-white shadow-sm">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 border-b border-stone-200 bg-stone-50/70 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-stone-500">
          <span className="w-6" aria-hidden />
          <span>Nome</span>
          <span>Slug</span>
          <span className="text-center">Produtos</span>
          <span className="text-right">Ações</span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {items.map((item) => (
                <SortableCategoryRow key={item.id} item={item} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableCategoryRow({ item }: { item: CategoryBoardItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 border-b border-stone-100 px-4 py-3 last:border-b-0 ${
        isDragging ? "relative z-10 bg-brand-50 shadow-md" : "bg-white"
      }`}
    >
      <button
        type="button"
        className="flex h-8 w-6 cursor-grab touch-none items-center justify-center rounded text-stone-400 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:cursor-grabbing"
        aria-label={`Reordenar ${item.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="truncate font-medium text-stone-800">{item.name}</span>

      <span className="truncate text-stone-500">
        <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs">
          {item.slug}
        </code>
      </span>

      <span className="text-center text-stone-600">{item.productCount}</span>

      <div className="flex items-center justify-end gap-1">
        <CategoryFormDialog
          category={{ id: item.id, name: item.name }}
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Editar ${item.name}`}>
              <Pencil className="h-4 w-4" />
            </Button>
          }
        />
        <DeleteConfirmDialog
          title="Excluir categoria"
          description={`Tem certeza que deseja excluir "${item.name}"? Os produtos dessa categoria permanecerão cadastrados, apenas sem categoria.`}
          onConfirm={deleteCategory.bind(null, item.id)}
        />
      </div>
    </li>
  );
}
