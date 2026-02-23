'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { workerSchema, type WorkerInput } from '@/lib/validations';

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
      entity: 'Worker',
      details,
      jobId,
    },
  });
}

// Tüm çalışanları getir
export async function getWorkers(filters?: {
  isActive?: boolean;
  roleType?: string;
  search?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters?.roleType) {
      where.roleType = filters.roleType;
    }
    
    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { workEntries: true },
        },
      },
    });

    return { success: true, data: workers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Aktif çalışanları getir (dropdown için)
export async function getActiveWorkers() {
  try {
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        roleType: true,
        hourlyRateDefault: true,
      },
    });

    return { success: true, data: workers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Tek çalışan getir
export async function getWorker(id: string) {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        workEntries: {
          include: { job: true },
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!worker) {
      return { success: false, error: 'Çalışan bulunamadı' };
    }

    return { success: true, data: worker };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışan oluştur
export async function createWorker(data: WorkerInput) {
  try {
    const validated = workerSchema.parse(data);

    const worker = await prisma.worker.create({
      data: validated,
    });

    await createAuditLog('CREATE', 'Worker', worker.id, `Yeni çalışan: ${worker.fullName}`);

    revalidatePath('/admin/tanimlamalar/ustalar');
    return { success: true, data: worker };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışan güncelle
export async function updateWorker(id: string, data: Partial<WorkerInput>) {
  try {
    const validated = workerSchema.partial().parse(data);

    const worker = await prisma.worker.update({
      where: { id },
      data: validated,
    });

    await createAuditLog('UPDATE', 'Worker', worker.id, `Çalışan güncellendi: ${worker.fullName}`);

    revalidatePath('/admin/tanimlamalar/ustalar');
    return { success: true, data: worker };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışan sil (soft delete)
export async function deleteWorker(id: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog('DELETE', 'Worker', worker.id, `Çalışan pasife alındı: ${worker.fullName}`);

    revalidatePath('/admin/tanimlamalar/ustalar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışan kalıcı sil
export async function hardDeleteWorker(id: string) {
  try {
    const worker = await prisma.worker.findUnique({ where: { id } });
    if (!worker) {
      return { success: false, error: 'Çalışan bulunamadı' };
    }

    await prisma.worker.delete({ where: { id } });

    await createAuditLog('HARD_DELETE', 'Worker', id, `Çalışan silindi: ${worker.fullName}`);

    revalidatePath('/admin/tanimlamalar/ustalar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Çalışan aktifleştir
export async function activateWorker(id: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: { isActive: true },
    });

    await createAuditLog('ACTIVATE', 'Worker', worker.id, `Çalışan aktifleştirildi: ${worker.fullName}`);

    revalidatePath('/admin/tanimlamalar/ustalar');
    return { success: true, data: worker };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
