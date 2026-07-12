import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getWorkerAccount } from '@/lib/worker-account';
import WorkerAttendanceClient from './WorkerAttendanceClient';

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

async function getWorkerPageData(id: string) {
  const [account, activeJobs] = await Promise.all([
    getWorkerAccount(id),
    prisma.businessJob.findMany({
      where: { durum: { notIn: ['Tamamlandi', 'Iptal'] } },
      select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true },
      orderBy: { guncellemeTarihi: 'desc' },
    }),
  ]);

  if (!account) notFound();

  const { worker, attendances, payments, workEntries, settlementPeriods, ledger, summary } = account;

  return {
    worker: {
      ...worker,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    },
    attendances: attendances.map((a) => ({
      id: a.id,
      date: a.date.toISOString(),
      type: a.type,
      dayMultiplier: a.dayMultiplier,
      dailyRateSnapshot: a.dailyRateSnapshot,
      extraAmount: a.extraAmount,
      extraDescription: a.extraDescription,
      startTime: a.startTime,
      endTime: a.endTime,
      note: a.note,
      jobId: a.jobId,
      job: a.job,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      amount: p.amount,
      paymentType: p.paymentType,
      paymentMethod: p.paymentMethod,
      description: p.description,
      jobId: p.jobId,
      job: p.job,
    })),
    workEntries: workEntries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      hours: e.hours,
      hourlyRate: e.hourlyRate,
      totalAmount: e.totalAmount,
      description: e.description,
      jobId: e.jobId,
      job: e.job,
    })),
    settlementPeriods: settlementPeriods.map((s) => ({
      id: s.id,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      workedDays: s.workedDays,
      earnedAmount: s.earnedAmount,
      extraAmount: s.extraAmount,
      paidAmount: s.paidAmount,
      balance: s.balance,
      status: s.status,
      notes: s.notes,
      closedAt: iso(s.closedAt),
    })),
    ledger,
    summary,
    activeJobs: activeJobs.map((j) => ({
      id: j.id,
      label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})`,
    })),
  };
}

export type WorkerPageData = Awaited<ReturnType<typeof getWorkerPageData>>;

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWorkerPageData(id);
  return <WorkerAttendanceClient data={data} />;
}
