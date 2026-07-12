import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import YoklamaClient from './YoklamaClient';

async function getPageData() {
  const [attendances, workers, jobs] = await Promise.all([
    prisma.attendance.findMany({
      include: {
        worker: { select: { id: true, fullName: true, dailyRate: true } },
        job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.worker.findMany({ where: { isActive: true }, select: { id: true, fullName: true, dailyRate: true }, orderBy: { fullName: 'asc' } }),
    prisma.businessJob.findMany({
      where: { durum: { notIn: ['Tamamlandi', 'Iptal'] } },
      select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true },
      orderBy: { olusturmaTarihi: 'desc' },
    }),
  ]);

  return {
    attendances: attendances.map((a) => ({
      id: a.id,
      workerId: a.workerId,
      workerName: a.worker.fullName,
      jobId: a.jobId,
      job: a.job,
      date: a.date.toISOString(),
      type: a.type,
      dayMultiplier: a.dayMultiplier,
      dailyRateSnapshot: a.dailyRateSnapshot,
      extraAmount: a.extraAmount,
      extraDescription: a.extraDescription,
      note: a.note,
    })),
    workers: workers.map((w) => ({ id: w.id, name: w.fullName, dailyRate: w.dailyRate })),
    jobs: jobs.map((j) => ({ id: j.id, label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})` })),
  };
}

export default async function YoklamaPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getPageData();
  return <YoklamaClient data={data} />;
}
