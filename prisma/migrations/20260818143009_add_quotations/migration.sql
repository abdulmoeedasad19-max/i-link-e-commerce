-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESPONDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PreferredContact" AS ENUM ('EMAIL', 'PHONE');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "preferredContact" "PreferredContact",
    "additionalRequirements" TEXT,
    "message" TEXT NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quotation_userId_idx" ON "Quotation"("userId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
