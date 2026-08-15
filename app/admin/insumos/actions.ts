"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { writeAuditLog } from "@/lib/audit";

export type InsumoActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

function revalidateAll() {
  revalidatePath("/admin/insumos");
  revalidatePath("/admin/ficha-tecnica");
}

function auditInsumo(
  userId: string,
  action: string,
  entity: string,
  entityId: string | null,
  after?: unknown
) {
  void writeAuditLog({ userId, action, entity, entityId, after });
}

const optionalNumber = z
  .number()
  .nonnegative()
  .nullable()
  .optional()
  .transform((v) => (v === undefined ? null : v));

const requiredNumber = z.number().nonnegative();

const stoneSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da pedra."),
  cut: z.string().trim().min(1).default("brilhante"),
  color: z.string().trim().min(1).default("branco"),
  sizeMm: optionalNumber,
  weightCt: requiredNumber,
  unitPrice: requiredNumber,
});

const chainSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da corrente."),
  mesh: z.string().trim().min(1).default("veneziana"),
  material: z.string().trim().min(1).default("Ouro 18k"),
  thicknessMm: optionalNumber,
  weightPerCm: optionalNumber,
  pricePerCm: requiredNumber,
});

const wireSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome do fio/chapa."),
  alloyId: z.string().min(1, "Selecione a liga base."),
  profile: z.string().trim().min(1).default("redondo"),
  gauge: requiredNumber,
  widthMm: optionalNumber,
  weightPerCm: optionalNumber,
});

const alloySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Informe o nome da liga."),
  purity: z.number().min(0).max(1),
  pureMetalName: z.string().trim().min(1).default("Ouro 24k"),
  pureMetalPricePerG: requiredNumber,
  alloyMetalName: z.string().trim().min(1).default("Pré-liga (Prata/Cobre)"),
  alloyMetalPricePerG: requiredNumber,
  pricePerGram: requiredNumber,
});

function zodError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Dados inválidos. Verifique o formulário.";
}

// ─────────────────────────────────────────────────────────────
// Pedras
// ─────────────────────────────────────────────────────────────

export async function saveStone(
  input: unknown
): Promise<InsumoActionState> {
  const session = await requireAdmin();

  const parsed = stoneSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.stone.update({ where: { id }, data });
      auditInsumo(session.user.id, "STONE_UPDATE", "Stone", id, {
        name: data.name,
        unitPrice: data.unitPrice,
      });
      revalidateAll();
      return { success: true, message: "Pedra atualizada com sucesso." };
    }
    const created = await prisma.stone.create({ data });
    auditInsumo(session.user.id, "STONE_CREATE", "Stone", created.id, {
      name: data.name,
      unitPrice: data.unitPrice,
    });
    revalidateAll();
    return { success: true, message: "Pedra cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a pedra."
        : "Não foi possível cadastrar a pedra.",
    };
  }
}

export async function deleteStone(id: string): Promise<InsumoActionState> {
  const session = await requireAdmin();
  if (!id) return { error: "Pedra inválida." };
  try {
    await prisma.stone.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a pedra." };
  }
  auditInsumo(session.user.id, "STONE_DELETE", "Stone", id);
  revalidateAll();
  return { success: true, message: "Pedra excluída." };
}

// ─────────────────────────────────────────────────────────────
// Correntes
// ─────────────────────────────────────────────────────────────

export async function saveChain(
  input: unknown
): Promise<InsumoActionState> {
  const session = await requireAdmin();

  const parsed = chainSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.chain.update({ where: { id }, data });
      auditInsumo(session.user.id, "CHAIN_UPDATE", "Chain", id, {
        name: data.name,
        pricePerCm: data.pricePerCm,
      });
      revalidateAll();
      return { success: true, message: "Corrente atualizada com sucesso." };
    }
    const created = await prisma.chain.create({ data });
    auditInsumo(session.user.id, "CHAIN_CREATE", "Chain", created.id, {
      name: data.name,
      pricePerCm: data.pricePerCm,
    });
    revalidateAll();
    return { success: true, message: "Corrente cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a corrente."
        : "Não foi possível cadastrar a corrente.",
    };
  }
}

export async function deleteChain(id: string): Promise<InsumoActionState> {
  const session = await requireAdmin();
  if (!id) return { error: "Corrente inválida." };
  try {
    await prisma.chain.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a corrente." };
  }
  auditInsumo(session.user.id, "CHAIN_DELETE", "Chain", id);
  revalidateAll();
  return { success: true, message: "Corrente excluída." };
}

