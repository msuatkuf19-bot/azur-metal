'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attendanceSchema, type AttendanceInput } from '@/lib/validations';

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
      entity: 'Attendance',
      details,
    },
  });
}

// Çalışanın yoklama kayıtlarını getir
export async function getAttendances(workerId: string, filters?: {
  month?: number; // 0-11
  year?: number;
}) {
  try {
    const where: any = { workerId };

    if (filters?.year !== undefined && filters?.month !== undefined) {
      const startDate = new Date(filters.year, filters.month, 1);
      const endDate = new Date(filters.year, filters.month + 1, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    // Özet hesapla
    const fullDays = attendances.filter(a => a.type === 'FULL_DAY').length;
    const halfDays = attendances.filter(a => a.type === 'HALF_DAY').length;
    const totalExtras = attendances.reduce((sum, a) => sum + a.extraAmount, 0);

    return {
      success: true,
      data: attendances,
      summary: {
        fullDays,
        halfDays,
        totalExtras,
        totalDays: attendances.length,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Yoklama kaydı oluştur
export async function createAttendance(data: AttendanceInput) {
  try {
    const validated = attendanceSchema.parse(data);

    // Aynı gün ve çalışan için kontrol
    const dateObj = new Date(validated.date);
    const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

    const existing = await prisma.attendance.findFirst({
      where: {
        workerId: validated.workerId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (existing) {
      return { success: false, error: 'Bu tarihte zaten yoklama kaydı var' };
    }

    const attendance = await prisma.attendance.create({
      data: {
        workerId: validated.workerId,
        date: dateObj,
        type: validated.type,
        extraAmount: validated.extraAmount,
        note: validated.note,
      },
    });

    await createAuditLog('CREATE', 'Attendance', attendance.id, `Yoklama: ${validated.type}`);

    revalidatePath(`/admin/ustalar/${validated.workerId}`);
    return { success: true, data: attendance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Yoklama kaydı güncelle
export async function updateAttendance(id: string, data: Partial<AttendanceInput>) {
  try {
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        type: data.type,
        extraAmount: data.extraAmount,
        note: data.note,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    await createAuditLog('UPDATE', 'Attendance', attendance.id, 'Yoklama güncellendi');

    revalidatePath(`/admin/ustalar/${attendance.workerId}`);
    return { success: true, data: attendance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Yoklama kaydı sil
export async function deleteAttendance(id: string) {
  try {
    const attendance = await prisma.attendance.findUnique({ where: { id } });
    if (!attendance) {
      return { success: false, error: 'Yoklama kaydı bulunamadı' };
    }

    await prisma.attendance.delete({ where: { id } });

    await createAuditLog('DELETE', 'Attendance', id, 'Yoklama silindi');

    revalidatePath(`/admin/ustalar/${attendance.workerId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışanın kazanç özeti (yoklama + yevmiye bazlı)
export async function getWorkerEarningsSummary(workerId: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: { dailyRate: true },
    });

    if (!worker) {
      return { success: false, error: 'Çalışan bulunamadı' };
    }

    const attendances = await prisma.attendance.findMany({
      where: { workerId },
    });

    const payments = await prisma.workerPayment.findMany({
      where: { workerId },
    });

    const fullDays = attendances.filter(a => a.type === 'FULL_DAY').length;
    const halfDays = attendances.filter(a => a.type === 'HALF_DAY').length;
    const totalExtras = attendances.reduce((sum, a) => sum + a.extraAmount, 0);

    const totalEarned = (fullDays * worker.dailyRate) + (halfDays * worker.dailyRate / 2) + totalExtras;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = totalEarned - totalPaid;

    return {
      success: true,
      data: {
        dailyRate: worker.dailyRate,
        fullDays,
        halfDays,
        totalExtras,
        totalEarned,
        totalPaid,
        balance,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
