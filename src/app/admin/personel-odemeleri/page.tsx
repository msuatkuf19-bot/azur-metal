import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PersonelOdemeleriClient from './PersonelOdemeleriClient';

async function getPageData() {
  const [payments, workers, jobs] = await Promise.all([
    prisma.workerPayment.findMany({
      include: {
        worker: { select: { id: true, fullName: true } },
        job: { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true } },
      },
      orderBy: { date: 'desc' },
    }),
    prisma.worker.findMany({ select: { id: true, fullName: true, isActive: true }, orderBy: { fullName: 'asc' } }),
    prisma.businessJob.findMany({ select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true }, orderBy: { olusturmaTarihi: 'desc' } }),
  ]);

  return {
    payments: payments.map((p) => ({
      id: p.id,
      workerId: p.workerId,
      workerName: p.worker.fullName,
      jobId: p.jobId,
      job: p.job,
      amount: p.amount,
      date: p.date.toISOString(),
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      description: p.description,
    })),
    workers: workers.map((w) => ({ id: w.id, name: w.fullName, isActive: w.isActive })),
    jobs: jobs.map((j) => ({ id: j.id, label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})` })),
  };
}

export default async function PersonelOdemeleriPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getPageData();
  return <PersonelOdemeleriClient data={data} />;
}