// ─────────────────────────────────────────────────────────────
// Fios / chapas
// ─────────────────────────────────────────────────────────────

export async function saveWire(input: unknown): Promise<InsumoActionState> {
  const session = await requireAdmin();

  const parsed = wireSchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, alloyId, ...rest } = parsed.data;

  const alloy = await prisma.metalAlloy.findUnique({
    where: { id: alloyId },
    select: { id: true, name: true, pricePerGram: true },
  });
  if (!alloy) {
    return { error: "Liga base não encontrada. Cadastre a liga primeiro." };
  }

  const weightPerCm = rest.weightPerCm ?? 0;
  const pricePerCm = weightPerCm * Number(alloy.pricePerGram);

  const data = {
    name: rest.name,
    profile: rest.profile,
    gauge: rest.gauge,
    widthMm: rest.widthMm,
    weightPerCm: rest.weightPerCm,
    alloyId: alloy.id,
    material: alloy.name,
    pricePerCm,
  };

  try {
    if (id) {
      await prisma.wire.update({ where: { id }, data });
      auditInsumo(session.user.id, "WIRE_UPDATE", "Wire", id, {
        name: data.name,
        pricePerCm: data.pricePerCm,
      });
      revalidateAll();
      return { success: true, message: "Fio/chapa atualizado com sucesso." };
    }
    const created = await prisma.wire.create({ data });
    auditInsumo(session.user.id, "WIRE_CREATE", "Wire", created.id, {
      name: data.name,
      pricePerCm: data.pricePerCm,
    });
    revalidateAll();
    return { success: true, message: "Fio/chapa cadastrado com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar o fio/chapa."
        : "Não foi possível cadastrar o fio/chapa.",
    };
  }
}

export async function deleteWire(id: string): Promise<InsumoActionState> {
  const session = await requireAdmin();
  if (!id) return { error: "Fio/chapa inválido." };
  try {
    await prisma.wire.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir o fio/chapa." };
  }
  auditInsumo(session.user.id, "WIRE_DELETE", "Wire", id);
  revalidateAll();
  return { success: true, message: "Fio/chapa excluído." };
}

// ─────────────────────────────────────────────────────────────
// Ligas
// ─────────────────────────────────────────────────────────────

export async function saveAlloy(
  input: unknown
): Promise<InsumoActionState> {
  const session = await requireAdmin();

  const parsed = alloySchema.safeParse(input);
  if (!parsed.success) return { error: zodError(parsed.error) };

  const { id, ...data } = parsed.data;

  try {
    if (id) {
      await prisma.$transaction(async (tx) => {
        await tx.metalAlloy.update({ where: { id }, data });
        // Propaga preço/nome da liga para os fios vinculados (herança).
        const linked = await tx.wire.findMany({
          where: { alloyId: id },
          select: { id: true, weightPerCm: true },
        });
        for (const wire of linked) {
          await tx.wire.update({
            where: { id: wire.id },
            data: {
              material: data.name,
              pricePerCm: Number(wire.weightPerCm ?? 0) * data.pricePerGram,
            },
          });
        }
      });
      auditInsumo(session.user.id, "ALLOY_UPDATE", "MetalAlloy", id, {
        name: data.name,
        pricePerGram: data.pricePerGram,
      });
      revalidateAll();
      return { success: true, message: "Liga atualizada com sucesso." };
    }
    const created = await prisma.metalAlloy.create({ data });
    auditInsumo(session.user.id, "ALLOY_CREATE", "MetalAlloy", created.id, {
      name: data.name,
      pricePerGram: data.pricePerGram,
    });
    revalidateAll();
    return { success: true, message: "Liga cadastrada com sucesso." };
  } catch {
    return {
      error: id
        ? "Não foi possível atualizar a liga."
        : "Não foi possível cadastrar a liga.",
    };
  }
}

export async function deleteAlloy(id: string): Promise<InsumoActionState> {
  const session = await requireAdmin();
  if (!id) return { error: "Liga inválida." };
  try {
    await prisma.metalAlloy.delete({ where: { id } });
  } catch {
    return { error: "Não foi possível excluir a liga." };
  }
  auditInsumo(session.user.id, "ALLOY_DELETE", "MetalAlloy", id);
  revalidateAll();
  return { success: true, message: "Liga excluída." };
}
