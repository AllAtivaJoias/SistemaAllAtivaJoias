import { NextResponse } from "next/server";

import { requireAdmin, AuthError } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { seedStonesLibrary } from "@/prisma/stones-library";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  try {
    await requireAdmin();
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 401;
    return NextResponse.json({ error: "Não autorizado." }, { status });
  }

  try {
    const result = await seedStonesLibrary(prisma);

    if (result.status === "blocked") {
      return NextResponse.json(
        {
          error:
            "Ação bloqueada: Existem pedras cadastradas. O catálogo não pode ser populado novamente.",
          existingCount: result.existingCount,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      insertedCount: result.insertedCount,
      message: `${result.insertedCount} pedras inseridas com sucesso.`,
    });
  } catch (error) {
    logger.error("seed_stones.failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "Não foi possível popular o catálogo de pedras." },
      { status: 500 }
    );
  }
}
