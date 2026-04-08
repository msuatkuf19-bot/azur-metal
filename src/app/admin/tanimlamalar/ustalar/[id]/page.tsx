import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import WorkerAttendanceClient from './WorkerAttendanceClient';

async function getWorkerFullData(id: string) {
  const worker = await prisma.worker.findUnique({
    where: { id },
  });

  if (!worker) notFound();

  const [attendances, workerPayments, workEntries] = await Promise.all([
    prisma.attendance.findMany({
      where: { workerId: id },
      orderBy: { date: 'desc' },
    }),
    prisma.workerPayment.findMany({
      where: { workerId: id },
      orderBy: { date: 'desc' },
    }),
    prisma.workEntry.findMany({
      where: { workerId: id },
      include: {
        job: {
          select: {
            id: true,
            referansKodu: true,
            musteriAdi: true,
            firmaAdi: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    }),
  ]);

  // Kazanç hesaplama (yoklama/yevmiye bazlı)
  const fullDays = attendances.filter(a => a.type === 'FULL_DAY').length;
  const halfDays = attendances.filter(a => a.type === 'HALF_DAY').length;
  const totalExtras = attendances.reduce((sum, a) => sum + a.extraAmount, 0);
  const attendanceEarned = (fullDays * worker.dailyRate) + (halfDays * worker.dailyRate / 2) + totalExtras;

  // İşçilik kayıtlarından kazanç
  const workEntryEarned = workEntries.reduce((sum, e) => sum + e.totalAmount, 0);
  const totalHours = workEntries.reduce((sum, e) => sum + e.hours, 0);

  const totalEarned = attendanceEarned + workEntryEarned;
  const totalPaid = workerPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalEarned - totalPaid;

  // Bu ay hesaplama
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthAttendances = attendances.filter(a => a.date >= startOfMonth);
  const thisMonthFull = thisMonthAttendances.filter(a => a.type === 'FULL_DAY').length;
  const thisMonthHalf = thisMonthAttendances.filter(a => a.type === 'HALF_DAY').length;
  const thisMonthExtras = thisMonthAttendances.reduce((sum, a) => sum + a.extraAmount, 0);
  const thisMonthEarned = (thisMonthFull * worker.dailyRate) + (thisMonthHalf * worker.dailyRate / 2) + thisMonthExtras;

  // Serialize
  const serialize = (obj: any) => ({
    ...obj,
    date: obj.date?.toISOString?.() ?? obj.date,
    createdAt: obj.createdAt?.toISOString?.() ?? obj.createdAt,
    updatedAt: obj.updatedAt?.toISOString?.() ?? obj.updatedAt,
  });

  return {
    worker: {
      ...worker,
      createdAt: worker.createdAt.toISOString(),
      updatedAt: worker.updatedAt.toISOString(),
    },
    attendances: attendances.map(serialize),
    workerPayments: workerPayments.map(serialize),
    workEntries: workEntries.map(e => ({
      ...serialize(e),
      job: e.job,
    })),
    summary: {
      fullDays,
      halfDays,
      totalExtras,
      attendanceEarned,
      workEntryEarned,
      totalHours,
      totalEarned,
      totalPaid,
      balance,
      thisMonth: {
        fullDays: thisMonthFull,
        halfDays: thisMonthHalf,
        extras: thisMonthExtras,
        earned: thisMonthEarned,
      },
    },
  };
}

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWorkerFullData(id);
  return <WorkerAttendanceClient data={data} />;
}
