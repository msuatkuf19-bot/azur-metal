import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { formatCurrency } from '@/lib/utils';

async function getDashboardStats() {
  // İş emirleri istatistikleri
  const totalJobs = await prisma.businessJob.count();
  const activeJobs = await prisma.businessJob.count({
    where: {
      durum: {
        notIn: ['Tamamlandi', 'Iptal'],
      },
    },
  });

  // Bu ay tahsilatlar
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const monthlyIncome = await prisma.payment.aggregate({
    where: {
      tip: 'Tahsilat',
      tarih: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      tutar: true,
    },
  });

  const monthlyExpense = await prisma.payment.aggregate({
    where: {
      tip: 'Gider',
      tarih: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      tutar: true,
    },
  });

  // Geciken ödemeler
  const overduePayments = await prisma.paymentPlan.count({
    where: {
      durum: 'Bekliyor',
      vadeTarihi: {
        lt: new Date(),
      },
    },
  });

  // İmza bekleyen sözleşmeler
  const pendingContracts = await prisma.contract.count({
    where: {
      durum: {
        in: ['Taslak', 'ImzayaGonderildi'],
      },
    },
  });

  // Son aktiviteler
  const recentActivities = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      job: true,
    },
  });

  // Yaklaşan ödemeler
  const upcomingPayments = await prisma.paymentPlan.findMany({
    where: {
      durum: 'Bekliyor',
      vadeTarihi: {
        gte: new Date(),
        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
      },
    },
    include: {
      job: true,
    },
    orderBy: { vadeTarihi: 'asc' },
    take: 5,
  });

  // Son iş emirleri
  const recentJobs = await prisma.businessJob.findMany({
    take: 5,
    orderBy: { olusturmaTarihi: 'desc' },
  });

  return {
    stats: {
      totalJobs,
      activeJobs,
      monthlyIncome: monthlyIncome._sum.tutar || 0,
      monthlyExpense: monthlyExpense._sum.tutar || 0,
      overduePayments,
      pendingContracts,
    },
    recentActivities,
    upcomingPayments,
    recentJobs,
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
