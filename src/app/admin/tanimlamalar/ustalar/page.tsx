import { prisma } from '@/lib/prisma';
import { attendanceEarning } from '@/lib/worker-account';
import WorkersClient from './WorkersClient';

async function getWorkersPageData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [workers, attendances, paymentSums, workEntrySums, activeJobs] = await Promise.all([
    prisma.worker.findMany({
      include: { _count: { select: { workEntries: true, attendances: true } } },
      orderBy: { fullName: 'asc' },
    }),
    prisma.attendance.findMany({
      select: { workerId: true, date: true, type: true, dayMultiplier: true, dailyRateSnapshot: true, extraAmount: true },
    }),
    prisma.workerPayment.groupBy({ by: ['workerId'], _sum: { amount: true } }),
    prisma.workEntry.groupBy({ by: ['workerId'], _sum: { totalAmount: true } }),
    prisma.businessJob.findMany({
      where: { durum: { notIn: ['Tamamlandi', 'Iptal'] } },
      select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true },
      orderBy: { guncellemeTarihi: 'desc' },
    }),
  ]);

  const paidMap = new Map(paymentSums.map((p) => [p.workerId, p._sum.amount || 0]));
  const weMap = new Map(workEntrySums.map((w) => [w.workerId, w._sum.totalAmount || 0]));

  const enriched = workers.map((w) => {
    const myAtt = attendances.filter((a) => a.workerId === w.id);
    let attendanceEarned = 0;
    let monthDays = 0;
    let todayType: string | null = null;
    for (const a of myAtt) {
      const { multiplier, earned } = attendanceEarning(a as any, w.dailyRate);
      attendanceEarned += earned;
      if (a.date >= startOfMonth) monthDays += multiplier;
      if (a.date >= startOfToday && a.date <= endOfToday) todayType = a.type;
    }
    const totalEarned = attendanceEarned + (weMap.get(w.id) || 0);
    const totalPaid = paidMap.get(w.id) || 0;
    const thisMonthEarned = myAtt
      .filter((a) => a.date >= startOfMonth)
      .reduce((s, a) => s + attendanceEarning(a as any, w.dailyRate).earned, 0);

    return {
      id: w.id,
      fullName: w.fullName,
      phone: w.phone,
      roleType: w.roleType,
      hourlyRateDefault: w.hourlyRateDefault,
      dailyRate: w.dailyRate,
      notes: w.notes,
      isActive: w.isActive,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
      _count: w._count,
      balance: totalEarned - totalPaid,
      totalEarned,
      totalPaid,
      monthDays,
      thisMonthEarned,
      todayType,
    };
  });

  const active = enriched.filter((w) => w.isActive);
  const stats = {
    totalWorkers: active.length,
    todayCount: active.filter((w) => w.todayType && w.todayType !== 'NONE').length,
    thisMonthEarned: active.reduce((s, w) => s + w.thisMonthEarned, 0),
    openDebt: active.reduce((s, w) => s + Math.max(w.balance, 0), 0),
    advanceCount: active.filter((w) => w.balance < -0.005).length,
  };

  return {
    workers: enriched,
    stats,
    activeJobs: activeJobs.map((j) => ({ id: j.id, label: `${j.firmaAdi || j.musteriAdi} (${j.referansKodu})` })),
  };
}

export default async function UstalarPage() {
  const data = await getWorkersPageData();
  return <WorkersClient initialData={data.workers} stats={data.stats} activeJobs={data.activeJobs} />;
}
