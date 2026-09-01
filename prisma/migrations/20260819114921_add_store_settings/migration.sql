-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingAmount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "StoreSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "storeName" TEXT NOT NULL DEFAULT 'i.Link Systems & Solutions',
    "phone" TEXT NOT NULL DEFAULT '0331 8852808',
    "email" TEXT NOT NULL DEFAULT 'ilink.isb@gmail.com',
    "hours" TEXT NOT NULL DEFAULT 'Mon – Sat, 10:00 AM – 8:00 PM',
    "shippingCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSettings_pkey" PRIMARY KEY ("id")
);
