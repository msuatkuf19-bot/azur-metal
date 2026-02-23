'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supplierSchema, type SupplierInput } from '@/lib/validations';

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
      entity: 'Supplier',
      details,
      jobId,
    },
  });
}

// Tüm toptancıları getir
export async function getSuppliers(filters?: {
  isActive?: boolean;
  search?: string;
}) {
  try {
    const where: any = {};
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { contactName: { contains: filters.search } },
        { phone: { contains: filters.search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { materialPurchases: true },
        },
      },
    });

    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Aktif toptancıları getir (dropdown için)
export async function getActiveSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contactName: true,
      },
    });

    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Tek toptancı getir
export async function getSupplier(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        materialPurchases: {
          include: { job: true, material: true },
          orderBy: { purchaseDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!supplier) {
      return { success: false, error: 'Toptancı bulunamadı' };
    }

    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toptancı oluştur
export async function createSupplier(data: SupplierInput) {
  try {
    const validated = supplierSchema.parse(data);

    const supplier = await prisma.supplier.create({
      data: validated,
    });

    await createAuditLog('CREATE', 'Supplier', supplier.id, `Yeni toptancı: ${supplier.name}`);

    revalidatePath('/admin/tanimlamalar/toptancilar');
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toptancı güncelle
export async function updateSupplier(id: string, data: Partial<SupplierInput>) {
  try {
    const validated = supplierSchema.partial().parse(data);

    const supplier = await prisma.supplier.update({
      where: { id },
      data: validated,
    });

    await createAuditLog('UPDATE', 'Supplier', supplier.id, `Toptancı güncellendi: ${supplier.name}`);

    revalidatePath('/admin/tanimlamalar/toptancilar');
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toptancı sil (soft delete)
export async function deleteSupplier(id: string) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog('DELETE', 'Supplier', supplier.id, `Toptancı pasife alındı: ${supplier.name}`);

    revalidatePath('/admin/tanimlamalar/toptancilar');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toptancı aktifleştir
export async function activateSupplier(id: string) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: true },
    });

    await createAuditLog('ACTIVATE', 'Supplier', supplier.id, `Toptancı aktifleştirildi: ${supplier.name}`);

    revalidatePath('/admin/tanimlamalar/toptancilar');
    return { success: true, data: supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
