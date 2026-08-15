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
    const message =
      result.insertedCount === 0
        ? `Catálogo base já estava completo (${result.skippedCount} existentes).`
        : result.skippedCount === 0
          ? `${result.insertedCount} pedras inseridas com sucesso.`
          : `${result.insertedCount} pedras inseridas · ${result.skippedCount} já existiam.`;

    return NextResponse.json({
      ok: true,
      insertedCount: result.insertedCount,
      skippedCount: result.skippedCount,
      catalogSize: result.catalogSize,
      message,
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
