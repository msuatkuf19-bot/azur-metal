import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSupplierAccount } from '@/lib/supplier-account';
import SupplierDetailClient from './SupplierDetailClient';

async function getSupplierPageData(id: string) {
  const [account, materials] = await Promise.all([
    getSupplierAccount(id),
    prisma.material.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!account) notFound();

  const { supplier, purchases, supplierPayments, ledger, customerBreakdown, projectBreakdown, materialBreakdown, summary } = account;

  const purchaseIds = purchases.map((p) => p.id);
  const paymentIds = supplierPayments.map((p) => p.id);
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entity: 'Supplier', entityId: id },
        { entity: 'MaterialPurchase', entityId: { in: purchaseIds } },
        { entity: 'SupplierPayment', entityId: { in: paymentIds } },
      ],
    },
    include: { user: { select: { id: true, adSoyad: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return {
    supplier: {
      ...supplier,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    },
    purchases: purchases.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      job: p.job,
      materialId: p.materialId,
      materialName: p.material?.name || p.materialName || '-',
      quantity: p.quantity,
      unit: p.unit,
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
      totalAmount: p.totalAmount,
      note: p.note,
      invoiceNo: p.invoiceNo,
      paymentStatus: p.paymentStatus,
      purchaseDate: p.purchaseDate.toISOString(),
    })),
    payments: supplierPayments.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      job: p.job,
      amount: p.amount,
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      description: p.description,
    })),
    ledger,
    customerBreakdown,
    projectBreakdown,
    materialBreakdown,
    summary,
    materials,
    jobs: Array.from(new Map(purchases.filter((p) => p.job).map((p) => [p.jobId, {
      id: p.jobId,
      label: `${p.job.firmaAdi || p.job.musteriAdi} (${p.job.referansKodu})`,
    }])).values()),
    auditLogs: auditLogs.map((l) => ({
      id: l.id,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      details: l.details,
      createdAt: l.createdAt.toISOString(),
      user: l.user,
    })),
  };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSupplierPageData(id);
  return <SupplierDetailClient data={data} />;
}
