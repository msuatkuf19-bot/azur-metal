'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workerPaymentSchema, type WorkerPaymentInput } from '@/lib/validations';

async function createAuditLog(
  action: string,
  entityType: string,
  entityId?: string,
  details?: string
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;

  await prisma.auditLog.create({
    data: {
      userId: (session.user as any).id,
      action,
      entityType,
      entityId,
      entity: 'WorkerPayment',
      details,
    },
  });
}

// Çalışanın ödemelerini getir
export async function getWorkerPayments(workerId: string) {
  try {
    const payments = await prisma.workerPayment.findMany({
      where: { workerId },
      orderBy: { date: 'desc' },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: payments,
      summary: { totalPaid, count: payments.length },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Ödeme oluştur
export async function createWorkerPayment(data: WorkerPaymentInput) {
  try {
    const validated = workerPaymentSchema.parse(data);

    const payment = await prisma.workerPayment.create({
      data: {
        workerId: validated.workerId,
        amount: validated.amount,
        date: new Date(validated.date),
        description: validated.description,
      },
    });

    const worker = await prisma.worker.findUnique({
      where: { id: validated.workerId },
      select: { fullName: true },
    });

    await createAuditLog(
      'CREATE',
      'WorkerPayment',
      payment.id,
      `Ödeme: ${worker?.fullName} - ${validated.amount} ₺`
    );

    revalidatePath(`/admin/ustalar/${validated.workerId}`);
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Ödeme sil
export async function deleteWorkerPayment(id: string) {
  try {
    const payment = await prisma.workerPayment.findUnique({ where: { id } });
    if (!payment) {
      return { success: false, error: 'Ödeme kaydı bulunamadı' };
    }

    await prisma.workerPayment.delete({ where: { id } });

    await createAuditLog('DELETE', 'WorkerPayment', id, 'Ödeme silindi');

    revalidatePath(`/admin/ustalar/${payment.workerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışanın tam finansal özeti (yoklama + ödeme)
export async function getWorkerFinancialSummary(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { dailyRate: true, fullName: true },
    });

    if (!worker) {
      return { success: false, error: 'Çalışan bulunamadı' };
    }

    const [attendances, payments] = await Promise.all([
      prisma.attendance.findMany({ where: { workerId } }),
      prisma.workerPayment.findMany({ where: { workerId } }),
    ]);

    const fullDays = attendances.filter(a => a.type === 'FULL_DAY').length;
    const halfDays = attendances.filter(a => a.type === 'HALF_DAY').length;
    const totalExtras = attendances.reduce((sum, a) => sum + a.extraAmount, 0);
    const totalEarned = (fullDays * worker.dailyRate) + (halfDays * worker.dailyRate / 2) + totalExtras;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalEarned - totalPaid;

    // Bu ay hesaplama
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthAttendances = attendances.filter(a => new Date(a.date) >= startOfMonth);
    const thisMonthFull = thisMonthAttendances.filter(a => a.type === 'FULL_DAY').length;
    const thisMonthHalf = thisMonthAttendances.filter(a => a.type === 'HALF_DAY').length;
    const thisMonthExtras = thisMonthAttendances.reduce((sum, a) => sum + a.extraAmount, 0);
    const thisMonthEarned = (thisMonthFull * worker.dailyRate) + (thisMonthHalf * worker.dailyRate / 2) + thisMonthExtras;

    return {
      success: true,
      data: {
        fullDays,
        halfDays,
        totalExtras,
        totalEarned,
        totalPaid,
        balance,
        thisMonth: {
          fullDays: thisMonthFull,
          halfDays: thisMonthHalf,
          extras: thisMonthExtras,
          earned: thisMonthEarned,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
