'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attendanceSchema, bulkAttendanceSchema, type AttendanceInput, type BulkAttendanceInput } from '@/lib/validations';
import { ATTENDANCE_TYPE_LABELS, ATTENDANCE_TYPE_MULTIPLIERS, type AttendanceType } from '@/lib/constants';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function createAuditLog(
  userId: string,
  action: string,
  entityId?: string,
  details?: string
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'Attendance',
      entityId,
      entity: 'Attendance',
      details,
    },
  });
}

function revalidateWorkerPaths(workerId: string) {
  revalidatePath(`/admin/tanimlamalar/ustalar/${workerId}`);
  revalidatePath('/admin/tanimlamalar/ustalar');
  revalidatePath('/admin/yoklama');
  revalidatePath('/admin');
}

function dayRange(dateStr: string) {
  const d = new Date(dateStr);
  return {
    start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
    end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
  };
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
      include: { job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true } } },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: attendances };
  } catch (error: any) {
    return { success: false, error: 'Yoklama kayıtları yüklenemedi' };
  }
}

// Yoklama kaydı oluştur
export async function createAttendance(data: AttendanceInput) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const validated = attendanceSchema.parse(data);

    const worker = await prisma.worker.findUnique({ where: { id: validated.workerId } });
    if (!worker) return { success: false, error: 'Çalışan bulunamadı' };

    // Aynı gün + çalışan için çift kayıt kontrolü
    const { start, end } = dayRange(validated.date);
    const existing = await prisma.attendance.findFirst({
      where: { workerId: validated.workerId, date: { gte: start, lte: end } },
    });
    if (existing) {
      return { success: false, error: `${new Date(validated.date).toLocaleDateString('tr-TR')} tarihinde bu personel için zaten yoklama kaydı var` };
    }

    const multiplier = ATTENDANCE_TYPE_MULTIPLIERS[validated.type as AttendanceType] ?? 1;
    const rate = validated.dailyRate ?? worker.dailyRate;

    const attendance = await prisma.attendance.create({
      data: {
        workerId: validated.workerId,
        jobId: validated.jobId || null,
        date: new Date(validated.date),
        type: validated.type,
        dayMultiplier: multiplier,
        dailyRateSnapshot: rate,
        extraAmount: validated.extraAmount,
        extraDescription: validated.extraDescription || null,
        startTime: validated.startTime || null,
        endTime: validated.endTime || null,
        note: validated.note || null,
        createdById: (session.user as any).id,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'CREATE',
      attendance.id,
      `Yoklama: ${worker.fullName} — ${ATTENDANCE_TYPE_LABELS[validated.type as AttendanceType]}${validated.extraAmount > 0 ? ` + ${validated.extraAmount} ₺ ekstra` : ''} (${new Date(validated.date).toLocaleDateString('tr-TR')})`
    );

    revalidateWorkerPaths(validated.workerId);
    return { success: true, data: attendance, message: 'Yoklama kaydedildi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Yoklama kaydedilemedi' };
  }
}

// Yoklama kaydı güncelle
export async function updateAttendance(id: string, data: Partial<AttendanceInput>) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const existing = await prisma.attendance.findUnique({ where: { id }, include: { worker: true } });
    if (!existing) return { success: false, error: 'Yoklama kaydı bulunamadı' };

    const validated = attendanceSchema.partial().parse(data);

    // Tarih değişiyorsa çift kayıt kontrolü
    if (validated.date) {
      const { start, end } = dayRange(validated.date);
      const dup = await prisma.attendance.findFirst({
        where: { workerId: existing.workerId, date: { gte: start, lte: end }, id: { not: id } },
      });
      if (dup) return { success: false, error: 'Bu tarihte zaten başka bir yoklama kaydı var' };
    }

    const newType = validated.type ?? existing.type;
    const multiplier = ATTENDANCE_TYPE_MULTIPLIERS[newType as AttendanceType] ?? existing.dayMultiplier;
    const rate = validated.dailyRate ?? existing.dailyRateSnapshot ?? existing.worker.dailyRate;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        type: newType,
        dayMultiplier: multiplier,
        dailyRateSnapshot: rate,
        jobId: validated.jobId !== undefined ? (validated.jobId || null) : undefined,
        extraAmount: validated.extraAmount,
        extraDescription: validated.extraDescription !== undefined ? (validated.extraDescription || null) : undefined,
        startTime: validated.startTime !== undefined ? (validated.startTime || null) : undefined,
        endTime: validated.endTime !== undefined ? (validated.endTime || null) : undefined,
        note: validated.note !== undefined ? (validated.note || null) : undefined,
        date: validated.date ? new Date(validated.date) : undefined,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'UPDATE',
      attendance.id,
      `Yoklama güncellendi: ${existing.worker.fullName} — ${ATTENDANCE_TYPE_LABELS[existing.type as AttendanceType] || existing.type} → ${ATTENDANCE_TYPE_LABELS[newType as AttendanceType] || newType} (${existing.date.toLocaleDateString('tr-TR')})`
    );

    revalidateWorkerPaths(attendance.workerId);
    return { success: true, data: attendance, message: 'Yoklama güncellendi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Yoklama güncellenemedi' };
  }
}

