-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 0;

update "Chapter" set "priority"="no"*10 where priority=0;