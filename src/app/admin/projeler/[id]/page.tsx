import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProjectDetailClient from './ProjectDetailClient';

async function getProjectDetails(id: string) {
  const project = await prisma.businessJob.findUnique({
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
        take: 100,
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Finansal hesaplamalar
  const acceptedOffers = project.offers.filter((o) => o.durum === 'Kabul');
  const totalOfferAmount = acceptedOffers.reduce((sum, o) => sum + o.genelToplam, 0);

  // Sözleşme toplamı
  const signedContracts = project.contracts.filter(c => c.durum === 'Imzalandi');
  const contractTotal = signedContracts.reduce((sum, c) => sum + c.toplamTutar, 0);

  // Ödemeler
  const tahsilatlar = project.payments.filter((p) => p.tip === 'Tahsilat');
  const giderler = project.payments.filter((p) => p.tip === 'Gider');

  const totalCollection = tahsilatlar.reduce((sum, p) => sum + p.tutar, 0);
  const totalPaymentExpense = giderler.reduce((sum, p) => sum + p.tutar, 0);
  const remainingReceivable = (contractTotal || totalOfferAmount) - totalCollection;

  // Usta hakediş hesaplamaları (eski WorkLog)
  const totalWorkLogAmount = project.workLogs.reduce((sum, w) => sum + (w.toplamTutar || 0), 0);
  const masterPayments = giderler.filter((p) => p.taraf === 'Usta' && p.masterId);
  const totalMasterPayments = masterPayments.reduce((sum, p) => sum + p.tutar, 0);
  const remainingMasterDebt = totalWorkLogAmount - totalMasterPayments;

  // Yeni işçilik ve malzeme maliyetleri
  const laborCostTotal = project.workEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const materialCostTotal = project.materialPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  
  // Toplam proje maliyeti (işçilik + malzeme + diğer giderler)
  const totalProjectCost = laborCostTotal + materialCostTotal + totalPaymentExpense;
  
  // Net kar: Tahsilat - Tüm giderler
  const netProfit = totalCollection - totalProjectCost;
  
  // Beklenen kar (sözleşme bazlı)
  const expectedProfit = (contractTotal || totalOfferAmount) - totalProjectCost;

  // İlerleme durumu
  const progressSteps = {
    Yeni: 10,
    TeklifHazirlaniyor: 20,
    TeklifGonderildi: 30,
    Onaylandi: 40,
    Sozlesme: 50,
    Uygulama: 70,
    Tamamlandi: 100,
    Iptal: 0,
  };
  const progress = progressSteps[project.durum as keyof typeof progressSteps] || 0;

  // Çalışan ustalar (unique)
  const uniqueWorkers = project.workEntries
    .map(e => e.worker)
    .filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i);

  // Usta bazlı işçilik özeti
  const workerSummary = uniqueWorkers.map(worker => {
    const entries = project.workEntries.filter(e => e.workerId === worker.id);
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const totalAmount = entries.reduce((sum, e) => sum + e.totalAmount, 0);
    return {
      worker,
      totalHours,
      totalAmount,
      entryCount: entries.length,
    };
  });

  // Toptancı bazlı malzeme özeti
  const supplierSummary = project.materialPurchases.reduce((acc: any, purchase) => {
    const supplierId = purchase.supplierId;
    if (!acc[supplierId]) {
      acc[supplierId] = {
        supplier: purchase.supplier,
        totalAmount: 0,
        purchaseCount: 0,
      };
    }
    acc[supplierId].totalAmount += purchase.totalAmount;
    acc[supplierId].purchaseCount += 1;
    return acc;
  }, {});

  // Geciken ödemeler
  const now = new Date();
  const overduePayments = project.paymentPlans.filter(
    p => p.durum === 'Bekliyor' && new Date(p.vadeTarihi) < now
  );

  // Yaklaşan ödemeler (7 gün içinde)
  const upcomingPayments = project.paymentPlans.filter(
    p => {
      const dueDate = new Date(p.vadeTarihi);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return p.durum === 'Bekliyor' && diffDays >= 0 && diffDays <= 7;
    }
  );

  return {
    project: {
      ...project,
      projeAdi: project.firmaAdi || `${project.musteriAdi} ${project.musteriSoyadi || ''}`.trim(),
    },
    financials: {
      totalOfferAmount,
      contractTotal,
      totalCollection,
      totalPaymentExpense,
      remainingReceivable,
      laborCostTotal,
      materialCostTotal,
      totalProjectCost,
      netProfit,
      expectedProfit,
      totalWorkLogAmount,
      totalMasterPayments,
      remainingMasterDebt,
    },
    metrics: {
      progress,
      workerSummary,
      supplierSummary: Object.values(supplierSummary),
      overduePayments,
      upcomingPayments,
      uniqueWorkers,
    },
  };
}

// Tüm workers ve suppliers'ı getir (drawer formları için)
async function getFormData() {
  const [workers, suppliers, materials] = await Promise.all([
    prisma.worker.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.material.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return { workers, suppliers, materials };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [data, formData] = await Promise.all([
    getProjectDetails(params.id),
    getFormData(),
  ]);

  return <ProjectDetailClient data={data} formData={formData} />;
}
