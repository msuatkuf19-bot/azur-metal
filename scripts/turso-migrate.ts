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

  console.log('\nMigration tamamlandı!');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('Migration hatası:', e);
  process.exit(1);
});
