'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { materialPurchaseSchema, type MaterialPurchaseInput } from '@/lib/validations';

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
      entity: 'MaterialPurchase',
      details,
      jobId,
    },
  });
}

// İş emrine ait malzeme alımlarını getir
export async function getMaterialPurchases(jobId: string, filters?: {
  supplierId?: string;
  materialId?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const where: any = { jobId };
    
    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }
    
    if (filters?.materialId) {
      where.materialId = filters.materialId;
    }
    
    if (filters?.startDate) {
      where.purchaseDate = { ...where.purchaseDate, gte: new Date(filters.startDate) };
    }
    
    if (filters?.endDate) {
      where.purchaseDate = { ...where.purchaseDate, lte: new Date(filters.endDate) };
    }

    const purchases = await prisma.materialPurchase.findMany({
      where,
      include: {
        supplier: true,
        material: true,
      },
      orderBy: { purchaseDate: 'desc' },
    });

    // Özet hesapla
    const totalAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
    
    // Toptancı bazlı toplamlar
    const supplierTotals = purchases.reduce((acc: any, p) => {
      const supplierId = p.supplierId;
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: p.supplier,
          total: 0,
        };
      }
      acc[supplierId].total += p.totalAmount;
      return acc;
    }, {});

    return { 
      success: true, 
      data: purchases,
      summary: {
        totalAmount,
        count: purchases.length,
        supplierTotals: Object.values(supplierTotals),
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Tek malzeme alımı getir
export async function getMaterialPurchase(id: string) {
  try {
    const purchase = await prisma.materialPurchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        material: true,
        job: true,
      },
    });

    if (!purchase) {
      return { success: false, error: 'Malzeme alımı bulunamadı' };
    }

    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme alımı oluştur
export async function createMaterialPurchase(data: MaterialPurchaseInput) {
  try {
    const validated = materialPurchaseSchema.parse(data);

    // totalAmount hesapla
    let totalAmount = validated.quantity * validated.unitPrice;
    if (validated.vatRate) {
      totalAmount += totalAmount * (validated.vatRate / 100);
    }

    const purchase = await prisma.$transaction(async (tx) => {
      // Malzeme alımı oluştur
      const newPurchase = await tx.materialPurchase.create({
        data: {
          jobId: validated.jobId,
          supplierId: validated.supplierId,
          materialId: validated.materialId || null,
          materialName: validated.materialName,
          quantity: validated.quantity,
          unit: validated.unit,
          unitPrice: validated.unitPrice,
          vatRate: validated.vatRate,
          totalAmount,
          note: validated.note,
          purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : new Date(),
        },
        include: { supplier: true, material: true },
      });

      // İş maliyetlerini güncelle
      const materialResult = await tx.materialPurchase.aggregate({
        where: { jobId: validated.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: validated.jobId },
        data: {
          materialCostTotal: materialResult._sum.totalAmount || 0,
        },
      });

      return newPurchase;
    });

    const materialLabel = purchase.material?.name || purchase.materialName || 'Malzeme';
    
    await createAuditLog(
      'CREATE', 
      'MaterialPurchase', 
      purchase.id, 
      `Malzeme alımı: ${materialLabel} - ${purchase.supplier.name}`,
      validated.jobId
    );

    revalidatePath(`/admin/is-emirleri/${validated.jobId}`);
    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme alımı güncelle
export async function updateMaterialPurchase(id: string, data: Partial<MaterialPurchaseInput>) {
  try {
    const existingPurchase = await prisma.materialPurchase.findUnique({ where: { id } });
    if (!existingPurchase) {
      return { success: false, error: 'Malzeme alımı bulunamadı' };
    }

    // Manuel validasyon - partial güncelleme için
    const validated = data;

    // totalAmount hesapla
    const quantity = validated.quantity ?? existingPurchase.quantity;
    const unitPrice = validated.unitPrice ?? existingPurchase.unitPrice;
    const vatRate = validated.vatRate ?? existingPurchase.vatRate;
    
    let totalAmount = quantity * unitPrice;
    if (vatRate) {
      totalAmount += totalAmount * (vatRate / 100);
    }

    const purchase = await prisma.$transaction(async (tx) => {
      const updatedPurchase = await tx.materialPurchase.update({
        where: { id },
        data: {
          ...validated,
          purchaseDate: validated.purchaseDate ? new Date(validated.purchaseDate) : undefined,
          totalAmount,
        },
        include: { supplier: true, material: true },
      });

      // İş maliyetlerini güncelle
      const materialResult = await tx.materialPurchase.aggregate({
        where: { jobId: existingPurchase.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: existingPurchase.jobId },
        data: {
          materialCostTotal: materialResult._sum.totalAmount || 0,
        },
      });

      return updatedPurchase;
    });

    const materialLabel = purchase.material?.name || purchase.materialName || 'Malzeme';
    
    await createAuditLog(
      'UPDATE', 
      'MaterialPurchase', 
      purchase.id, 
      `Malzeme alımı güncellendi: ${materialLabel}`,
      existingPurchase.jobId
    );

    revalidatePath(`/admin/is-emirleri/${existingPurchase.jobId}`);
    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Malzeme alımı sil
export async function deleteMaterialPurchase(id: string) {
  try {
    const purchase = await prisma.materialPurchase.findUnique({ 
      where: { id },
      include: { supplier: true, material: true }
    });
    
    if (!purchase) {
      return { success: false, error: 'Malzeme alımı bulunamadı' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.materialPurchase.delete({ where: { id } });

      // İş maliyetlerini güncelle
      const materialResult = await tx.materialPurchase.aggregate({
        where: { jobId: purchase.jobId },
        _sum: { totalAmount: true },
      });

      await tx.businessJob.update({
        where: { id: purchase.jobId },
        data: {
          materialCostTotal: materialResult._sum.totalAmount || 0,
        },
      });
    });

    const materialLabel = purchase.material?.name || purchase.materialName || 'Malzeme';
    
    await createAuditLog(
      'DELETE', 
      'MaterialPurchase', 
      id, 
      `Malzeme alımı silindi: ${materialLabel} - ${purchase.supplier.name}`,
      purchase.jobId
    );

    revalidatePath(`/admin/is-emirleri/${purchase.jobId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toptancıya göre malzeme özeti
export async function getSupplierSummaryForJob(jobId: string) {
  try {
    const purchases = await prisma.materialPurchase.findMany({
      where: { jobId },
      include: { supplier: true, material: true },
    });

    const supplierSummary = purchases.reduce((acc: any, purchase) => {
      const supplierId = purchase.supplierId;
      if (!acc[supplierId]) {
        acc[supplierId] = {
          supplier: purchase.supplier,
          totalAmount: 0,
          purchases: [],
        };
      }
      acc[supplierId].totalAmount += purchase.totalAmount;
      acc[supplierId].purchases.push(purchase);
      return acc;
    }, {});

    return { success: true, data: Object.values(supplierSummary) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
