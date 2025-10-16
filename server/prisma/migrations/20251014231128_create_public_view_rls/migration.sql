-- DropForeignKey
ALTER TABLE "public"."Bracket" DROP CONSTRAINT "Bracket_categoryId_fkey";

-- AlterTable
ALTER TABLE "Bracket" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Bracket" ADD CONSTRAINT "Bracket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
