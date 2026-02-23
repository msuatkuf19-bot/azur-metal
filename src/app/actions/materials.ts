'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialSchema, type MaterialInput } from '@/lib/validations';

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
      entity: 'Material',
      details,
      jobId,
    },
  });
}

// Tüm malzemeleri getir
export async function getMaterials(filters?: {
  isActive?: boolean;
  search?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters?.search) {
      where.name = { contains: filters.search };
    }

    const materials = await prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    return { success: true, data: materials };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Aktif malzemeleri getir (dropdown için)
export async function getActiveMaterials() {
  try {
    const materials = await prisma.material.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        unit: true,
        defaultVatRate: true,
      },
    });

    return { success: true, data: materials };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Tek malzeme getir
export async function getMaterial(id: string) {
  try {
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        purchases: {
          include: { job: true, supplier: true },
          orderBy: { purchaseDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!material) {
      return { success: false, error: 'Malzeme bulunamadı' };
    }

    return { success: true, data: material };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme oluştur
export async function createMaterial(data: MaterialInput) {
  try {
    const validated = materialSchema.parse(data);

    const material = await prisma.material.create({
      data: validated,
    });

    await createAuditLog('CREATE', 'Material', material.id, `Yeni malzeme: ${material.name}`);

    revalidatePath('/admin/tanimlamalar/malzemeler');
    return { success: true, data: material };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme güncelle
export async function updateMaterial(id: string, data: Partial<MaterialInput>) {
  try {
    const validated = materialSchema.partial().parse(data);

    const material = await prisma.material.update({
      where: { id },
      data: validated,
    });

    await createAuditLog('UPDATE', 'Material', material.id, `Malzeme güncellendi: ${material.name}`);

    revalidatePath('/admin/tanimlamalar/malzemeler');
    return { success: true, data: material };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme sil (soft delete)
export async function deleteMaterial(id: string) {
  try {
    const material = await prisma.material.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog('DELETE', 'Material', material.id, `Malzeme pasife alındı: ${material.name}`);

    revalidatePath('/admin/tanimlamalar/malzemeler');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme aktifleştir
export async function activateMaterial(id: string) {
  try {
    const material = await prisma.material.update({
      where: { id },
      data: { isActive: true },
    });

    await createAuditLog('ACTIVATE', 'Material', material.id, `Malzeme aktifleştirildi: ${material.name}`);

    revalidatePath('/admin/tanimlamalar/malzemeler');
    return { success: true, data: material };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
