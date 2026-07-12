import { prisma } from './prisma';
import { ATTENDANCE_TYPE_LABELS, ATTENDANCE_TYPE_MULTIPLIERS, WORKER_PAYMENT_TYPE_LABELS, type AttendanceType } from './constants';

// ========================================
// PERSONEL CARİ HESAP MOTORU
// Bakiye asla veritabanında saklanmaz; her zaman
// yoklama + işçilik + ödeme hareketlerinden hesaplanır.
// ========================================

export interface WorkerLedgerEntry {
  id: string;
  sourceId: string;
  kind: 'ATTENDANCE' | 'WORK_ENTRY' | 'PAYMENT' | 'SETTLEMENT';
  date: string; // ISO
  label: string;
  description: string;
  jobId: string | null;
  jobName: string | null;
  debit: number;   // Firmanın personele borcunu artırır (hakediş)
  credit: number;  // Ödeme (borcu azaltır)
  balance: number; // Hareket sonrası bakiye
  createdById: string | null;
  meta?: Record<string, any>;
}

export function attendanceEarning(a: {
  type: string;
  dayMultiplier: number | null;
  dailyRateSnapshot: number | null;
  extraAmount: number;
}, workerDailyRate: number): { multiplier: number; rate: number; earned: number } {
  const multiplier = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 1;
  const rate = a.dailyRateSnapshot || workerDailyRate;
  return { multiplier, rate, earned: multiplier * rate + (a.extraAmount || 0) };
}

