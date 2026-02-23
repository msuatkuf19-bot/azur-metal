'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workEntrySchema, type WorkEntryInput } from '@/lib/validations';

// Audit log helper
async function createAuditLog(
  action: string,
  entityType: string,
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
      entityType,
      entityId,
      entity: 'WorkEntry',
      details,
      jobId,
    },
  });
}

// İş maliyetlerini güncelle (transaction içinde çağrılır)
async function updateJobCosts(jobId: string) {
  // İşçilik toplamı
  const laborResult = await prisma.workEntry.aggregate({
    where: { jobId },
    _sum: { totalAmount: true },
  });
  
  // Malzeme toplamı
  const materialResult = await prisma.materialPurchase.aggregate({
    where: { jobId },
    _sum: { totalAmount: true },
  });

  await prisma.businessJob.update({
    where: { id: jobId },
    data: {
      laborCostTotal: laborResult._sum.totalAmount || 0,
      materialCostTotal: materialResult._sum.totalAmount || 0,
    },
  });
}

// İş emrine ait işçilik kayıtlarını getir
export async function getWorkEntries(jobId: string, filters?: {
  workerId?: string;
  roleType?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const where: any = { jobId };
    
    if (filters?.workerId) {
      where.workerId = filters.workerId;
    }
    
    if (filters?.roleType) {
      where.worker = { roleType: filters.roleType };
    }
    
    if (filters?.startDate) {
      where.date = { ...where.date, gte: new Date(filters.startDate) };
    }
    
    if (filters?.endDate) {
      where.date = { ...where.date, lte: new Date(filters.endDate) };
    }

    const entries = await prisma.workEntry.findMany({
      where,
      include: {
        worker: true,
      },
      orderBy: { date: 'desc' },
    });

    // Özet hesapla
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const totalAmount = entries.reduce((sum, e) => sum + e.totalAmount, 0);

    return { 
      success: true, 
      data: entries,
      summary: {
        totalHours,
        totalAmount,
        count: entries.length,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Tek işçilik kaydı getir
export async function getWorkEntry(id: string) {
  try {
    const entry = await prisma.workEntry.findUnique({
      where: { id },
      include: {
        worker: true,
        job: true,
      },
    });

    if (!entry) {
      return { success: false, error: 'İşçilik kaydı bulunamadı' };
    }

    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İşçilik kaydı oluştur
export async function createWorkEntry(data: WorkEntryInput) {
  try {
    const validated = workEntrySchema.parse(data);

    // totalAmount hesapla
    const totalAmount = validated.hours * validated.hourlyRate;

    const entry = await prisma.$transaction(async (tx) => {
      // İşçilik kaydı oluştur
      const newEntry = await tx.workEntry.create({
        data: {
          jobId: validated.jobId,
          workerId: validated.workerId,
          date: new Date(validated.date),
          hours: validated.hours,
          hourlyRate: validated.hourlyRate,
          description: validated.description,
          totalAmount,
        },
        include: { worker: true },
      });

      // İş maliyetlerini güncelle
      const laborResult = await tx.workEntry.aggregate({
        where: { jobId: validated.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: validated.jobId },
        data: {
          laborCostTotal: laborResult._sum.totalAmount || 0,
        },
      });

      return newEntry;
    });

    await createAuditLog(
      'CREATE', 
      'WorkEntry', 
      entry.id, 
      `İşçilik kaydı: ${entry.worker.fullName} - ${entry.hours} saat`,
      validated.jobId
    );

    revalidatePath(`/admin/is-emirleri/${validated.jobId}`);
    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İşçilik kaydı güncelle
export async function updateWorkEntry(id: string, data: Partial<WorkEntryInput>) {
  try {
    const existingEntry = await prisma.workEntry.findUnique({ where: { id } });
    if (!existingEntry) {
      return { success: false, error: 'İşçilik kaydı bulunamadı' };
    }

    const validated = workEntrySchema.partial().parse(data);

    // totalAmount hesapla
    const hours = validated.hours ?? existingEntry.hours;
    const hourlyRate = validated.hourlyRate ?? existingEntry.hourlyRate;
    const totalAmount = hours * hourlyRate;

    const entry = await prisma.$transaction(async (tx) => {
      const updatedEntry = await tx.workEntry.update({
        where: { id },
        data: {
          ...validated,
          date: validated.date ? new Date(validated.date) : undefined,
          totalAmount,
        },
        include: { worker: true },
      });

      // İş maliyetlerini güncelle
      const laborResult = await tx.workEntry.aggregate({
        where: { jobId: existingEntry.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: existingEntry.jobId },
        data: {
          laborCostTotal: laborResult._sum.totalAmount || 0,
        },
      });

      return updatedEntry;
    });

    await createAuditLog(
      'UPDATE', 
      'WorkEntry', 
      entry.id, 
      `İşçilik güncellendi: ${entry.worker.fullName}`,
      existingEntry.jobId
    );

    revalidatePath(`/admin/is-emirleri/${existingEntry.jobId}`);
    return { success: true, data: entry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// İşçilik kaydı sil
export async function deleteWorkEntry(id: string) {
  try {
    const entry = await prisma.workEntry.findUnique({ 
      where: { id },
      include: { worker: true }
    });
    
    if (!entry) {
      return { success: false, error: 'İşçilik kaydı bulunamadı' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.workEntry.delete({ where: { id } });

      // İş maliyetlerini güncelle
      const laborResult = await tx.workEntry.aggregate({
        where: { jobId: entry.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: entry.jobId },
        data: {
          laborCostTotal: laborResult._sum.totalAmount || 0,
        },
      });
    });

    await createAuditLog(
      'DELETE', 
      'WorkEntry', 
      id, 
      `İşçilik silindi: ${entry.worker.fullName} - ${entry.hours} saat`,
      entry.jobId
    );

    revalidatePath(`/admin/is-emirleri/${entry.jobId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışana göre işçilik özeti
export async function getWorkerSummaryForJob(jobId: string) {
  try {
    const entries = await prisma.workEntry.findMany({
      where: { jobId },
      include: { worker: true },
    });

    const workerSummary = entries.reduce((acc: any, entry) => {
      const workerId = entry.workerId;
      if (!acc[workerId]) {
        acc[workerId] = {
          worker: entry.worker,
          totalHours: 0,
          totalAmount: 0,
          entries: [],
        };
      }
      acc[workerId].totalHours += entry.hours;
      acc[workerId].totalAmount += entry.totalAmount;
      acc[workerId].entries.push(entry);
      return acc;
    }, {});

    return { success: true, data: Object.values(workerSummary) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
