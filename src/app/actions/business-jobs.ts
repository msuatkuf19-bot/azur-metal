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
  details?: string,
  jobId?: string
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
      jobId,
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

// Yılın en büyük sıra numarasından devam eden referans kodu (silinen kayıtlar çakışma yaratmaz)
async function nextReferenceCode() {
  const year = new Date().getFullYear();
  const prefix = `JOB-${year}-`;
  const codes = await prisma.businessJob.findMany({
    where: { referansKodu: { startsWith: prefix } },
    select: { referansKodu: true },
  });
  const maxSeq = codes.reduce((max, { referansKodu }) => {
    const seq = parseInt(referansKodu.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);
  return generateReferenceCode('JOB', year, maxSeq + 1);
}

// Referans kodu çakışırsa (eşzamanlı kayıt) yeni kodla tekrar dener
async function createJobWithReference(data: any) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const referansKodu = await nextReferenceCode();
    try {
      return await prisma.businessJob.create({
        data: { ...data, referansKodu },
      });
    } catch (error: any) {
      if (error?.code !== 'P2002') throw error;
    }
  }
  throw new Error('Referans kodu oluşturulamadı, lütfen tekrar deneyin');
}

function revalidateJobPaths(id?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/is-emirleri');
  revalidatePath('/admin/projeler');
  if (id) {
    revalidatePath(`/admin/is-emirleri/${id}`);
    revalidatePath(`/admin/projeler/${id}`);
  }
}

// İş emri oluştur
export async function createBusinessJob(data: any) {
  try {
    const validated = businessJobSchema.parse(data);
    const cleanedData = cleanNullValues(validated);

    const job = await createJobWithReference({
      ...cleanedData,
      guncellemeTarihi: new Date().toISOString(),
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

// İş emri silinirse birlikte gidecek / bağlantısı kopacak kayıt sayıları
export async function getJobDeleteImpact(id: string) {
  try {
    const job = await prisma.businessJob.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            workEntries: true,
            materialPurchases: true,
            payments: true,
            offers: true,
            contracts: true,
            orders: true,
            paymentPlans: true,
            files: true,
            workLogs: true,
            attendances: true,
            workerPayments: true,
            supplierPayments: true,
          },
        },
      },
    });
    if (!job) {
      return { success: false as const, error: 'İş emri bulunamadı' };
    }
    const c = job._count;
    const financialCount = c.workEntries + c.materialPurchases + c.payments + c.workLogs;
    return { success: true as const, data: { ...c, financialCount } };
  } catch (error: any) {
    return { success: false as const, error: error.message as string };
  }
}

