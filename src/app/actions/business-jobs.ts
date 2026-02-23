'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { businessJobSchema } from '@/lib/validations';
import { generateReferenceCode } from '@/lib/utils';

// Audit log oluştur
async function createAuditLog(
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action,
      entity,
      entityId,
      details,
    },
  });
}

// null değerleri undefined'a çevir (Prisma için)
function cleanNullValues(obj: any) {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// İş emri oluştur
export async function createBusinessJob(data: any) {
  try {
    const validated = businessJobSchema.parse(data);
    const cleanedData = cleanNullValues(validated);

    // Referans kodu oluştur
    const year = new Date().getFullYear();
    const count = await prisma.businessJob.count();
    const referansKodu = generateReferenceCode('JOB', year, count + 1);

    const job = await prisma.businessJob.create({
      data: {
        ...cleanedData,
        referansKodu,
        guncellemeTarihi: new Date().toISOString(),
      },
    });

    await createAuditLog('CREATE', 'BusinessJob', job.id, `Yeni iş emri: ${job.firmaAdi || job.musteriAdi}`);

    revalidatePath('/admin/is-emirleri');
    revalidatePath('/admin/projeler');
    return { success: true, data: job };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İş emri güncelle
export async function updateBusinessJob(id: string, data: any) {
  try {
    const validated = businessJobSchema.parse(data);
    const cleanedData = cleanNullValues(validated);

    const job = await prisma.businessJob.update({
      where: { id },
      data: {
        ...cleanedData,
        guncellemeTarihi: new Date().toISOString(),
      },
    });

    await createAuditLog('UPDATE', 'BusinessJob', job.id, `İş emri güncellendi: ${job.firmaAdi || job.musteriAdi}`);

    revalidatePath('/admin/is-emirleri');
    revalidatePath('/admin/projeler');
    revalidatePath(`/admin/is-emirleri/${id}`);
    revalidatePath(`/admin/projeler/${id}`);
    return { success: true, data: job };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İş emri sil (soft delete yok, direkt sil)
export async function deleteBusinessJob(id: string) {
  try {
    const job = await prisma.businessJob.findUnique({ where: { id } });
    if (!job) {
      return { success: false, error: 'İş emri bulunamadı' };
    }

    await prisma.businessJob.delete({ where: { id } });

    await createAuditLog('DELETE', 'BusinessJob', id, `İş emri silindi: ${job.firmaAdi || job.musteriAdi}`);

    revalidatePath('/admin/is-emirleri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İş emri durum güncelle
export async function updateJobStatus(id: string, durum: string) {
  try {
    const job = await prisma.businessJob.update({
      where: { id },
      data: { durum: durum as any },
    });

    await createAuditLog('UPDATE_STATUS', 'BusinessJob', id, `Durum değişti: ${durum}`);

    revalidatePath('/admin/is-emirleri');
    revalidatePath(`/admin/is-emirleri/${id}`);
    revalidatePath('/admin/projeler');
    revalidatePath(`/admin/projeler/${id}`);
    return { success: true, data: job };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Ödeme (Tahsilat/Gider) oluştur
export async function createPayment(data: {
  jobId: string;
  tip: 'Tahsilat' | 'Gider';
  taraf: string;
  tutar: number;
  tarih: Date;
  odemeYontemi: string;
  aciklama?: string;
  masterId?: string;
}) {
  try {
    const payment = await prisma.payment.create({
      data: {
        jobId: data.jobId,
        tip: data.tip,
        taraf: data.taraf,
        tutar: data.tutar,
        tarih: data.tarih,
        odemeYontemi: data.odemeYontemi,
        aciklama: data.aciklama,
        masterId: data.masterId,
      },
    });

    await createAuditLog(
      'CREATE',
      'Payment',
      payment.id,
      `${data.tip} eklendi: ${data.tutar.toLocaleString('tr-TR')} ₺`
    );

    revalidatePath('/admin/is-emirleri');
    revalidatePath(`/admin/is-emirleri/${data.jobId}`);
    revalidatePath('/admin/projeler');
    revalidatePath(`/admin/projeler/${data.jobId}`);
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
