/*
  Warnings:

  - A unique constraint covering the columns `[matchId]` on the table `QueueItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `Bracket` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bracket" ADD COLUMN     "categoryId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "QueueItem" ADD COLUMN     "groupId" INTEGER;

-- CreateIndex
CREATE INDEX "Bracket_tournamentId_categoryId_idx" ON "Bracket"("tournamentId", "categoryId");

-- CreateIndex
CREATE INDEX "QueueItem_groupId_position_idx" ON "QueueItem"("groupId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QueueItem_matchId_key" ON "QueueItem"("matchId");

-- AddForeignKey
ALTER TABLE "Bracket" ADD CONSTRAINT "Bracket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueItem" ADD CONSTRAINT "QueueItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "BracketGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
