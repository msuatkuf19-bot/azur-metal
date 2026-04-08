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

// Toptancı detay sayfası için gelişmiş veri çekme
export async function getSupplierDetail(id: string, filters?: {
  jobId?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
      return { success: false, error: 'Toptancı bulunamadı' };
    }

    const where: any = { supplierId: id };

    if (filters?.jobId) {
      where.jobId = filters.jobId;
    }

    if (filters?.startDate) {
      where.purchaseDate = { ...where.purchaseDate, gte: new Date(filters.startDate) };
    }

    if (filters?.endDate) {
      where.purchaseDate = { ...where.purchaseDate, lte: new Date(filters.endDate) };
    }

    // customerName filtresi — job  üzerinden
    if (filters?.customerName) {
      where.job = {
        OR: [
          { musteriAdi: { contains: filters.customerName } },
          { firmaAdi: { contains: filters.customerName } },
        ],
      };
    }

    const purchases = await prisma.materialPurchase.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            referansKodu: true,
            musteriAdi: true,
            musteriSoyadi: true,
            firmaAdi: true,
          },
        },
        material: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    // Tüm alımları getir (filtre dışı, toplam hesabı için)
    const allPurchases = await prisma.materialPurchase.findMany({
      where: { supplierId: id },
      include: {
        job: {
          select: {
            id: true,
            referansKodu: true,
            musteriAdi: true,
            musteriSoyadi: true,
            firmaAdi: true,
          },
        },
      },
    });

    // Filtreye göre toplam
    const filteredTotal = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

    // Genel toplam
    const overallTotal = allPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

    // Bu ay toplamı
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthTotal = allPurchases
      .filter(p => new Date(p.purchaseDate) >= startOfMonth)
      .reduce((sum, p) => sum + p.totalAmount, 0);

    // Proje bazlı toplamlar
    const projectTotals = new Map<string, { projectId: string; projectName: string; refKodu: string; total: number }>();
    purchases.forEach(p => {
      const key = p.jobId;
      const name = p.job.firmaAdi || `${p.job.musteriAdi} ${p.job.musteriSoyadi || ''}`.trim();
      if (!projectTotals.has(key)) {
        projectTotals.set(key, { projectId: key, projectName: name, refKodu: p.job.referansKodu, total: 0 });
      }
      projectTotals.get(key)!.total += p.totalAmount;
    });

    // Müşteri bazlı toplamlar
    const customerTotals = new Map<string, { customerName: string; total: number }>();
    purchases.forEach(p => {
      const name = p.job.firmaAdi || p.job.musteriAdi;
      if (!customerTotals.has(name)) {
        customerTotals.set(name, { customerName: name, total: 0 });
      }
      customerTotals.get(name)!.total += p.totalAmount;
    });

    // Benzersiz projeler (filtre dropdown için)
    const uniqueProjects = Array.from(
      new Map(allPurchases.map(p => [p.jobId, {
        id: p.job.id,
        name: p.job.firmaAdi || `${p.job.musteriAdi} ${p.job.musteriSoyadi || ''}`.trim(),
        refKodu: p.job.referansKodu,
      }])).values()
    );

    // Benzersiz müşteriler (filtre dropdown için)
    const uniqueCustomers = Array.from(
      new Set(allPurchases.map(p => p.job.firmaAdi || p.job.musteriAdi))
    ).filter(Boolean);

    return {
      success: true,
      data: {
        supplier,
        purchases,
        filters: {
          projects: uniqueProjects,
          customers: uniqueCustomers,
        },
        summary: {
          filteredTotal,
          overallTotal,
          thisMonthTotal,
          purchaseCount: purchases.length,
          projectTotals: Array.from(projectTotals.values()).sort((a, b) => b.total - a.total),
          customerTotals: Array.from(customerTotals.values()).sort((a, b) => b.total - a.total),
        },
      },
    };
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
