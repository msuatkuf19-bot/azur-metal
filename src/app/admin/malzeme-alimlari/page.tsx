import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MalzemeAlimlariClient from './MalzemeAlimlariClient';

async function getPageData() {
  const [purchases, suppliers, materials, jobs] = await Promise.all([
    prisma.materialPurchase.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        material: { select: { id: true, name: true } },
        job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true } },
      },
      orderBy: { purchaseDate: 'desc' },
    }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.material.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.businessJob.findMany({ select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true }, orderBy: { olusturmaTarihi: 'desc' } }),
  ]);

  return {
    purchases: purchases.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      job: p.job,
      supplierId: p.supplierId,
      supplierName: p.supplier.name,
      materialId: p.materialId,
      materialName: p.material?.name || p.materialName || '-',
      quantity: p.quantity,
      unit: p.unit,
      unitPrice: p.unitPrice,
      vatRate: p.vatRate,
      totalAmount: p.totalAmount,
      invoiceNo: p.invoiceNo,
      paymentStatus: p.paymentStatus,
      purchaseDate: p.purchaseDate.toISOString(),
    })),
    suppliers,
    materials,
    jobs: jobs.map((j) => ({ id: j.id, label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})` })),
  };
}

export default async function MalzemeAlimlariPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getPageData();
  return <MalzemeAlimlariClient data={data} />;
}
