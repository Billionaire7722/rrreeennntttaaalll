/*
  Warnings:

  - The values [ADMIN,GUEST] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image_url_8` on the `House` table. All the data in the column will be lost.
  - You are about to drop the column `adminId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `HouseAdmin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ViewerAdminAssignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
-- Normalize legacy role values before narrowing enum variants.
UPDATE "User" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'USER' WHERE "role" = 'GUEST';
UPDATE "Message" SET "senderRole" = 'SUPER_ADMIN' WHERE "senderRole" = 'ADMIN';
UPDATE "Message" SET "senderRole" = 'USER' WHERE "senderRole" = 'GUEST';
UPDATE "Message" SET "seen_by_role" = 'SUPER_ADMIN' WHERE "seen_by_role" = 'ADMIN';
UPDATE "Message" SET "seen_by_role" = 'USER' WHERE "seen_by_role" = 'GUEST';

CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'USER');
ALTER TABLE "public"."Message" ALTER COLUMN "senderRole" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Message" ALTER COLUMN "senderRole" TYPE "Role_new" USING ("senderRole"::text::"Role_new");
ALTER TABLE "Message" ALTER COLUMN "seen_by_role" TYPE "Role_new" USING ("seen_by_role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "Message" ALTER COLUMN "senderRole" SET DEFAULT 'USER';
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "HouseAdmin" DROP CONSTRAINT "HouseAdmin_adminId_fkey";

-- DropForeignKey
ALTER TABLE "HouseAdmin" DROP CONSTRAINT "HouseAdmin_houseId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_adminId_fkey";

-- DropForeignKey
ALTER TABLE "ViewerAdminAssignment" DROP CONSTRAINT "ViewerAdminAssignment_adminId_fkey";

-- DropForeignKey
ALTER TABLE "ViewerAdminAssignment" DROP CONSTRAINT "ViewerAdminAssignment_viewerId_fkey";

-- DropIndex
DROP INDEX "Message_adminId_idx";

-- AlterTable
ALTER TABLE "House" DROP COLUMN "image_url_8";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "adminId",
ADD COLUMN     "receiverId" TEXT,
ADD COLUMN     "ticketId" TEXT;

-- DropTable
DROP TABLE "HouseAdmin";

-- DropTable
DROP TABLE "ViewerAdminAssignment";

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_risk_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suspicious_ips" (
    "id" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "affectedUsers" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNBLOCKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suspicious_ips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_risk_scores_userId_key" ON "user_risk_scores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "suspicious_ips_ipAddress_key" ON "suspicious_ips"("ipAddress");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyReport" ADD CONSTRAINT "PropertyReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyReport" ADD CONSTRAINT "PropertyReport_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_risk_scores" ADD CONSTRAINT "user_risk_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
