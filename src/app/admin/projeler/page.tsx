import { prisma } from '@/lib/prisma';
import ProjectsListClient from './ProjectsListClient';

async function getProjects(searchParams: any) {
  const { search, durum, musteri, karlilik } = searchParams;

  const where: any = {};

  if (search) {
    where.OR = [
      { firmaAdi: { contains: search } },
      { musteriAdi: { contains: search } },
      { telefon: { contains: search } },
      { referansKodu: { contains: search } },
    ];
  }

  if (durum) {
    where.durum = durum;
  }

  const projects = await prisma.businessJob.findMany({
    where,
    orderBy: { guncellemeTarihi: 'desc' },
    include: {
      offers: {
        where: { durum: 'Kabul' },
      },
      contracts: true,
      payments: true,
      workEntries: {
        include: { worker: true },
        take: 5,
        orderBy: { date: 'desc' },
      },
      materialPurchases: true,
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Her proje için finansal özet ve metrikler hesapla
  const projectsWithMetrics = projects.map((project) => {
    // Kabul edilen teklifler toplamı
    const contractTotal = project.offers.reduce((sum, offer) => sum + offer.genelToplam, 0);
    
    // Sözleşme toplamı
    const signedContractTotal = project.contracts
      .filter(c => c.durum === 'Imzalandi')
      .reduce((sum, c) => sum + c.toplamTutar, 0);
    
    // Tahsilatlar
    const totalCollection = project.payments
      .filter((p) => p.tip === 'Tahsilat')
      .reduce((sum, p) => sum + p.tutar, 0);
    
    // Giderler (ödeme tipli)
    const totalPaymentExpense = project.payments
      .filter((p) => p.tip === 'Gider')
      .reduce((sum, p) => sum + p.tutar, 0);
    
    // İşçilik maliyeti
    const laborCost = project.workEntries.reduce((sum, e) => sum + e.totalAmount, 0);
    
    // Malzeme maliyeti
    const materialCost = project.materialPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
    
    // Toplam maliyet
    const totalCost = laborCost + materialCost + totalPaymentExpense;
    
    // Kâr
    const profit = totalCollection - totalCost;
    
    // Kârlılık durumu
    const profitability = profit > 0 ? 'positive' : profit < 0 ? 'negative' : 'neutral';
    
    // Son aktivite
    const lastActivity = project.auditLogs[0];
    
    // Çalışan ustalar (unique)
    const workers = project.workEntries
      .map(e => e.worker)
      .filter((w, i, arr) => arr.findIndex(x => x.id === w.id) === i)
      .slice(0, 3);
    
    // İlerleme durumu (basit hesaplama)
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

    return {
      id: project.id,
      referansKodu: project.referansKodu,
      projeAdi: project.firmaAdi || `${project.musteriAdi} ${project.musteriSoyadi || ''}`.trim(),
      musteriAdi: project.musteriAdi,
      firmaAdi: project.firmaAdi,
      durum: project.durum,
      oncelik: project.oncelik,
      etiketler: project.etiketler,
      olusturmaTarihi: project.olusturmaTarihi,
      guncellemeTarihi: project.guncellemeTarihi,
      metrics: {
        contractTotal,
        signedContractTotal,
        totalCollection,
        laborCost,
        materialCost,
        totalCost,
        profit,
        profitability,
      },
      progress,
      lastActivity: lastActivity ? {
        action: lastActivity.action,
        details: lastActivity.details,
        date: lastActivity.createdAt,
      } : null,
      workers,
    };
  });

  // Kârlılık filtresi
  let filteredProjects = projectsWithMetrics;
  if (karlilik === 'positive') {
    filteredProjects = projectsWithMetrics.filter(p => p.metrics.profitability === 'positive');
  } else if (karlilik === 'negative') {
    filteredProjects = projectsWithMetrics.filter(p => p.metrics.profitability === 'negative');
  }

  return filteredProjects;
}

export default async function ProjectsPage({ searchParams }: { searchParams: any }) {
  const projects = await getProjects(searchParams);

  return <ProjectsListClient projects={projects} searchParams={searchParams} />;
}
