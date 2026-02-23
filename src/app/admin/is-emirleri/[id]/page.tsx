import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import JobDetailClient from './JobDetailClient';

async function getJobDetails(id: string) {
  const job = await prisma.businessJob.findUnique({
    where: { id },
    include: {
      offers: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
      contracts: {
        orderBy: { createdAt: 'desc' },
      },
      payments: {
        include: { master: true },
        orderBy: { tarih: 'desc' },
      },
      paymentPlans: {
        orderBy: { vadeTarihi: 'asc' },
      },
      orders: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
      workLogs: {
        include: { master: true },
        orderBy: { tarih: 'desc' },
      },
      workEntries: {
        include: { worker: true },
        orderBy: { date: 'desc' },
      },
      materialPurchases: {
        include: { supplier: true, material: true },
        orderBy: { purchaseDate: 'desc' },
      },
      files: {
        orderBy: { createdAt: 'desc' },
      },
      auditLogs: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Finansal hesaplamalar
  const acceptedOffers = job.offers.filter((o) => o.durum === 'Kabul');
  const totalOfferAmount = acceptedOffers.reduce((sum, o) => sum + o.genelToplam, 0);

  const tahsilatlar = job.payments.filter((p) => p.tip === 'Tahsilat');
  const giderler = job.payments.filter((p) => p.tip === 'Gider');

  const totalIncome = tahsilatlar.reduce((sum, p) => sum + p.tutar, 0);
  const totalExpense = giderler.reduce((sum, p) => sum + p.tutar, 0);
  const remainingReceivable = totalOfferAmount - totalIncome;

  // Usta hakediş hesaplamaları (eski WorkLog)
  const totalWorkLogAmount = job.workLogs.reduce((sum, w) => sum + (w.toplamTutar || 0), 0);
  const masterPayments = giderler.filter((p) => p.taraf === 'Usta' && p.masterId);
  const totalMasterPayments = masterPayments.reduce((sum, p) => sum + p.tutar, 0);
  const remainingMasterDebt = totalWorkLogAmount - totalMasterPayments;

  // Yeni işçilik ve malzeme maliyetleri
  const laborCostTotal = job.workEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const materialCostTotal = job.materialPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalProjectCost = laborCostTotal + materialCostTotal + totalExpense;
  
  // Net kar: Tahsilat - Tüm giderler (işçilik + malzeme + diğer giderler)
  const netProfit = totalIncome - totalProjectCost;

  return {
    job,
    financials: {
      totalOfferAmount,
      totalIncome,
      totalExpense,
      remainingReceivable,
      netProfit,
      totalWorkLogAmount,
      totalMasterPayments,
      remainingMasterDebt,
      laborCostTotal,
      materialCostTotal,
      totalProjectCost,
    },
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getJobDetails(id);

  return <JobDetailClient data={data} />;
}
