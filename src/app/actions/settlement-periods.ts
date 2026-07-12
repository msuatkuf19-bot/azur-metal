'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { settlementPeriodSchema, type SettlementPeriodInput } from '@/lib/validations';
import { getWorkerAccount } from '@/lib/worker-account';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function createAuditLog(userId: string, action: string, entityId?: string, details?: string) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'WorkerSettlementPeriod',
      entityId,
      entity: 'WorkerSettlementPeriod',
      details,
    },
  });
}

function revalidateWorkerPaths(workerId: string) {
  revalidatePath(`/admin/tanimlamalar/ustalar/${workerId}`);
  revalidatePath('/admin/tanimlamalar/ustalar');
  revalidatePath('/admin/hesap-donemleri');
  revalidatePath('/admin');
}

// Personelin dönemlerini getir
export async function getSettlementPeriods(workerId: string) {
  try {
    const periods = await prisma.workerSettlementPeriod.findMany({
      where: { workerId },
      orderBy: { endDate: 'desc' },
    });
    return { success: true, data: periods };
  } catch {
    return { success: false, error: 'Dönemler yüklenemedi' };
  }
}

// Açık dönemi kapat
// PAY_AND_CLOSE  → kalan bakiye kadar ödeme kaydı oluşturur, dönemi sıfır bakiyeyle kapatır
// CLOSE_WITH_BALANCE → mevcut bakiyeyle kapatır (bakiye != 0 ise PARTIALLY_PAID)
export async function closeWorkerPeriod(data: SettlementPeriodInput) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const validated = settlementPeriodSchema.parse(data);

    const account = await getWorkerAccount(validated.workerId);
    if (!account) return { success: false, error: 'Çalışan bulunamadı' };

    const { summary, settlementPeriods, worker } = account;

    if (summary.openEarned === 0 && summary.openPaid === 0) {
      return { success: false, error: 'Kapatılacak açık dönem hareketi bulunmuyor' };
    }

    const lastPeriod = settlementPeriods[settlementPeriods.length - 1] || null;
    const startDate = summary.openStartDate
      ? new Date(summary.openStartDate)
      : lastPeriod
        ? new Date(lastPeriod.endDate.getTime() + 24 * 60 * 60 * 1000)
        : new Date();
    const endDate = new Date();
    const userId = (session.user as any).id;

    const result = await prisma.$transaction(async (tx) => {
      let paidExtra = 0;

      // Seçenek 1: kalan bakiyeyi öde ve kapat
      if (validated.action === 'PAY_AND_CLOSE' && summary.openBalance > 0) {
        paidExtra = summary.openBalance;
        await tx.workerPayment.create({
          data: {
            workerId: validated.workerId,
            amount: summary.openBalance,
            date: endDate,
            paymentType: 'HAKEDIS',
            paymentMethod: validated.paymentMethod,
            description: `Dönem kapanış ödemesi (${startDate.toLocaleDateString('tr-TR')} – ${endDate.toLocaleDateString('tr-TR')})`,
            createdById: userId,
          },
        });
      }

      // PAY_AND_CLOSE'da kalan ödendiği için kapanış bakiyesi 0 (avans varsa negatif bakiye korunur)
      const closedBalance = validated.action === 'PAY_AND_CLOSE' ? Math.min(summary.openBalance, 0) : summary.openBalance;

      const period = await tx.workerSettlementPeriod.create({
        data: {
          workerId: validated.workerId,
          startDate,
          endDate,
          workedDays: summary.openWorkedDays,
          earnedAmount: summary.openEarned,
          extraAmount: summary.openExtras,
          paidAmount: summary.openPaid + paidExtra,
          balance: closedBalance,
          status: closedBalance === 0 ? 'CLOSED' : 'PARTIALLY_PAID',
          notes: validated.notes || null,
          closedAt: endDate,
          closedByUserId: userId,
        },
      });

      return period;
    });

    await createAuditLog(
      userId,
      'CLOSE_PERIOD',
      result.id,
      `Dönem kapatıldı: ${worker.fullName} — ${startDate.toLocaleDateString('tr-TR')} – ${endDate.toLocaleDateString('tr-TR')} • Hakediş: ${summary.openEarned.toLocaleString('tr-TR')} ₺ • Kapanış bakiyesi: ${result.balance.toLocaleString('tr-TR')} ₺${validated.action === 'PAY_AND_CLOSE' ? ' (kalan ödendi)' : ''}`
    );

    revalidateWorkerPaths(validated.workerId);
    return {
      success: true,
      data: result,
      message: validated.action === 'PAY_AND_CLOSE'
        ? 'Kalan bakiye ödendi ve dönem kapatıldı'
        : 'Dönem mevcut bakiyeyle kapatıldı',
    };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Dönem kapatılamadı' };
  }
}

// Dönemi yeniden aç (arşiv kaydını kaldırır; çalışma ve ödeme kayıtları korunur)
export async function reopenSettlementPeriod(id: string) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const period = await prisma.workerSettlementPeriod.findUnique({
      where: { id },
      include: { worker: { select: { fullName: true } } },
    });
    if (!period) return { success: false, error: 'Dönem bulunamadı' };

    // Sadece en son dönem yeniden açılabilir (aradaki dönemi açmak bakiye zincirini bozar)
    const newer = await prisma.workerSettlementPeriod.findFirst({
      where: { workerId: period.workerId, endDate: { gt: period.endDate } },
    });
    if (newer) return { success: false, error: 'Sadece en son kapatılan dönem yeniden açılabilir' };

    await prisma.workerSettlementPeriod.delete({ where: { id } });

    await createAuditLog(
      (session.user as any).id,
      'REOPEN_PERIOD',
      id,
      `Dönem yeniden açıldı: ${period.worker.fullName} — ${period.startDate.toLocaleDateString('tr-TR')} – ${period.endDate.toLocaleDateString('tr-TR')}`
    );

    revalidateWorkerPaths(period.workerId);
    return { success: true, message: 'Dönem yeniden açıldı; hareketler açık döneme aktarıldı' };
  } catch {
    return { success: false, error: 'Dönem yeniden açılamadı' };
  }
}
