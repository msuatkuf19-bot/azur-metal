import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import HesapDonemleriClient from './HesapDonemleriClient';

async function getPageData() {
  const [periods, workers] = await Promise.all([
    prisma.workerSettlementPeriod.findMany({
      include: { worker: { select: { id: true, fullName: true, dailyRate: true } } },
      orderBy: { endDate: 'desc' },
    }),
    prisma.worker.findMany({ select: { id: true, fullName: true }, orderBy: { fullName: 'asc' } }),
  ]);

  return {
    periods: periods.map((p) => ({
      id: p.id,
      workerId: p.workerId,
      workerName: p.worker.fullName,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      workedDays: p.workedDays,
      earnedAmount: p.earnedAmount,
      extraAmount: p.extraAmount,
      paidAmount: p.paidAmount,
      balance: p.balance,
      status: p.status,
      notes: p.notes,
      closedAt: p.closedAt ? p.closedAt.toISOString() : null,
    })),
    workers: workers.map((w) => ({ id: w.id, name: w.fullName })),
  };
}

export default async function HesapDonemleriPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const data = await getPageData();
  return <HesapDonemleriClient data={data} />;
}