function jobDisplayName(job: { firmaAdi: string | null; musteriAdi: string; musteriSoyadi?: string | null } | null | undefined): string | null {
  if (!job) return null;
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export async function getWorkerAccount(workerId: string) {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) return null;

  const jobSelect = { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true } };

  const [attendances, payments, workEntries, settlementPeriods] = await Promise.all([
    prisma.attendance.findMany({ where: { workerId }, include: { job: jobSelect }, orderBy: { date: 'asc' } }),
    prisma.workerPayment.findMany({ where: { workerId }, include: { job: jobSelect }, orderBy: { date: 'asc' } }),
    prisma.workEntry.findMany({ where: { workerId }, include: { job: jobSelect }, orderBy: { date: 'asc' } }),
    prisma.workerSettlementPeriod.findMany({ where: { workerId }, orderBy: { endDate: 'asc' } }),
  ]);

  // --- Cari hareketleri oluştur ---
  type RawEvent = Omit<WorkerLedgerEntry, 'balance'> & { sortDate: number; sortOrder: number };
  const events: RawEvent[] = [];

  for (const a of attendances) {
    const { multiplier, rate, earned } = attendanceEarning(a, worker.dailyRate);
    const typeLabel = ATTENDANCE_TYPE_LABELS[a.type as AttendanceType] || a.type;
    const parts = [`${typeLabel} (${multiplier} gün × ${rate.toLocaleString('tr-TR')} ₺)`];
    if (a.extraAmount > 0) parts.push(`Ekstra: ${a.extraAmount.toLocaleString('tr-TR')} ₺${a.extraDescription ? ' — ' + a.extraDescription : ''}`);
    if (a.note) parts.push(a.note);
    events.push({
      id: `att-${a.id}`,
      sourceId: a.id,
      kind: 'ATTENDANCE',
      date: a.date.toISOString(),
      label: typeLabel,
      description: parts.join(' • '),
      jobId: a.jobId,
      jobName: jobDisplayName(a.job),
      debit: earned,
      credit: 0,
      createdById: a.createdById,
      sortDate: a.date.getTime(),
      sortOrder: 0,
      meta: { type: a.type, multiplier, rate, extraAmount: a.extraAmount, extraDescription: a.extraDescription, startTime: a.startTime, endTime: a.endTime },
    });
  }

  for (const e of workEntries) {
    events.push({
      id: `we-${e.id}`,
      sourceId: e.id,
      kind: 'WORK_ENTRY',
      date: e.date.toISOString(),
      label: 'İşçilik Kaydı',
      description: `${e.hours} gün × ${e.hourlyRate.toLocaleString('tr-TR')} ₺${e.description ? ' — ' + e.description : ''}`,
      jobId: e.jobId,
      jobName: jobDisplayName(e.job),
      debit: e.totalAmount,
      credit: 0,
      createdById: null,
      sortDate: e.date.getTime(),
      sortOrder: 1,
      meta: { hours: e.hours, rate: e.hourlyRate },
    });
  }

  for (const p of payments) {
    const typeLabel = WORKER_PAYMENT_TYPE_LABELS[p.paymentType as keyof typeof WORKER_PAYMENT_TYPE_LABELS] || p.paymentType;
    events.push({
      id: `pay-${p.id}`,
      sourceId: p.id,
      kind: 'PAYMENT',
      date: p.date.toISOString(),
      label: typeLabel,
      description: p.description || typeLabel,
      jobId: p.jobId,
      jobName: jobDisplayName(p.job),
      debit: 0,
      credit: p.amount,
      createdById: p.createdById,
      sortDate: p.date.getTime(),
      sortOrder: 2,
      meta: { paymentType: p.paymentType, paymentMethod: p.paymentMethod },
    });
  }

  for (const s of settlementPeriods) {
    events.push({
      id: `set-${s.id}`,
      sourceId: s.id,
      kind: 'SETTLEMENT',
      date: (s.closedAt || s.endDate).toISOString(),
      label: 'Dönem Kapatma',
      description: `${s.startDate.toLocaleDateString('tr-TR')} – ${s.endDate.toLocaleDateString('tr-TR')} dönemi kapatıldı${s.notes ? ' — ' + s.notes : ''}`,
      jobId: null,
      jobName: null,
      debit: 0,
      credit: 0,
      createdById: s.closedByUserId,
      sortDate: s.endDate.getTime(),
      sortOrder: 3,
      meta: { status: s.status, balance: s.balance, earnedAmount: s.earnedAmount, paidAmount: s.paidAmount },
    });
  }

  events.sort((x, y) => x.sortDate - y.sortDate || x.sortOrder - y.sortOrder);

  let running = 0;
  const ledger: WorkerLedgerEntry[] = events.map((e) => {
    running += e.debit - e.credit;
    const { sortDate, sortOrder, ...rest } = e;
    return { ...rest, balance: running };
  });

  // --- Genel toplamlar ---
  const totalEarned = events.reduce((s, e) => s + e.debit, 0);
  const totalPaid = events.reduce((s, e) => s + e.credit, 0);
  const balance = totalEarned - totalPaid;

  // --- Açık dönem (son kapatılan dönemden sonrası) ---
  const lastPeriod = settlementPeriods[settlementPeriods.length - 1] || null;
  const openStart = lastPeriod ? lastPeriod.endDate.getTime() : null;
  const isOpenEvent = (e: RawEvent) => (openStart === null ? true : e.sortDate > openStart);

  const openEvents = events.filter((e) => e.kind !== 'SETTLEMENT' && isOpenEvent(e));
  const openEarned = openEvents.reduce((s, e) => s + e.debit, 0);
  const openPaid = openEvents.reduce((s, e) => s + e.credit, 0);
  const openBalance = openEarned - openPaid;

  // Kapalı dönemlerden devreden bakiye (kapatılırken ödenmemiş kısım)
  const carriedBalance = settlementPeriods.reduce((s, p) => s + p.balance, 0);
  const closedEarned = settlementPeriods.reduce((s, p) => s + p.earnedAmount, 0);

  // Açık dönem gün istatistikleri
  const openAttendances = attendances.filter((a) => (openStart === null ? true : a.date.getTime() > openStart));
  const openWorkedDays = openAttendances.reduce((s, a) => s + attendanceEarning(a, worker.dailyRate).multiplier, 0);
  const openExtras = openAttendances.reduce((s, a) => s + (a.extraAmount || 0), 0);
  const openFirstDate = openAttendances[0]?.date?.toISOString() || null;

  return {
    worker,
    attendances,
    payments,
    workEntries,
    settlementPeriods,
    ledger,
    summary: {
      totalEarned,
      totalPaid,
      balance,
      openEarned,
      openPaid,
      openBalance,
      openWorkedDays,
      openExtras,
      openStartDate: openStart ? new Date(openStart).toISOString() : openFirstDate,
      carriedBalance,
      closedEarned,
    },
  };
}

export type WorkerAccount = NonNullable<Awaited<ReturnType<typeof getWorkerAccount>>>;
