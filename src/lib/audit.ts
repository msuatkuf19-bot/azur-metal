import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { prisma } from './prisma';

export interface AuditEntry {
  action: string;
  entity?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  jobId?: string | null;
}

// Oturumdaki kullanıcıyı veritabanında çöz. JWT başka bir veritabanında
// (ör. yerel dev.db ↔ Turso) açılmışsa id eşleşmez; kullanıcı adıyla tekrar dene.
async function resolveUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; username?: string } | undefined;
  if (!user) return null;

  if (user.id) {
    const byId = await prisma.adminUser.findUnique({ where: { id: user.id }, select: { id: true } });
    if (byId) return byId.id;
  }
  if (user.username) {
    const byName = await prisma.adminUser.findUnique({
      where: { kullaniciAdi: user.username },
      select: { id: true },
    });
    if (byName) return byName.id;
  }
  return null;
}

// Audit log yaz. Log yazılamazsa asıl işlem başarısız sayılmaz.
export async function writeAuditLog(entry: AuditEntry) {
  try {
    const userId = await resolveUserId();
    if (!userId) return;

    let jobId = entry.jobId || undefined;
    if (jobId) {
      const job = await prisma.businessJob.findUnique({ where: { id: jobId }, select: { id: true } });
      if (!job) jobId = undefined;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: entry.action,
        entity: entry.entity,
        entityType: entry.entityType,
        entityId: entry.entityId,
        details: entry.details,
        jobId,
      },
    });
  } catch (error) {
    console.error('Audit log yazılamadı:', error);
  }
}
