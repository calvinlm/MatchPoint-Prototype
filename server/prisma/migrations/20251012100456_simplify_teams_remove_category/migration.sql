/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `ordinal` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `teamCode` on the `Team` table. All the data in the column will be lost.
  - The primary key for the `TeamMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TeamMember` table. All the data in the column will be lost.
  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,slot]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `age` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `division` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Team" DROP CONSTRAINT "Team_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_playerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropIndex
DROP INDEX "public"."Team_categoryId_ordinal_idx";

-- DropIndex
DROP INDEX "public"."Team_teamCode_key";

-- DropIndex
DROP INDEX "public"."TeamMember_teamId_idx";

-- DropIndex
DROP INDEX "public"."TeamMember_teamId_playerId_key";

-- AlterTable
ALTER TABLE "public"."Team" DROP COLUMN "categoryId",
DROP COLUMN "ordinal",
DROP COLUMN "teamCode",
ADD COLUMN     "age" "public"."AgeBracket" NOT NULL,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "division" "public"."Division" NOT NULL,
ADD COLUMN     "level" "public"."Level" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("teamId", "playerId");

-- DropTable
DROP TABLE "public"."Category";

-- CreateIndex
CREATE UNIQUE INDEX "Team_code_key" ON "public"."Team"("code");

-- CreateIndex
CREATE INDEX "Team_age_division_level_idx" ON "public"."Team"("age", "division", "level");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_slot_key" ON "public"."TeamMember"("teamId", "slot");

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
