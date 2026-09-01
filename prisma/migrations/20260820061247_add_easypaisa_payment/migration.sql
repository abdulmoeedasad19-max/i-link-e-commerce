-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'EASYPAISA';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT;

-- AlterTable
ALTER TABLE "StoreSettings" ADD COLUMN     "easypaisaAccountName" TEXT,
ADD COLUMN     "easypaisaInstructions" TEXT,
ADD COLUMN     "easypaisaNumber" TEXT,
ADD COLUMN     "easypaisaQrCode" TEXT;
