"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";

export type CategoryActionState = {
  error?: string;
  success?: boolean;
};

function revalidateAll() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/produtos");
  revalidatePath("/");
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Informe o nome da categoria." };
  }

  try {
    // Nova categoria entra no fim da ordem (a reordenação é feita por drag & drop).
    const last = await prisma.category.aggregate({ _max: { order: true } });
    const nextOrder = (last._max.order ?? -1) + 1;

    await prisma.category.create({
      data: {
        name,
        slug: slugify(name),
        order: nextOrder,
      },
    });
  } catch {
    return { error: "Já existe uma categoria com esse nome/slug." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CATEGORY_CREATE",
    entity: "Category",
    after: { name },
  });

  revalidateAll();
  return { success: true };
}

export async function updateCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id) return { error: "Categoria inválida." };
  if (!name) return { error: "Informe o nome da categoria." };

  try {
    // A ordem é gerenciada por drag & drop (reorderCategories), não aqui.
    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug: slugify(name),
      },
    });
  } catch {
    return { error: "Não foi possível atualizar a categoria." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CATEGORY_UPDATE",
    entity: "Category",
    entityId: id,
    after: { name },
  });

  revalidateAll();
  return { success: true };
}

/**
 * Reordena categorias a partir da lista de IDs na nova ordem (primeira = 0).
 * O servidor é a fonte da verdade: valida payload, duplicatas, IDs inexistentes
 * e divergência com o estado atual antes de aplicar de forma transacional.
 */
export async function reorderCategories(
  orderedIds: string[]
): Promise<CategoryActionState> {
  const session = await requireAdmin();

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: "Lista de categorias inválida." };
  }

  const ids = orderedIds.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0
  );

  if (ids.length !== orderedIds.length) {
    return { error: "Lista de categorias inválida." };
  }

  if (new Set(ids).size !== ids.length) {
    return { error: "A lista contém categorias repetidas." };
  }

  const existing = await prisma.category.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((category) => category.id));

  // A lista precisa corresponder exatamente ao conjunto atual de categorias.
  if (ids.length !== existing.length || ids.some((id) => !existingIds.has(id))) {
    return {
      error:
        "A lista não corresponde às categorias atuais. Recarregue a página e tente novamente.",
    };
  }

  try {
    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.category.update({ where: { id }, data: { order: index } })
      )
    );
  } catch {
    return { error: "Não foi possível salvar a nova ordem." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CATEGORY_REORDER",
    entity: "Category",
    after: { order: ids },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteCategory(id: string): Promise<CategoryActionState> {
  const session = await requireAdmin();

  if (!id) return { error: "Categoria inválida." };

  try {
    // onDelete: SetNull — produtos vinculados ficam sem categoria (não são apagados).
    await prisma.category.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a categoria." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "CATEGORY_DELETE",
    entity: "Category",
    entityId: id,
  });

  revalidateAll();
  return { success: true };
}
