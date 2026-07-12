'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workerPaymentSchema, type WorkerPaymentInput } from '@/lib/validations';
import { WORKER_PAYMENT_TYPE_LABELS } from '@/lib/constants';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function createAuditLog(
  userId: string,
  action: string,
  entityId?: string,
  details?: string,
  jobId?: string | null
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'WorkerPayment',
      entityId,
      entity: 'WorkerPayment',
      details,
      jobId: jobId || undefined,
    },
  });
}

function revalidateWorkerPaths(workerId: string, jobId?: string | null) {
  revalidatePath(`/admin/tanimlamalar/ustalar/${workerId}`);
  revalidatePath('/admin/tanimlamalar/ustalar');
  revalidatePath('/admin/personel-odemeleri');
  revalidatePath('/admin');
  if (jobId) {
    revalidatePath(`/admin/projeler/${jobId}`);
    revalidatePath(`/admin/is-emirleri/${jobId}`);
  }
}

// Çalışanın ödemelerini getir
export async function getWorkerPayments(workerId: string) {
  try {
    const payments = await prisma.workerPayment.findMany({
      where: { workerId },
      include: { job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true } } },
      orderBy: { date: 'desc' },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: payments,
      summary: { totalPaid, count: payments.length },
    };
  } catch (error: any) {
    return { success: false, error: 'Ödemeler yüklenemedi' };
  }
}

// Ödeme oluştur
export async function createWorkerPayment(data: WorkerPaymentInput) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const validated = workerPaymentSchema.parse(data);

    const worker = await prisma.worker.findUnique({ where: { id: validated.workerId }, select: { fullName: true } });
    if (!worker) return { success: false, error: 'Çalışan bulunamadı' };

    const payment = await prisma.workerPayment.create({
      data: {
        workerId: validated.workerId,
        jobId: validated.jobId || null,
        amount: validated.amount,
        date: new Date(validated.date),
        paymentType: validated.paymentType,
        paymentMethod: validated.paymentMethod,
        description: validated.description || null,
        documentUrl: validated.documentUrl || null,
        createdById: (session.user as any).id,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'CREATE',
      payment.id,
      `Personel ödemesi: ${worker.fullName} — ${WORKER_PAYMENT_TYPE_LABELS[validated.paymentType]} ${validated.amount.toLocaleString('tr-TR')} ₺`,
      validated.jobId
    );

    revalidateWorkerPaths(validated.workerId, validated.jobId);
    return { success: true, data: payment, message: 'Ödeme kaydedildi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Ödeme kaydedilemedi' };
  }
}

// Ödeme güncelle
export async function updateWorkerPayment(id: string, data: Partial<WorkerPaymentInput>) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const existing = await prisma.workerPayment.findUnique({ where: { id }, include: { worker: { select: { fullName: true } } } });
    if (!existing) return { success: false, error: 'Ödeme kaydı bulunamadı' };

    const validated = workerPaymentSchema.partial().parse(data);

    const payment = await prisma.workerPayment.update({
      where: { id },
      data: {
        amount: validated.amount,
        date: validated.date ? new Date(validated.date) : undefined,
        paymentType: validated.paymentType,
        paymentMethod: validated.paymentMethod,
        jobId: validated.jobId !== undefined ? (validated.jobId || null) : undefined,
        description: validated.description !== undefined ? (validated.description || null) : undefined,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'UPDATE',
      payment.id,
      `Personel ödemesi güncellendi: ${existing.worker.fullName} — ${existing.amount.toLocaleString('tr-TR')} ₺ → ${payment.amount.toLocaleString('tr-TR')} ₺`,
      payment.jobId
    );

    revalidateWorkerPaths(payment.workerId, payment.jobId);
    return { success: true, data: payment, message: 'Ödeme güncellendi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Ödeme güncellenemedi' };
  }
}

// Ödeme sil
export async function deleteWorkerPayment(id: string) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const payment = await prisma.workerPayment.findUnique({ where: { id }, include: { worker: { select: { fullName: true } } } });
    if (!payment) return { success: false, error: 'Ödeme kaydı bulunamadı' };

    await prisma.workerPayment.delete({ where: { id } });

    await createAuditLog(
      (session.user as any).id,
      'DELETE',
      id,
      `Personel ödemesi silindi: ${payment.worker.fullName} — ${payment.amount.toLocaleString('tr-TR')} ₺ (${payment.date.toLocaleDateString('tr-TR')})`,
      payment.jobId
    );

    revalidateWorkerPaths(payment.workerId, payment.jobId);
    return { success: true, message: 'Ödeme silindi' };
  } catch (error: any) {
    return { success: false, error: 'Ödeme silinemedi' };
  }
}
