import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import SupplierDetailClient from './SupplierDetailClient';

async function getSupplierData(id: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  const purchases = await prisma.materialPurchase.findMany({
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
      material: true,
    },
    orderBy: { purchaseDate: 'desc' },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const overallTotal = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const thisMonthTotal = purchases
    .filter(p => p.purchaseDate >= startOfMonth)
    .reduce((s, p) => s + p.totalAmount, 0);

  // Benzersiz projeler
  const projectMap = new Map<string, { id: string; name: string; refKodu: string }>();
  purchases.forEach(p => {
    if (!projectMap.has(p.jobId)) {
      projectMap.set(p.jobId, {
        id: p.job.id,
        name: p.job.firmaAdi || `${p.job.musteriAdi} ${p.job.musteriSoyadi || ''}`.trim(),
        refKodu: p.job.referansKodu,
      });
    }
  });

  // Benzersiz müşteriler
  const customerSet = new Set<string>();
  purchases.forEach(p => {
    customerSet.add(p.job.firmaAdi || p.job.musteriAdi);
  });

  // Serialize dates
  const serializedPurchases = purchases.map(p => ({
    ...p,
    purchaseDate: p.purchaseDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    material: p.material ? {
      ...p.material,
      createdAt: p.material.createdAt.toISOString(),
      updatedAt: p.material.updatedAt.toISOString(),
    } : null,
  }));

  return {
    supplier: {
      ...supplier,
      createdAt: supplier.createdAt.toISOString(),
      updatedAt: supplier.updatedAt.toISOString(),
    },
    purchases: serializedPurchases,
    filters: {
      projects: Array.from(projectMap.values()),
      customers: Array.from(customerSet),
    },
    summary: {
      overallTotal,
      thisMonthTotal,
      totalPurchases: purchases.length,
    },
  };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getSupplierData(id);
  return <SupplierDetailClient data={data} />;
}
