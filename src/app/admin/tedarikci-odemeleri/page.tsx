import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TedarikciOdemeleriClient from './TedarikciOdemeleriClient';

async function getPageData() {
  const [payments, suppliers, jobs] = await Promise.all([
    prisma.supplierPayment.findMany({
      include: {
        supplier: { select: { id: true, name: true } },
        job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true } },
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.supplier.findMany({ select: { id: true, name: true, isActive: true }, orderBy: { name: 'asc' } }),
    prisma.businessJob.findMany({ select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true }, orderBy: { olusturmaTarihi: 'desc' } }),
  ]);

  const supplierPurchaseTotals = await prisma.materialPurchase.groupBy({
    by: ['supplierId'],
    _sum: { totalAmount: true },
  });
  const purchaseTotalMap = new Map(supplierPurchaseTotals.map((s) => [s.supplierId, s._sum.totalAmount || 0]));
  const paidTotalMap = new Map<string, number>();
  for (const p of payments) paidTotalMap.set(p.supplierId, (paidTotalMap.get(p.supplierId) || 0) + p.amount);

  return {
    payments: payments.map((p) => ({
      id: p.id,
      supplierId: p.supplierId,
      supplierName: p.supplier.name,
      jobId: p.jobId,
      job: p.job,
      amount: p.amount,
      paymentDate: p.paymentDate.toISOString(),
      paymentMethod: p.paymentMethod,
      description: p.description,
    })),
    suppliers: suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
      openBalance: (purchaseTotalMap.get(s.id) || 0) - (paidTotalMap.get(s.id) || 0),
    })),
    jobs: jobs.map((j) => ({ id: j.id, label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})` })),
  };
}

export default async function TedarikciOdemeleriPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getPageData();
  return <TedarikciOdemeleriClient data={data} />;
}
