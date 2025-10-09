/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the column `ranking` on the `Player` table. All the data in the column will be lost.
  - You are about to drop the `Match` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MatchPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `address` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactNumber` to the `Player` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "public"."AgeBracket" AS ENUM ('A18', 'A35', 'A55', 'JUNIOR');

-- CreateEnum
CREATE TYPE "public"."Division" AS ENUM ('MS', 'MD', 'WS', 'WD', 'XD');

-- CreateEnum
CREATE TYPE "public"."Level" AS ENUM ('NOV', 'INT', 'ADV', 'OPN');

-- DropForeignKey
ALTER TABLE "public"."MatchPlayer" DROP CONSTRAINT "MatchPlayer_matchId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MatchPlayer" DROP CONSTRAINT "MatchPlayer_playerId_fkey";

-- AlterTable
ALTER TABLE "public"."Player" DROP COLUMN "avatarUrl",
DROP COLUMN "ranking",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "contactNumber" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gender" "public"."Gender" NOT NULL;

-- DropTable
DROP TABLE "public"."Match";

-- DropTable
DROP TABLE "public"."MatchPlayer";

-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "ageBracket" "public"."AgeBracket" NOT NULL,
    "division" "public"."Division" NOT NULL,
    "level" "public"."Level" NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "teamCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "slot" INTEGER,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_ageBracket_division_level_key" ON "public"."Category"("ageBracket", "division", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Team_teamCode_key" ON "public"."Team"("teamCode");

-- CreateIndex
CREATE INDEX "Team_categoryId_ordinal_idx" ON "public"."Team"("categoryId", "ordinal");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "public"."TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_playerId_idx" ON "public"."TeamMember"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_playerId_key" ON "public"."TeamMember"("teamId", "playerId");

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "public"."Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
