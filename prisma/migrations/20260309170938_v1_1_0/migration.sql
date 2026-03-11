/*
  Warnings:

  - You are about to drop the column `label` on the `Tag` table. All the data in the column will be lost.
  - You are about to drop the column `work_id` on the `Tag` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[content]` on the table `Tag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'ExtractNovel';

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_work_id_fkey";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "label",
DROP COLUMN "work_id",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "cover_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "WorkTags" (
    "id" SERIAL NOT NULL,
    "work_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkTags_work_id_tag_id_key" ON "WorkTags"("work_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_content_key" ON "Tag"("content");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTags" ADD CONSTRAINT "WorkTags_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "Work"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTags" ADD CONSTRAINT "WorkTags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
