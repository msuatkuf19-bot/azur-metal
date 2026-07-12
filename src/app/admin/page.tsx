import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { attendanceEarning } from '@/lib/worker-account';

function monthRange(offsetFromNow: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - offsetFromNow);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  return { start, end, label: start.toLocaleDateString('tr-TR', { month: 'short' }) };
}

async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const months = [5, 4, 3, 2, 1, 0].map(monthRange);
  const trendRangeStart = months[0].start;
  const trendRangeEnd = months[months.length - 1].end;

  // Single batched round-trip per data source (no per-worker/per-supplier/per-month queries) —
  // this page previously called getWorkerAccount()/getSupplierAccount() per active worker/supplier
  // and ran 12 separate monthly aggregates, which over a remote Turso connection turned into
  // dozens of round trips and made the dashboard take 20-30s to load.
  const [
    totalJobs,
    activeJobs,
    monthlyIncomeAgg,
    monthlyExpenseAgg,
    overdueList,
    pendingContracts,
    recentActivities,
    upcomingPayments,
    recentJobs,
    activeWorkers,
    activeSuppliers,
    jobsForProfit,
    todayAttendance,
    trendPayments,
    workerAttendances,
    workerPayments,
    workerSettlements,
    supplierPurchaseSums,
    supplierPaymentSums,
  ] = await Promise.all([
    prisma.businessJob.count(),
    prisma.businessJob.count({ where: { durum: { notIn: ['Tamamlandi', 'Iptal'] } } }),
    prisma.payment.aggregate({ where: { tip: 'Tahsilat', tarih: { gte: startOfMonth, lte: endOfMonth } }, _sum: { tutar: true } }),
    prisma.payment.aggregate({ where: { tip: 'Gider', tarih: { gte: startOfMonth, lte: endOfMonth } }, _sum: { tutar: true } }),
    prisma.paymentPlan.findMany({ where: { durum: 'Bekliyor', vadeTarihi: { lt: now } }, include: { job: true }, orderBy: { vadeTarihi: 'asc' }, take: 8 }),
    prisma.contract.count({ where: { durum: { in: ['Taslak', 'ImzayaGonderildi'] } } }),
    prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: true, job: true } }),
    prisma.paymentPlan.findMany({
      where: { durum: 'Bekliyor', vadeTarihi: { gte: now, lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      include: { job: true },
      orderBy: { vadeTarihi: 'asc' },
      take: 5,
    }),
    prisma.businessJob.findMany({ take: 5, orderBy: { olusturmaTarihi: 'desc' } }),
    prisma.worker.findMany({ where: { isActive: true }, select: { id: true, fullName: true, dailyRate: true } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    prisma.businessJob.findMany({
      select: {
        id: true, referansKodu: true, musteriAdi: true, musteriSoyadi: true, firmaAdi: true,
        laborCostTotal: true, materialCostTotal: true,
        payments: { where: { tip: 'Tahsilat' }, select: { tutar: true } },
      },
    }),
    prisma.attendance.findMany({ where: { date: { gte: todayStart, lte: todayEnd } }, select: { type: true } }),
    prisma.payment.findMany({ where: { tarih: { gte: trendRangeStart, lte: trendRangeEnd } }, select: { tip: true, tutar: true, tarih: true } }),
    prisma.attendance.findMany({ where: { worker: { isActive: true } }, select: { workerId: true, date: true, type: true, dayMultiplier: true, dailyRateSnapshot: true, extraAmount: true } }),
    prisma.workerPayment.findMany({ where: { worker: { isActive: true } }, select: { workerId: true, date: true, amount: true } }),
    prisma.workerSettlementPeriod.findMany({ where: { worker: { isActive: true } }, select: { workerId: true, endDate: true } }),
    prisma.materialPurchase.groupBy({ by: ['supplierId'], _sum: { totalAmount: true } }),
    prisma.supplierPayment.groupBy({ by: ['supplierId'], _sum: { amount: true } }),
  ]);

  // --- Personel açık bakiye (son kapatılan dönemden sonraki hareketler) ---
  const lastSettlementByWorker = new Map<string, number>();
  for (const s of workerSettlements) {
    const t = s.endDate.getTime();
    const cur = lastSettlementByWorker.get(s.workerId);
    if (!cur || t > cur) lastSettlementByWorker.set(s.workerId, t);
  }
  const workerMap = new Map(activeWorkers.map((w) => [w.id, w]));
  const earnedByWorker = new Map<string, number>();
  const paidByWorker = new Map<string, number>();
  for (const a of workerAttendances) {
    const lastSettle = lastSettlementByWorker.get(a.workerId);
    if (lastSettle && a.date.getTime() <= lastSettle) continue;
    const worker = workerMap.get(a.workerId);
    const { earned } = attendanceEarning(a, worker?.dailyRate || 0);
    earnedByWorker.set(a.workerId, (earnedByWorker.get(a.workerId) || 0) + earned);
  }
  for (const p of workerPayments) {
    const lastSettle = lastSettlementByWorker.get(p.workerId);
    if (lastSettle && p.date.getTime() <= lastSettle) continue;
    paidByWorker.set(p.workerId, (paidByWorker.get(p.workerId) || 0) + p.amount);
  }
  const workerOpenBalances = activeWorkers
    .map((w) => ({ id: w.id, name: w.fullName, balance: (earnedByWorker.get(w.id) || 0) - (paidByWorker.get(w.id) || 0) }))
    .filter((w) => w.balance > 0.005)
    .sort((a, b) => b.balance - a.balance);

  // --- Tedarikçi açık bakiye ---
  const purchaseTotalMap = new Map(supplierPurchaseSums.map((s) => [s.supplierId, s._sum.totalAmount || 0]));
  const paidTotalMap = new Map(supplierPaymentSums.map((s) => [s.supplierId, s._sum.amount || 0]));
  const supplierOpenBalances = activeSuppliers
    .map((s) => ({ id: s.id, name: s.name, balance: (purchaseTotalMap.get(s.id) || 0) - (paidTotalMap.get(s.id) || 0) }))
    .filter((s) => s.balance > 0.005)
    .sort((a, b) => b.balance - a.balance);

  const totalPersonnelDebt = workerOpenBalances.reduce((s, w) => s + w.balance, 0);
  const totalSupplierDebt = supplierOpenBalances.reduce((s, w) => s + w.balance, 0);

  const todayAttendanceCounts = todayAttendance.reduce((acc: Record<string, number>, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  const projectProfits = jobsForProfit.map((j) => {
    const revenue = j.payments.reduce((s, p) => s + p.tutar, 0);
    const cost = j.laborCostTotal + j.materialCostTotal;
    return {
      id: j.id,
      name: j.firmaAdi || `${j.musteriAdi} ${j.musteriSoyadi || ''}`.trim(),
      refKodu: j.referansKodu,
      revenue,
      cost,
      profit: revenue - cost,
    };
  });
  const topProfitable = [...projectProfits].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topCostly = [...projectProfits].sort((a, b) => b.cost - a.cost).slice(0, 5);

  const monthlyTrend = months.map((m) => {
    const inRange = trendPayments.filter((p) => p.tarih >= m.start && p.tarih <= m.end);
    const income = inRange.filter((p) => p.tip === 'Tahsilat').reduce((s, p) => s + p.tutar, 0);
    const expense = inRange.filter((p) => p.tip === 'Gider').reduce((s, p) => s + p.tutar, 0);
    return { label: m.label, income, expense };
  });

  const monthlyIncome = monthlyIncomeAgg._sum.tutar || 0;
  const monthlyExpense = monthlyExpenseAgg._sum.tutar || 0;
  const netCash = monthlyIncome - monthlyExpense - totalPersonnelDebt - totalSupplierDebt;

  return {
    stats: {
      totalJobs,
      activeJobs,
      monthlyIncome,
      monthlyExpense,
      overduePayments: overdueList.length,
      pendingContracts,
      totalPersonnelDebt,
      totalSupplierDebt,
      netCash,
    },
    recentActivities,
    upcomingPayments,
    overdueList,
    recentJobs,
    workerOpenBalances: workerOpenBalances.slice(0, 6),
    supplierOpenBalances: supplierOpenBalances.slice(0, 6),
    todayAttendanceCounts,
    topProfitable,
    topCostly,
    monthlyTrend,
  };
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const data = await getDashboardStats();

  return <DashboardClient data={data} userName={session.user?.name || ''} />;
}
