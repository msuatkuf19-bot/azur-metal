import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MasterDetailClient from './MasterDetailClient';

async function getMasterDetails(id: string) {
  const master = await prisma.master.findUnique({
    where: { id },
    include: {
      workLogs: {
        include: {
          job: {
            select: {
              id: true,
              referansKodu: true,
              musteriAdi: true,
              musteriSoyadi: true,
              firmaAdi: true,
              durum: true,
            },
          },
        },
        orderBy: { tarih: 'desc' },
      },
      payments: {
        where: {
          tip: 'Gider',
          taraf: 'Usta',
        },
        include: {
          job: {
            select: {
              id: true,
              referansKodu: true,
              firmaAdi: true,
              musteriAdi: true,
            },
          },
        },
        orderBy: { tarih: 'desc' },
      },
    },
  });

  if (!master) {
    notFound();
  }

  // Proje bazlı özet hesapla
  const projectMap = new Map<string, {
    projectId: string;
    projectName: string;
    referansKodu: string;
    durum: string;
    totalHours: number;
    totalEarned: number;
    totalPaid: number;
    remaining: number;
    workLogs: any[];
    payments: any[];
  }>();

  // WorkLog'ları projelerine göre grupla
  master.workLogs.forEach((log) => {
    const projectId = log.jobId;
    const projectName = log.job.firmaAdi || `${log.job.musteriAdi} ${log.job.musteriSoyadi || ''}`.trim();
    
    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        projectId,
        projectName,
        referansKodu: log.job.referansKodu,
        durum: log.job.durum,
        totalHours: 0,
        totalEarned: 0,
        totalPaid: 0,
        remaining: 0,
        workLogs: [],
        payments: [],
      });
    }

    const project = projectMap.get(projectId)!;
    project.totalHours += log.toplamSaat;
    project.totalEarned += log.toplamTutar;
    project.workLogs.push(log);
  });

  // Ödemeleri projelerine göre ekle
  master.payments.forEach((payment) => {
    const projectId = payment.jobId;
    if (projectMap.has(projectId)) {
      const project = projectMap.get(projectId)!;
      project.totalPaid += payment.tutar;
      project.payments.push(payment);
    }
  });

  // Kalan borçları hesapla
  projectMap.forEach((project) => {
    project.remaining = project.totalEarned - project.totalPaid;
  });

  const projectSummaries = Array.from(projectMap.values()).sort((a, b) => b.remaining - a.remaining);

  // Genel özet
  const totalHours = master.workLogs.reduce((sum, log) => sum + log.toplamSaat, 0);
  const totalEarned = master.workLogs.reduce((sum, log) => sum + log.toplamTutar, 0);
  const totalPaid = master.payments.reduce((sum, p) => sum + p.tutar, 0);
  const totalRemaining = totalEarned - totalPaid;

  // Serialize dates for client component
  const serializedWorkLogs = master.workLogs.map(log => ({
    ...log,
    tarih: log.tarih.toISOString(),
    createdAt: log.createdAt.toISOString(),
    updatedAt: log.updatedAt.toISOString(),
  }));

  const serializedPayments = master.payments.map(p => ({
    ...p,
    tarih: p.tarih.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return {
    master: {
      id: master.id,
      adSoyad: master.adSoyad,
      telefon: master.telefon,
      uzmanlik: master.uzmanlik,
      saatlikUcret: master.saatlikUcret,
      notlar: master.notlar,
      aktif: master.aktif,
      createdAt: master.createdAt.toISOString(),
    },
    projectSummaries: projectSummaries.map(p => ({
      ...p,
      workLogs: p.workLogs.map((l: any) => ({
        ...l,
        tarih: l.tarih.toISOString(),
      })),
      payments: p.payments.map((pay: any) => ({
        ...pay,
        tarih: pay.tarih.toISOString(),
      })),
    })),
    recentWorkLogs: serializedWorkLogs.slice(0, 20),
    recentPayments: serializedPayments.slice(0, 10),
    summary: {
      totalProjects: projectSummaries.length,
      totalHours,
      totalEarned,
      totalPaid,
      totalRemaining,
      totalWorkLogs: master.workLogs.length,
    },
  };
}

export default async function MasterDetailPage({ params }: { params: { id: string } }) {
  const data = await getMasterDetails(params.id);

  return <MasterDetailClient data={data} />;
}