// İş emrini kalıcı sil. İşçilik, malzeme alımı veya ödeme kaydı varsa
// personel/toptancı bakiyelerini bozmamak için force olmadan silinmez.
export async function deleteBusinessJob(id: string, options?: { force?: boolean }) {
  try {
    const job = await prisma.businessJob.findUnique({ where: { id } });
    if (!job) {
      return { success: false, error: 'İş emri bulunamadı' };
    }

    const impact = await getJobDeleteImpact(id);
    if (!impact.success) {
      return { success: false, error: impact.error };
    }
    if (impact.data.financialCount > 0 && !options?.force) {
      return {
        success: false,
        error: 'Bu iş emrine bağlı mali kayıtlar var. Silmek yerine arşivleyin.',
      };
    }

    await prisma.businessJob.delete({ where: { id } });

    const d = impact.data;
    await createAuditLog(
      'DELETE',
      'BusinessJob',
      id,
      `İş emri kalıcı silindi: ${job.referansKodu} ${job.firmaAdi || job.musteriAdi} ` +
        `(işçilik: ${d.workEntries}, malzeme: ${d.materialPurchases}, ödeme: ${d.payments})`
    );

    revalidateJobPaths();
    revalidatePath('/admin/tanimlamalar/ustalar');
    revalidatePath('/admin/tanimlamalar/toptancilar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İş emrini arşivle / arşivden çıkar (veri silinmez, sadece listelerden gizlenir)
export async function setJobArchived(id: string, archived: boolean) {
  try {
    const job = await prisma.businessJob.update({
      where: { id },
      data: {
        arsivlendi: archived,
        arsivTarihi: archived ? new Date() : null,
      },
    });

    await createAuditLog(
      archived ? 'ARCHIVE' : 'UNARCHIVE',
      'BusinessJob',
      id,
      `${archived ? 'Arşivlendi' : 'Arşivden çıkarıldı'}: ${job.firmaAdi || job.musteriAdi}`,
      id
    );

    revalidateJobPaths(id);
    return { success: true, data: job };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İş emrini kopyala: müşteri ve iş bilgileri yeni kayda aktarılır,
// ödeme / işçilik / malzeme gibi hareketler kopyalanmaz
export async function duplicateBusinessJob(id: string) {
  try {
    const source = await prisma.businessJob.findUnique({ where: { id } });
    if (!source) {
      return { success: false, error: 'İş emri bulunamadı' };
    }

    const job = await createJobWithReference({
      musteriAdi: source.musteriAdi,
      musteriSoyadi: source.musteriSoyadi,
      firmaAdi: source.firmaAdi,
      tcKimlikNo: source.tcKimlikNo,
      vergiNo: source.vergiNo,
      telefon: source.telefon,
      email: source.email,
      isTipi: source.isTipi,
      oncelik: source.oncelik,
      etiketler: source.etiketler,
      notlar: source.notlar,
      il: source.il,
      ilce: source.ilce,
      adres: source.adres,
      faturaUnvani: source.faturaUnvani,
      teslimatAdresi: source.teslimatAdresi,
      durum: 'Yeni',
    });

    await createAuditLog(
      'CREATE',
      'BusinessJob',
      job.id,
      `${source.referansKodu} kopyalanarak oluşturuldu`,
      job.id
    );

    revalidateJobPaths();
    return { success: true, data: job };
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
    if (!Number.isFinite(data.tutar) || data.tutar <= 0) {
      return { success: false, error: 'Geçerli bir tutar girin' };
    }

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
      `${data.tip} eklendi: ${data.tutar.toLocaleString('tr-TR')} ₺`,
      data.jobId
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

// Ödeme (Tahsilat/Gider) güncelle
export async function updatePayment(
  id: string,
  data: {
    taraf?: string;
    tutar?: number;
    tarih?: Date;
    odemeYontemi?: string;
    aciklama?: string | null;
  }
) {
  try {
    if (data.tutar !== undefined && (!Number.isFinite(data.tutar) || data.tutar <= 0)) {
      return { success: false, error: 'Geçerli bir tutar girin' };
    }

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        taraf: data.taraf,
        tutar: data.tutar,
        tarih: data.tarih,
        odemeYontemi: data.odemeYontemi,
        aciklama: data.aciklama === undefined ? undefined : data.aciklama || null,
      },
    });

    const changed =
      existing.tutar !== payment.tutar
        ? ` (${existing.tutar.toLocaleString('tr-TR')} ₺ → ${payment.tutar.toLocaleString('tr-TR')} ₺)`
        : '';
    await createAuditLog('UPDATE', 'Payment', id, `${payment.tip} güncellendi${changed}`, payment.jobId);

    revalidateJobPaths(payment.jobId);
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Ödeme (Tahsilat/Gider) sil
export async function deletePayment(id: string) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return { success: false, error: 'Kayıt bulunamadı' };
    }

    await prisma.payment.delete({ where: { id } });

    await createAuditLog(
      'DELETE',
      'Payment',
      id,
      `${payment.tip} silindi: ${payment.tutar.toLocaleString('tr-TR')} ₺ (${payment.aciklama || '-'})`,
      payment.jobId
    );

    revalidateJobPaths(payment.jobId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