// Yoklama kaydı sil
export async function deleteAttendance(id: string) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const attendance = await prisma.attendance.findUnique({ where: { id }, include: { worker: true } });
    if (!attendance) return { success: false, error: 'Yoklama kaydı bulunamadı' };

    await prisma.attendance.delete({ where: { id } });

    await createAuditLog(
      (session.user as any).id,
      'DELETE',
      id,
      `Yoklama silindi: ${attendance.worker.fullName} — ${ATTENDANCE_TYPE_LABELS[attendance.type as AttendanceType] || attendance.type} (${attendance.date.toLocaleDateString('tr-TR')})`
    );

    revalidateWorkerPaths(attendance.workerId);
    return { success: true, message: 'Yoklama silindi' };
  } catch (error: any) {
    return { success: false, error: 'Yoklama silinemedi' };
  }
}

// Toplu yoklama: birden fazla personel için aynı güne kayıt
export async function createBulkAttendance(data: BulkAttendanceInput) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const validated = bulkAttendanceSchema.parse(data);
    const { start, end } = dayRange(validated.date);
    const multiplier = ATTENDANCE_TYPE_MULTIPLIERS[validated.type as AttendanceType] ?? 1;

    const workers = await prisma.worker.findMany({ where: { id: { in: validated.workerIds } } });
    const existing = await prisma.attendance.findMany({
      where: { workerId: { in: validated.workerIds }, date: { gte: start, lte: end } },
      select: { workerId: true },
    });
    const existingIds = new Set(existing.map((e) => e.workerId));

    const toCreate = workers.filter((w) => !existingIds.has(w.id));
    const skipped = workers.filter((w) => existingIds.has(w.id)).map((w) => w.fullName);

    if (toCreate.length === 0) {
      return { success: false, error: 'Seçilen personellerin tamamında bu tarih için zaten yoklama kaydı var' };
    }

    await prisma.$transaction(async (tx) => {
      for (const w of toCreate) {
        await tx.attendance.create({
          data: {
            workerId: w.id,
            jobId: validated.jobId || null,
            date: new Date(validated.date),
            type: validated.type,
            dayMultiplier: multiplier,
            dailyRateSnapshot: w.dailyRate,
            extraAmount: validated.extraAmount,
            note: validated.note || null,
            createdById: (session.user as any).id,
          },
        });
      }
    });

    await createAuditLog(
      (session.user as any).id,
      'BULK_CREATE',
      undefined,
      `Toplu yoklama: ${toCreate.length} personel — ${ATTENDANCE_TYPE_LABELS[validated.type as AttendanceType]} (${new Date(validated.date).toLocaleDateString('tr-TR')})${skipped.length ? ` • Atlanan: ${skipped.join(', ')}` : ''}`
    );

    revalidatePath('/admin/tanimlamalar/ustalar');
    revalidatePath('/admin/yoklama');
    revalidatePath('/admin');
    for (const w of toCreate) revalidatePath(`/admin/tanimlamalar/ustalar/${w.id}`);

    const message = skipped.length > 0
      ? `${toCreate.length} personel için yoklama kaydedildi. Atlanan (zaten kayıtlı): ${skipped.join(', ')}`
      : `${toCreate.length} personel için yoklama kaydedildi`;

    return { success: true, message, created: toCreate.length, skipped };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Toplu yoklama kaydedilemedi' };
  }
}
