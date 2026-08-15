import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (error) {
    logger.error("health.db_down", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
