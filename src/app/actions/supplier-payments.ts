'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supplierPaymentSchema, type SupplierPaymentInput } from '@/lib/validations';

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session;
}

async function createAuditLog(userId: string, action: string, entityId?: string, details?: string, jobId?: string | null) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entityType: 'SupplierPayment',
      entityId,
      entity: 'SupplierPayment',
      details,
      jobId: jobId || undefined,
    },
  });
}

function revalidateSupplierPaths(supplierId: string, jobId?: string | null) {
  revalidatePath(`/admin/tanimlamalar/toptancilar/${supplierId}`);
  revalidatePath('/admin/tanimlamalar/toptancilar');
  revalidatePath('/admin/tedarikci-odemeleri');
  revalidatePath('/admin');
  if (jobId) revalidatePath(`/admin/projeler/${jobId}`);
}

// Toptancının ödemelerini getir
export async function getSupplierPayments(supplierId: string) {
  try {
    const payments = await prisma.supplierPayment.findMany({
      where: { supplierId },
      include: { job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true } } },
      orderBy: { paymentDate: 'desc' },
    });
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    return { success: true, data: payments, summary: { totalPaid, count: payments.length } };
  } catch {
    return { success: false, error: 'Ödemeler yüklenemedi' };
  }
}

// Toptancı ödemesi oluştur
export async function createSupplierPayment(data: SupplierPaymentInput) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const validated = supplierPaymentSchema.parse(data);

    const supplier = await prisma.supplier.findUnique({ where: { id: validated.supplierId }, select: { name: true } });
    if (!supplier) return { success: false, error: 'Toptancı bulunamadı' };

    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: validated.supplierId,
        jobId: validated.jobId || null,
        amount: validated.amount,
        paymentDate: new Date(validated.paymentDate),
        paymentMethod: validated.paymentMethod,
        description: validated.description || null,
        documentUrl: validated.documentUrl || null,
        createdById: (session.user as any).id,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'CREATE',
      payment.id,
      `Toptancı ödemesi: ${supplier.name} — ${validated.amount.toLocaleString('tr-TR')} ₺`,
      validated.jobId
    );

    revalidateSupplierPaths(validated.supplierId, validated.jobId);
    return { success: true, data: payment, message: 'Toptancı ödemesi kaydedildi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Ödeme kaydedilemedi' };
  }
}

// Toptancı ödemesi güncelle
export async function updateSupplierPayment(id: string, data: Partial<SupplierPaymentInput>) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const existing = await prisma.supplierPayment.findUnique({ where: { id }, include: { supplier: { select: { name: true } } } });
    if (!existing) return { success: false, error: 'Ödeme kaydı bulunamadı' };

    const validated = supplierPaymentSchema.partial().parse(data);

    const payment = await prisma.supplierPayment.update({
      where: { id },
      data: {
        amount: validated.amount,
        paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : undefined,
        paymentMethod: validated.paymentMethod,
        jobId: validated.jobId !== undefined ? (validated.jobId || null) : undefined,
        description: validated.description !== undefined ? (validated.description || null) : undefined,
      },
    });

    await createAuditLog(
      (session.user as any).id,
      'UPDATE',
      payment.id,
      `Toptancı ödemesi güncellendi: ${existing.supplier.name} — ${existing.amount.toLocaleString('tr-TR')} ₺ → ${payment.amount.toLocaleString('tr-TR')} ₺`,
      payment.jobId
    );

    revalidateSupplierPaths(payment.supplierId, payment.jobId);
    return { success: true, data: payment, message: 'Ödeme güncellendi' };
  } catch (error: any) {
    if (error?.name === 'ZodError') return { success: false, error: error.errors?.[0]?.message || 'Geçersiz veri' };
    return { success: false, error: 'Ödeme güncellenemedi' };
  }
}

// Toptancı ödemesi sil
export async function deleteSupplierPayment(id: string) {
  try {
    const session = await requireSession();
    if (!session) return { success: false, error: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' };

    const payment = await prisma.supplierPayment.findUnique({ where: { id }, include: { supplier: { select: { name: true } } } });
    if (!payment) return { success: false, error: 'Ödeme kaydı bulunamadı' };

    await prisma.supplierPayment.delete({ where: { id } });

    await createAuditLog(
      (session.user as any).id,
      'DELETE',
      id,
      `Toptancı ödemesi silindi: ${payment.supplier.name} — ${payment.amount.toLocaleString('tr-TR')} ₺ (${payment.paymentDate.toLocaleDateString('tr-TR')})`,
      payment.jobId
    );

    revalidateSupplierPaths(payment.supplierId, payment.jobId);
    return { success: true, message: 'Ödeme silindi' };
  } catch {
    return { success: false, error: 'Ödeme silinemedi' };
  }
}
