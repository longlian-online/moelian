-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('Normal', 'SuperAdmin');

-- CreateEnum
CREATE TYPE "public"."SerialStatus" AS ENUM ('Serializing', 'Completed');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('Disable', 'Enable');

-- CreateEnum
CREATE TYPE "public"."LengthType" AS ENUM ('Short', 'Medium', 'Long');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('Manga', 'Novel');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('Avatar', 'Cover', 'Manga', 'Novel', 'ExtractManga');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "username" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar_id" INTEGER,
    "status" "public"."Status" NOT NULL DEFAULT 'Disable',
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Work" (
    "id" SERIAL NOT NULL,
    "biz_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type_id" INTEGER,
    "content_type" "public"."ContentType" NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Disable',
    "serial_status" "public"."SerialStatus" NOT NULL DEFAULT 'Serializing',
    "length_type" "public"."LengthType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "creator_id" INTEGER,
    "cover_id" INTEGER,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkType" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "WorkType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" SERIAL NOT NULL,
    "label" TEXT NOT NULL,
    "work_id" INTEGER,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chapter" (
    "id" SERIAL NOT NULL,
    "biz_no" TEXT NOT NULL,
    "work_id" INTEGER NOT NULL,
    "no" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "total_page" INTEGER,
    "product_id" INTEGER,
    "content_type" "public"."ContentType" NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Disable',
    "uploader_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "content_id" INTEGER,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resource" (
    "id" SERIAL NOT NULL,
    "type" "public"."ResourceType" NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Disable',

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeadMessage" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" TEXT NOT NULL,

    CONSTRAINT "DeadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_avatar_id_key" ON "public"."User"("avatar_id");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Work_biz_no_key" ON "public"."Work"("biz_no");

-- CreateIndex
CREATE UNIQUE INDEX "Work_cover_id_key" ON "public"."Work"("cover_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_biz_no_key" ON "public"."Chapter"("biz_no");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_product_id_key" ON "public"."Chapter"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_content_id_key" ON "public"."Chapter"("content_id");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."WorkType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Work" ADD CONSTRAINT "Work_cover_id_fkey" FOREIGN KEY ("cover_id") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tag" ADD CONSTRAINT "Tag_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "public"."Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_work_id_fkey" FOREIGN KEY ("work_id") REFERENCES "public"."Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "product_pk" FOREIGN KEY ("product_id") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "content_pk" FOREIGN KEY ("content_id") REFERENCES "public"."Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
