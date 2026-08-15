/**
 * Seed isolado da biblioteca de Zircônias (Estrela/Redonda/Quadrada).
 * Uso: npm run db:seed:stones
 * Idempotente: não duplica registros já existentes.
 */
import { PrismaClient } from "@prisma/client";

import { seedStonesLibrary } from "./stones-library";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const result = await seedStonesLibrary(prisma);
  console.log(
    `💎 Catálogo: ${result.insertedCount} inseridas, ${result.skippedCount} já existiam (esperado ${result.catalogSize}).`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erro ao executar o seed de pedras:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
