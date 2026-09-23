-- AlterTable
ALTER TABLE "BusinessJob" ADD COLUMN "arsivlendi" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessJob" ADD COLUMN "arsivTarihi" DATETIME;

-- CreateIndex
CREATE INDEX "BusinessJob_arsivlendi_idx" ON "BusinessJob"("arsivlendi");
