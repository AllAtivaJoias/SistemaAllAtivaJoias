"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export type ProductActionState = {
  error?: string;
  success?: boolean;
};

export type ToggleFeaturedState = {
  error?: string;
  success?: boolean;
  isFeatured?: boolean;
};

/** Máximo de produtos em destaque por categoria na vitrine. */
const MAX_FEATURED_PER_CATEGORY = 4;

function revalidateAll() {
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/pedidos/novo");
  revalidatePath("/");
  revalidateTag("dashboard");
}

function parsePrice(value: FormDataEntryValue | null): number {
  // Aceita "12", "12.5" ou "12,50".
  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");
  return Number(normalized);
}

/** Código interno (Ref / SKU): opcional, único quando informado. */
const productCodeSchema = z
  .string()
  .trim()
  .max(64, "Código do produto muito longo (máx. 64 caracteres).")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const productFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do produto."),
  description: z.string().trim(),
  imageUrl: z.string().trim(),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  price: z.number().finite().min(0, "Informe um preço válido."),
  costPrice: z.number().finite().min(0, "Informe um custo válido."),
  isAvailable: z.boolean(),
  productCode: productCodeSchema,
});

function parseProductForm(formData: FormData) {
  return productFormSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    price: parsePrice(formData.get("price")),
    costPrice: parsePrice(formData.get("costPrice")),
    isAvailable: formData.get("isAvailable") === "on",
    productCode: String(formData.get("productCode") ?? ""),
  });
}

function uniqueCodeError(error: unknown): string | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return "Já existe um produto com este código (Ref / SKU).";
  }
  return null;
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const session = await requireAdmin();

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  try {
    await prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl:
          data.imageUrl ||
          "https://placehold.co/800x800/034742/ffffff?text=AllAtiva",
        price: data.price,
        costPrice: data.costPrice,
        isAvailable: data.isAvailable,
        productCode: data.productCode,
        categoryId: data.categoryId,
      },
    });
  } catch (error) {
    return {
      error: uniqueCodeError(error) ?? "Não foi possível criar o produto.",
    };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "PRODUCT_CREATE",
    entity: "Product",
    after: {
      title: data.title,
      price: data.price,
      costPrice: data.costPrice,
      productCode: data.productCode,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function updateProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const session = await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Produto inválido." };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const data = parsed.data;

  const previous = await prisma.product.findFirst({
    where: { id, isDeleted: false },
    select: {
      title: true,
      price: true,
      costPrice: true,
      isAvailable: true,
      productCode: true,
      categoryId: true,
    },
  });
  if (!previous) return { error: "Produto inválido." };

  try {
    await prisma.product.update({
      where: { id, isDeleted: false },
      data: {
        title: data.title,
        description: data.description,
        imageUrl:
          data.imageUrl ||
          "https://placehold.co/800x800/034742/ffffff?text=AllAtiva",
        price: data.price,
        costPrice: data.costPrice,
        isAvailable: data.isAvailable,
        productCode: data.productCode,
        categoryId: data.categoryId,
        version: { increment: 1 },
      },
    });
  } catch (error) {
    return {
      error: uniqueCodeError(error) ?? "Não foi possível atualizar o produto.",
    };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "PRODUCT_UPDATE",
    entity: "Product",
    entityId: id,
    before: previous,
    after: {
      title: data.title,
      price: data.price,
      costPrice: data.costPrice,
      isAvailable: data.isAvailable,
      productCode: data.productCode,
      categoryId: data.categoryId,
    },
  });

  revalidateAll();
  return { success: true };
}

/**
 * Alterna o destaque de um produto na vitrine.
 *
 * Invariante: no máximo {@link MAX_FEATURED_PER_CATEGORY} destaques por
 * categoria. A verificação count→update roda numa transação Serializable para
 * impedir que duas requisições concorrentes ultrapassem o limite (o Postgres
 * aborta uma delas com erro de serialização). Desmarcar é sempre permitido.
 */
export async function toggleProductFeatured(
  productId: string
): Promise<ToggleFeaturedState> {
  const session = await requireAdmin();

  if (!productId) return { error: "Produto inválido." };

  type ToggleOutcome =
    | { kind: "not_found" }
    | { kind: "no_category" }
    | { kind: "limit" }
    | { kind: "done"; isFeatured: boolean; categoryId: string | null };

  let outcome: ToggleOutcome;

  try {
    outcome = await prisma.$transaction(
      async (tx): Promise<ToggleOutcome> => {
        const product = await tx.product.findFirst({
          where: { id: productId, isDeleted: false },
          select: { id: true, categoryId: true, isFeatured: true },
        });
        if (!product) return { kind: "not_found" };

        // Desmarcar é sempre permitido.
        if (product.isFeatured) {
          await tx.product.update({
            where: { id: productId },
            data: { isFeatured: false, version: { increment: 1 } },
          });
          return {
            kind: "done",
            isFeatured: false,
            categoryId: product.categoryId,
          };
        }

        // Só é possível destacar produtos com categoria (vitrine é por categoria).
        if (!product.categoryId) return { kind: "no_category" };

        const featuredCount = await tx.product.count({
          where: {
            categoryId: product.categoryId,
            isFeatured: true,
            isDeleted: false,
          },
        });
        if (featuredCount >= MAX_FEATURED_PER_CATEGORY) return { kind: "limit" };

        await tx.product.update({
          where: { id: productId },
          data: { isFeatured: true, version: { increment: 1 } },
        });
        return {
          kind: "done",
          isFeatured: true,
          categoryId: product.categoryId,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    // 40001 (serialization_failure) → P2034 no Prisma: concorrência.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return {
        error: "Muitas alterações simultâneas. Tente novamente em instantes.",
      };
    }
    logger.error("product.toggle_featured_failed", {
      productId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { error: "Não foi possível atualizar o destaque." };
  }

  if (outcome.kind === "not_found") return { error: "Produto não encontrado." };
  if (outcome.kind === "no_category") {
    return {
      error: "Defina uma categoria para o produto antes de destacá-lo.",
    };
  }
  if (outcome.kind === "limit") {
    return {
      error: `Esta categoria já possui ${MAX_FEATURED_PER_CATEGORY} produtos em destaque. Remova um destaque antes de adicionar outro.`,
    };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "PRODUCT_TOGGLE_FEATURED",
    entity: "Product",
    entityId: productId,
    after: { isFeatured: outcome.isFeatured },
  });

  revalidateAll();
  if (outcome.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: outcome.categoryId },
      select: { slug: true },
    });
    if (category?.slug) revalidatePath(`/categoria/${category.slug}`);
  }

  return { success: true, isFeatured: outcome.isFeatured };
}

export async function deleteProduct(id: string): Promise<ProductActionState> {
  const session = await requireAdmin();

  if (!id) return { error: "Produto inválido." };

  try {
    // Soft delete: preserva FK em OrderItem e o histórico de vendas.
    // Zera o SKU para permitir reutilizar o código em um novo cadastro.
    await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        isAvailable: false,
        productCode: null,
        version: { increment: 1 },
      },
    });
  } catch {
    return { error: "Não foi possível excluir o produto." };
  }

  await writeAuditLog({
    userId: session.user.id,
    action: "PRODUCT_DELETE",
    entity: "Product",
    entityId: id,
  });

  revalidateAll();
  return { success: true };
}
