-- CreateTable
CREATE TABLE "WorkerSettlementPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "workedDays" REAL NOT NULL DEFAULT 0,
    "earnedAmount" REAL NOT NULL DEFAULT 0,
    "extraAmount" REAL NOT NULL DEFAULT 0,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'CLOSED',
    "notes" TEXT,
    "closedAt" DATETIME,
    "closedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerSettlementPeriod_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "supplierId" TEXT NOT NULL,
    "jobId" TEXT,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'Nakit',
    "description" TEXT,
    "documentUrl" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierPayment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "jobId" TEXT,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FULL_DAY',
    "dayMultiplier" REAL NOT NULL DEFAULT 1,
    "dailyRateSnapshot" REAL NOT NULL DEFAULT 0,
    "extraAmount" REAL NOT NULL DEFAULT 0,
    "extraDescription" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Attendance" ("createdAt", "date", "extraAmount", "id", "note", "type", "updatedAt", "workerId") SELECT "createdAt", "date", "extraAmount", "id", "note", "type", "updatedAt", "workerId" FROM "Attendance";
DROP TABLE "Attendance";
ALTER TABLE "new_Attendance" RENAME TO "Attendance";
CREATE INDEX "Attendance_workerId_idx" ON "Attendance"("workerId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE INDEX "Attendance_jobId_idx" ON "Attendance"("jobId");
CREATE TABLE "new_MaterialPurchase" (
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
    "invoiceNo" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Acik',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaterialPurchase_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialPurchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MaterialPurchase_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MaterialPurchase" ("createdAt", "id", "jobId", "materialId", "materialName", "note", "purchaseDate", "quantity", "supplierId", "totalAmount", "unit", "unitPrice", "updatedAt", "vatRate") SELECT "createdAt", "id", "jobId", "materialId", "materialName", "note", "purchaseDate", "quantity", "supplierId", "totalAmount", "unit", "unitPrice", "updatedAt", "vatRate" FROM "MaterialPurchase";
DROP TABLE "MaterialPurchase";
ALTER TABLE "new_MaterialPurchase" RENAME TO "MaterialPurchase";
CREATE INDEX "MaterialPurchase_jobId_idx" ON "MaterialPurchase"("jobId");
CREATE INDEX "MaterialPurchase_supplierId_idx" ON "MaterialPurchase"("supplierId");
CREATE INDEX "MaterialPurchase_materialId_idx" ON "MaterialPurchase"("materialId");
CREATE INDEX "MaterialPurchase_purchaseDate_idx" ON "MaterialPurchase"("purchaseDate");
CREATE TABLE "new_WorkerPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "jobId" TEXT,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "paymentType" TEXT NOT NULL DEFAULT 'HAKEDIS',
    "paymentMethod" TEXT NOT NULL DEFAULT 'Nakit',
    "description" TEXT,
    "documentUrl" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerPayment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkerPayment" ("amount", "createdAt", "date", "description", "id", "updatedAt", "workerId") SELECT "amount", "createdAt", "date", "description", "id", "updatedAt", "workerId" FROM "WorkerPayment";
DROP TABLE "WorkerPayment";
ALTER TABLE "new_WorkerPayment" RENAME TO "WorkerPayment";
CREATE INDEX "WorkerPayment_workerId_idx" ON "WorkerPayment"("workerId");
CREATE INDEX "WorkerPayment_date_idx" ON "WorkerPayment"("date");
CREATE INDEX "WorkerPayment_jobId_idx" ON "WorkerPayment"("jobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WorkerSettlementPeriod_workerId_idx" ON "WorkerSettlementPeriod"("workerId");

-- CreateIndex
CREATE INDEX "WorkerSettlementPeriod_endDate_idx" ON "WorkerSettlementPeriod"("endDate");

-- CreateIndex
CREATE INDEX "WorkerSettlementPeriod_status_idx" ON "WorkerSettlementPeriod"("status");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_paymentDate_idx" ON "SupplierPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "SupplierPayment_jobId_idx" ON "SupplierPayment"("jobId");
