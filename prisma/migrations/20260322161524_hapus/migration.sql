/*
  Warnings:

  - You are about to drop the `WhatsappSession` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" INTEGER NOT NULL;

-- DropTable
DROP TABLE "WhatsappSession";

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
