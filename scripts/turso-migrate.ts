import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function migrate() {
  console.log('Turso migration başlatılıyor...');

  // Check if tables already exist
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames = tables.rows.map(r => r.name as string);
  console.log('Mevcut tablolar:', tableNames.join(', '));

  // 1. Create Attendance table if not exists
  if (!tableNames.includes('Attendance')) {
    await client.execute(`
      CREATE TABLE "Attendance" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workerId" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'FULL_DAY',
        "extraAmount" REAL NOT NULL DEFAULT 0,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "Attendance_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await client.execute('CREATE INDEX "Attendance_workerId_idx" ON "Attendance"("workerId")');
    await client.execute('CREATE INDEX "Attendance_date_idx" ON "Attendance"("date")');
    console.log('✓ Attendance tablosu oluşturuldu');
  } else {
    console.log('- Attendance tablosu zaten var');
  }

  // 2. Create WorkerPayment table if not exists
  if (!tableNames.includes('WorkerPayment')) {
    await client.execute(`
      CREATE TABLE "WorkerPayment" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "workerId" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "date" DATETIME NOT NULL,
        "description" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "WorkerPayment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await client.execute('CREATE INDEX "WorkerPayment_workerId_idx" ON "WorkerPayment"("workerId")');
    await client.execute('CREATE INDEX "WorkerPayment_date_idx" ON "WorkerPayment"("date")');
    console.log('✓ WorkerPayment tablosu oluşturuldu');
  } else {
    console.log('- WorkerPayment tablosu zaten var');
  }

  // 3. Add dailyRate column to Worker if not exists
  try {
    const workerCols = await client.execute("PRAGMA table_info('Worker')");
    const colNames = workerCols.rows.map(r => r.name as string);
    if (!colNames.includes('dailyRate')) {
      await client.execute('ALTER TABLE "Worker" ADD COLUMN "dailyRate" REAL NOT NULL DEFAULT 0');
      console.log('✓ Worker.dailyRate alanı eklendi');
    } else {
      console.log('- Worker.dailyRate zaten var');
    }
  } catch (e) {
    console.log('Worker dailyRate kontrolünde hata:', e);
  }

  // 4. Add isTipi column to BusinessJob if not exists
  try {
    const jobCols = await client.execute("PRAGMA table_info('BusinessJob')");
    const colNames = jobCols.rows.map(r => r.name as string);
    if (!colNames.includes('isTipi')) {
      await client.execute('ALTER TABLE "BusinessJob" ADD COLUMN "isTipi" TEXT');
      console.log('✓ BusinessJob.isTipi alanı eklendi');
    } else {
      console.log('- BusinessJob.isTipi zaten var');
    }
  } catch (e) {
    console.log('BusinessJob isTipi kontrolünde hata:', e);
  }

  // Yardımcı: tabloya eksik kolonları ekle
  async function addColumns(table: string, columns: { name: string; ddl: string }[]) {
    const info = await client.execute(`PRAGMA table_info('${table}')`);
    const existing = info.rows.map(r => r.name as string);
    for (const col of columns) {
      if (!existing.includes(col.name)) {
        await client.execute(`ALTER TABLE "${table}" ADD COLUMN ${col.ddl}`);
        console.log(`✓ ${table}.${col.name} eklendi`);
      } else {
        console.log(`- ${table}.${col.name} zaten var`);
      }
    }
  }

  // 5. Attendance yeni alanlar
  await addColumns('Attendance', [
    { name: 'jobId', ddl: '"jobId" TEXT' },
    { name: 'dayMultiplier', ddl: '"dayMultiplier" REAL NOT NULL DEFAULT 1' },
    { name: 'dailyRateSnapshot', ddl: '"dailyRateSnapshot" REAL NOT NULL DEFAULT 0' },
    { name: 'extraDescription', ddl: '"extraDescription" TEXT' },
    { name: 'startTime', ddl: '"startTime" TEXT' },
    { name: 'endTime', ddl: '"endTime" TEXT' },
    { name: 'createdById', ddl: '"createdById" TEXT' },
  ]);
  await client.execute('CREATE INDEX IF NOT EXISTS "Attendance_jobId_idx" ON "Attendance"("jobId")');

  // 6. WorkerPayment yeni alanlar
  await addColumns('WorkerPayment', [
    { name: 'jobId', ddl: '"jobId" TEXT' },
    { name: 'paymentType', ddl: '"paymentType" TEXT NOT NULL DEFAULT \'HAKEDIS\'' },
    { name: 'paymentMethod', ddl: '"paymentMethod" TEXT NOT NULL DEFAULT \'Nakit\'' },
    { name: 'documentUrl', ddl: '"documentUrl" TEXT' },
    { name: 'createdById', ddl: '"createdById" TEXT' },
  ]);
  await client.execute('CREATE INDEX IF NOT EXISTS "WorkerPayment_jobId_idx" ON "WorkerPayment"("jobId")');

  // 7. MaterialPurchase yeni alanlar
  await addColumns('MaterialPurchase', [
    { name: 'invoiceNo', ddl: '"invoiceNo" TEXT' },
    { name: 'paymentStatus', ddl: '"paymentStatus" TEXT NOT NULL DEFAULT \'Acik\'' },
  ]);

  // 8. WorkerSettlementPeriod tablosu
  const tables2 = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  const tableNames2 = tables2.rows.map(r => r.name as string);

  if (!tableNames2.includes('WorkerSettlementPeriod')) {
    await client.execute(`
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
      )
    `);
    await client.execute('CREATE INDEX "WorkerSettlementPeriod_workerId_idx" ON "WorkerSettlementPeriod"("workerId")');
    await client.execute('CREATE INDEX "WorkerSettlementPeriod_endDate_idx" ON "WorkerSettlementPeriod"("endDate")');
    await client.execute('CREATE INDEX "WorkerSettlementPeriod_status_idx" ON "WorkerSettlementPeriod"("status")');
    console.log('✓ WorkerSettlementPeriod tablosu oluşturuldu');
  } else {
    console.log('- WorkerSettlementPeriod tablosu zaten var');
  }

  // 9. SupplierPayment tablosu
  if (!tableNames2.includes('SupplierPayment')) {
    await client.execute(`
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
      )
    `);
    await client.execute('CREATE INDEX "SupplierPayment_supplierId_idx" ON "SupplierPayment"("supplierId")');
    await client.execute('CREATE INDEX "SupplierPayment_paymentDate_idx" ON "SupplierPayment"("paymentDate")');
    await client.execute('CREATE INDEX "SupplierPayment_jobId_idx" ON "SupplierPayment"("jobId")');
    console.log('✓ SupplierPayment tablosu oluşturuldu');
  } else {
    console.log('- SupplierPayment tablosu zaten var');
  }

  // 10. Backfill: mevcut yoklama kayıtlarında katsayı ve yevmiye snapshot
  const half = await client.execute("UPDATE Attendance SET dayMultiplier = 0.5 WHERE type = 'HALF_DAY' AND dayMultiplier = 1");
  if (half.rowsAffected > 0) console.log(`✓ ${half.rowsAffected} yarım gün kaydına 0.5 katsayı yazıldı`);
  const snap = await client.execute(`
    UPDATE Attendance
    SET dailyRateSnapshot = (SELECT w.dailyRate FROM Worker w WHERE w.id = Attendance.workerId)
    WHERE dailyRateSnapshot = 0
  `);
  if (snap.rowsAffected > 0) console.log(`✓ ${snap.rowsAffected} yoklama kaydına yevmiye snapshot yazıldı`);

  console.log('\nMigration tamamlandı!');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('Migration hatası:', e);
  process.exit(1);
});
