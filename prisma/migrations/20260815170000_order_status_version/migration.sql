-- Fase 9/10: status enumerado, cancelamento, optimistic locking.

CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus" USING ("status"::"OrderStatus");
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "orders" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "orders" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Product" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
