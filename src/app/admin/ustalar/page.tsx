import { prisma } from '@/lib/prisma';
import MastersListClient from './MastersListClient';

async function getMasters() {
  const masters = await prisma.master.findMany({
    orderBy: { adSoyad: 'asc' },
    include: {
      workLogs: {
        select: {
          toplamTutar: true,
          toplamSaat: true,
        },
      },
      payments: {
        where: {
          tip: 'Gider',
          taraf: 'Usta',
        },
        select: {
          tutar: true,
        },
      },
    },
  });

  // Her usta için özet hesapla
  const mastersWithSummary = masters.map((master) => {
    const totalEarned = master.workLogs.reduce((sum, log) => sum + log.toplamTutar, 0);
    const totalPaid = master.payments.reduce((sum, payment) => sum + payment.tutar, 0);
    const totalHours = master.workLogs.reduce((sum, log) => sum + log.toplamSaat, 0);
    const remainingDebt = totalEarned - totalPaid;

    return {
      ...master,
      summary: {
        totalEarned,
        totalPaid,
        totalHours,
        remainingDebt,
      },
    };
  });

  return mastersWithSummary;
}

export default async function MastersPage() {
  const masters = await getMasters();

  return <MastersListClient masters={masters} />;
}
