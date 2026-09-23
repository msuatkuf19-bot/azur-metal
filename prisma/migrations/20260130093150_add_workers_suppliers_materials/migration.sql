-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN "entity" TEXT;

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "roleType" TEXT NOT NULL DEFAULT 'USTA',
    "hourlyRateDefault" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "taxNo" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'adet',
    "defaultVatRate" REAL NOT NULL DEFAULT 20,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hours" REAL NOT NULL DEFAULT 0,
    "hourlyRate" REAL NOT NULL DEFAULT 0,
    "description" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkEntry_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "materialId" TEXT,
    "materialName" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'adet',
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "vatRate" REAL,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialPurchase_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BusinessJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referansKodu" TEXT NOT NULL,
    "musteriAdi" TEXT NOT NULL,
    "musteriSoyadi" TEXT,
    "firmaAdi" TEXT,
    "tcKimlikNo" TEXT,
    "vergiNo" TEXT,
    "telefon" TEXT NOT NULL,
    "email" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Yeni',
    "oncelik" TEXT NOT NULL DEFAULT 'Normal',
    "etiketler" TEXT,
    "notlar" TEXT,
    "il" TEXT,
    "ilce" TEXT,
    "adres" TEXT,
    "faturaUnvani" TEXT,
    "teslimatAdresi" TEXT,
    "laborCostTotal" REAL NOT NULL DEFAULT 0,
    "materialCostTotal" REAL NOT NULL DEFAULT 0,
    "olusturmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" DATETIME NOT NULL,
    "kapanisTarihi" DATETIME
);
INSERT INTO "new_BusinessJob" ("adres", "durum", "email", "etiketler", "faturaUnvani", "firmaAdi", "guncellemeTarihi", "id", "il", "ilce", "kapanisTarihi", "musteriAdi", "musteriSoyadi", "notlar", "olusturmaTarihi", "oncelik", "referansKodu", "tcKimlikNo", "telefon", "teslimatAdresi", "vergiNo") SELECT "adres", "durum", "email", "etiketler", "faturaUnvani", "firmaAdi", "guncellemeTarihi", "id", "il", "ilce", "kapanisTarihi", "musteriAdi", "musteriSoyadi", "notlar", "olusturmaTarihi", "oncelik", "referansKodu", "tcKimlikNo", "telefon", "teslimatAdresi", "vergiNo" FROM "BusinessJob";
DROP TABLE "BusinessJob";
ALTER TABLE "new_BusinessJob" RENAME TO "BusinessJob";
CREATE UNIQUE INDEX "BusinessJob_referansKodu_key" ON "BusinessJob"("referansKodu");
CREATE INDEX "BusinessJob_durum_idx" ON "BusinessJob"("durum");
CREATE INDEX "BusinessJob_oncelik_idx" ON "BusinessJob"("oncelik");
CREATE INDEX "BusinessJob_olusturmaTarihi_idx" ON "BusinessJob"("olusturmaTarihi");
CREATE TABLE "new_WorkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL,
    "toplamSaat" REAL NOT NULL,
    "birimUcret" REAL NOT NULL DEFAULT 0,
    "toplamTutar" REAL NOT NULL DEFAULT 0,
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkLog_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkLog" ("aciklama", "createdAt", "id", "jobId", "masterId", "tarih", "toplamSaat", "updatedAt") SELECT "aciklama", "createdAt", "id", "jobId", "masterId", "tarih", "toplamSaat", "updatedAt" FROM "WorkLog";
DROP TABLE "WorkLog";
ALTER TABLE "new_WorkLog" RENAME TO "WorkLog";
CREATE INDEX "WorkLog_jobId_idx" ON "WorkLog"("jobId");
CREATE INDEX "WorkLog_masterId_idx" ON "WorkLog"("masterId");
CREATE INDEX "WorkLog_tarih_idx" ON "WorkLog"("tarih");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Worker_isActive_idx" ON "Worker"("isActive");

-- CreateIndex
CREATE INDEX "Worker_roleType_idx" ON "Worker"("roleType");

-- CreateIndex
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

-- CreateIndex
CREATE INDEX "Material_isActive_idx" ON "Material"("isActive");

-- CreateIndex
CREATE INDEX "WorkEntry_jobId_idx" ON "WorkEntry"("jobId");

-- CreateIndex
CREATE INDEX "WorkEntry_workerId_idx" ON "WorkEntry"("workerId");

-- CreateIndex
CREATE INDEX "WorkEntry_date_idx" ON "WorkEntry"("date");

-- CreateIndex
CREATE INDEX "MaterialPurchase_jobId_idx" ON "MaterialPurchase"("jobId");

-- CreateIndex
CREATE INDEX "MaterialPurchase_supplierId_idx" ON "MaterialPurchase"("supplierId");

-- CreateIndex
CREATE INDEX "MaterialPurchase_materialId_idx" ON "MaterialPurchase"("materialId");

-- CreateIndex
CREATE INDEX "MaterialPurchase_purchaseDate_idx" ON "MaterialPurchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");
