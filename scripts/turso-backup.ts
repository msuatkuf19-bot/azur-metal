import { createClient } from '@libsql/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Turso veritabanının tüm tablolarını şemadan bağımsız olarak JSON'a yedekler (salt okunur).
// Kullanım: npx tsx --env-file=.env scripts/turso-backup.ts
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function backup() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%' ORDER BY name"
  );

  const data: Record<string, unknown[]> = {};
  for (const row of tables.rows) {
    const name = row.name as string;
    const result = await client.execute(`SELECT * FROM "${name}"`);
    data[name] = result.rows.map((r) => {
      const obj: Record<string, unknown> = {};
      result.columns.forEach((col, i) => {
        const value = r[i];
        obj[col] = typeof value === 'bigint' ? Number(value) : value;
      });
      return obj;
    });
    console.log(`✓ ${name}: ${data[name].length} kayıt`);
  }

  const dir = join(process.cwd(), 'backups');
  mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const file = join(dir, `turso-${stamp}.json`);
  writeFileSync(file, JSON.stringify({ createdAt: new Date().toISOString(), data }, null, 2));
  console.log(`\nYedek kaydedildi: ${file}`);
}

backup().catch((e) => {
  console.error('Yedekleme hatası:', e);
  process.exit(1);
});
