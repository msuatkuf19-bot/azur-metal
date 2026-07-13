'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input, TextArea } from '@/components/ui/Input';
import {
  WORKER_ROLE_LABELS,
  WORKER_ROLE_COLORS,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_MULTIPLIERS,
  ATTENDANCE_TYPE_OPTIONS,
  ATTENDANCE_CALENDAR_COLORS,
  ATTENDANCE_TYPE_COLORS,
  WORKER_PAYMENT_TYPE_LABELS,
  WORKER_PAYMENT_TYPE_COLORS,
  PAYMENT_METHOD_LABELS,
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_STATUS_COLORS,
  workerBalanceStatus,
  type AttendanceType,
} from '@/lib/constants';
import { formatCurrency, formatDate, formatPhone, parseMoney } from '@/lib/utils';
import { createAttendance, updateAttendance, deleteAttendance } from '@/app/actions/attendance';
import { confirmDouble } from '@/components/ui/DeleteConfirmDialog';
import { createWorkerPayment, updateWorkerPayment, deleteWorkerPayment } from '@/app/actions/worker-payments';
import { closeWorkerPeriod, reopenSettlementPeriod } from '@/app/actions/settlement-periods';
import { updateWorker } from '@/app/actions/workers';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';
import toast from 'react-hot-toast';

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const LEDGER_KIND_LABELS: Record<string, string> = {
  ATTENDANCE: 'Yoklama',
  WORK_ENTRY: 'İşçilik',
  PAYMENT: 'Ödeme',
  SETTLEMENT: 'Dönem',
};

type TabId = 'genel' | 'yoklama' | 'cari' | 'odemeler' | 'projeler' | 'donemler';

const TABS: { id: TabId; label: string }[] = [
  { id: 'genel', label: 'Genel Bakış' },
  { id: 'yoklama', label: 'Yoklama' },
  { id: 'cari', label: 'Cari Hareketler' },
  { id: 'odemeler', label: 'Ödemeler' },
  { id: 'projeler', label: 'Projeler' },
  { id: 'donemler', label: 'Dönemler' },
];

export default function WorkerAttendanceClient({ data }: { data: any }) {
  const router = useRouter();
  const { worker, attendances, payments, workEntries, settlementPeriods, ledger, summary, activeJobs } = data;

  const [activeTab, setActiveTab] = useState<TabId>('genel');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isLoading, setIsLoading] = useState(false);

  // Drawer state
  const [attendanceDrawer, setAttendanceDrawer] = useState<{ open: boolean; editing: any | null; date: string }>({ open: false, editing: null, date: '' });
  const [paymentDrawer, setPaymentDrawer] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [settlementDrawerOpen, setSettlementDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState('');

  // ============ AY BAZLI HESAPLAR ============
  const monthAttendances = useMemo(() => {
    return attendances.filter((a: any) => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [attendances, selectedMonth, selectedYear]);

  const monthStats = useMemo(() => {
    const counts: Record<string, number> = { NONE: 0, HALF_DAY: 0, FULL_DAY: 0, DAY_1_5: 0, DAY_2: 0 };
    let dayEquivalent = 0;
    let normalEarn = 0;
    let extras = 0;
    for (const a of monthAttendances) {
      counts[a.type] = (counts[a.type] || 0) + 1;
      const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
      const rate = a.dailyRateSnapshot || worker.dailyRate;
      dayEquivalent += mult;
      normalEarn += mult * rate;
      extras += a.extraAmount || 0;
    }
    const attended = monthAttendances.filter((a: any) => a.type !== 'NONE').length;
    const monthPaid = payments
      .filter((p: any) => {
        const d = new Date(p.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      })
      .reduce((s: number, p: any) => s + p.amount, 0);
    return { counts, dayEquivalent, normalEarn, extras, totalEarn: normalEarn + extras, attended, monthPaid };
  }, [monthAttendances, payments, selectedMonth, selectedYear, worker.dailyRate]);

  // ============ TAKVİM ============
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstOffset = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7; // Pazartesi başlangıç
    const cells: ({ day: number; dateStr: string; attendance: any | null } | null)[] = [];
    for (let i = 0; i < firstOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const att = monthAttendances.find((a: any) => new Date(a.date).getDate() === d) || null;
      cells.push({ day: d, dateStr, attendance: att });
    }
    return cells;
  }, [selectedYear, selectedMonth, monthAttendances]);

  // ============ PROJE KIRILIMI ============
  const projectSummary = useMemo(() => {
    const map = new Map<string, any>();
    const ensure = (jobId: string, job: any) => {
      if (!map.has(jobId)) {
        map.set(jobId, {
          jobId,
          name: job?.firmaAdi || job?.musteriAdi || 'Bilinmeyen',
          customer: job?.musteriAdi || '-',
          refKodu: job?.referansKodu || '',
          days: 0, normalEarn: 0, extras: 0, total: 0,
          firstDate: null as string | null, lastDate: null as string | null,
        });
      }
      return map.get(jobId);
    };
    for (const a of attendances) {
      if (!a.jobId) continue;
      const p = ensure(a.jobId, a.job);
      const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
      const rate = a.dailyRateSnapshot || worker.dailyRate;
      p.days += mult;
      p.normalEarn += mult * rate;
      p.extras += a.extraAmount || 0;
      p.total += mult * rate + (a.extraAmount || 0);
      if (!p.firstDate || a.date < p.firstDate) p.firstDate = a.date;
      if (!p.lastDate || a.date > p.lastDate) p.lastDate = a.date;
    }
    for (const e of workEntries) {
      if (!e.jobId) continue;
      const p = ensure(e.jobId, e.job);
      p.days += e.hours;
      p.normalEarn += e.totalAmount;
      p.total += e.totalAmount;
      if (!p.firstDate || e.date < p.firstDate) p.firstDate = e.date;
      if (!p.lastDate || e.date > p.lastDate) p.lastDate = e.date;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [attendances, workEntries, worker.dailyRate]);

  const filteredLedger = useMemo(() => {
    const list = ledgerFilter ? ledger.filter((l: any) => l.kind === ledgerFilter) : ledger;
    return [...list].reverse(); // En yeni üstte
  }, [ledger, ledgerFilter]);

  const balanceStatus = workerBalanceStatus(summary.openBalance);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else setSelectedMonth(selectedMonth - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else setSelectedMonth(selectedMonth + 1);
  };

  // ============ PDF RAPORLAR ============
  const monthLabel = `${MONTHS[selectedMonth]} ${selectedYear}`;

  const exportMonthlyReport = () => {
    const sections: PdfSection[] = [
      {
        title: 'Personel Bilgileri',
        type: 'info-grid',
        data: [
          { label: 'Ad Soyad', value: worker.fullName },
          { label: 'Rol', value: WORKER_ROLE_LABELS[worker.roleType as keyof typeof WORKER_ROLE_LABELS] || worker.roleType },
          { label: 'Telefon', value: worker.phone ? formatPhone(worker.phone) : '-' },
          { label: 'Yevmiye', value: formatCurrency(worker.dailyRate) + '/gün' },
          { label: 'Dönem', value: monthLabel },
          { label: 'Durum', value: worker.isActive ? 'Aktif' : 'Pasif' },
        ],
      },
      {
        title: `${monthLabel} Özeti`,
        type: 'summary-cards',
        data: [
          { label: 'Gelinen Gün', value: monthStats.attended.toString(), color: 'blue' },
          { label: 'Gün Karşılığı', value: monthStats.dayEquivalent.toLocaleString('tr-TR'), color: 'blue' },
          { label: 'Normal Hakediş', value: formatCurrency(monthStats.normalEarn), color: 'neutral' },
          { label: 'Ekstra', value: formatCurrency(monthStats.extras), color: 'orange' },
          { label: 'Toplam Hakediş', value: formatCurrency(monthStats.totalEarn), color: 'positive' },
          { label: 'Ay İçi Ödeme', value: formatCurrency(monthStats.monthPaid), color: 'orange' },
          { label: 'Açık Bakiye', value: formatCurrency(summary.openBalance), color: summary.openBalance > 0 ? 'negative' : 'neutral' },
        ],
      },
      { type: 'divider' },
      {
        title: `Günlük Yoklama Listesi (${monthAttendances.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Çalışma', key: 'tur' },
            { header: 'Proje', key: 'proje' },
            { header: 'Yevmiye', key: 'yevmiye', align: 'right' as const },
            { header: 'Ekstra', key: 'ekstra', align: 'right' as const },
            { header: 'Hakediş', key: 'hakedis', align: 'right' as const },
            { header: 'Not', key: 'not' },
          ],
          rows: [...monthAttendances].reverse().map((a: any) => {
            const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
            const rate = a.dailyRateSnapshot || worker.dailyRate;
            return {
              tarih: formatDate(a.date),
              tur: ATTENDANCE_TYPE_LABELS[a.type as AttendanceType] || a.type,
              proje: a.job ? (a.job.firmaAdi || a.job.musteriAdi) : '-',
              yevmiye: formatCurrency(rate),
              ekstra: a.extraAmount ? formatCurrency(a.extraAmount) : '-',
              hakedis: formatCurrency(mult * rate + (a.extraAmount || 0)),
              not: [a.extraDescription, a.note].filter(Boolean).join(' • ') || '-',
            };
          }),
          footer: {
            tarih: 'TOPLAM', tur: `${monthStats.dayEquivalent} gün`, proje: '', yevmiye: '',
            ekstra: formatCurrency(monthStats.extras),
            hakedis: formatCurrency(monthStats.totalEarn),
            not: '',
          },
        },
      },
      {
        title: 'Çalıştığı Projeler',
        type: 'table',
        data: {
          columns: [
            { header: 'Proje', key: 'proje', bold: true },
            { header: 'Gün', key: 'gun', align: 'right' as const },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: projectSummary.map((p) => ({
            proje: p.name,
            gun: p.days.toLocaleString('tr-TR'),
            toplam: formatCurrency(p.total),
          })),
        },
      },
    ];

    exportToPdf({ title: `Personel Aylık Raporu: ${worker.fullName}`, subtitle: monthLabel, sections });
  };

  const exportLedgerReport = () => {
    const sections: PdfSection[] = [
      {
        title: 'Cari Özet',
        type: 'summary-cards',
        data: [
          { label: 'Toplam Hakediş', value: formatCurrency(summary.totalEarned), color: 'positive' },
          { label: 'Toplam Ödeme', value: formatCurrency(summary.totalPaid), color: 'orange' },
          { label: 'Genel Bakiye', value: formatCurrency(summary.balance), color: summary.balance > 0 ? 'negative' : 'neutral' },
          { label: 'Açık Dönem Bakiyesi', value: formatCurrency(summary.openBalance), color: summary.openBalance > 0 ? 'negative' : 'neutral' },
        ],
      },
      { type: 'divider' },
      {
        title: `Cari Hareketler (${ledger.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'İşlem', key: 'islem', bold: true },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Proje', key: 'proje' },
            { header: 'Borç', key: 'borc', align: 'right' as const },
            { header: 'Ödeme', key: 'odeme', align: 'right' as const },
            { header: 'Bakiye', key: 'bakiye', align: 'right' as const },
          ],
          rows: ledger.map((l: any) => ({
            tarih: formatDate(l.date),
            islem: l.label,
            aciklama: l.description,
            proje: l.jobName || '-',
            borc: l.debit ? formatCurrency(l.debit) : '-',
            odeme: l.credit ? formatCurrency(l.credit) : '-',
            bakiye: formatCurrency(l.balance),
          })),
          footer: {
            tarih: 'TOPLAM', islem: '', aciklama: '', proje: '',
            borc: formatCurrency(summary.totalEarned),
            odeme: formatCurrency(summary.totalPaid),
            bakiye: formatCurrency(summary.balance),
          },
        },
      },
    ];

    exportToPdf({ title: `Personel Cari Ekstresi: ${worker.fullName}`, subtitle: 'Tüm hareketler', sections, orientation: 'landscape' });
  };

  const exportPeriodReport = (period: any) => {
    const sections: PdfSection[] = [
      {
        title: 'Dönem Bilgileri',
        type: 'info-grid',
        data: [
          { label: 'Personel', value: worker.fullName },
          { label: 'Dönem', value: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}` },
          { label: 'Durum', value: SETTLEMENT_STATUS_LABELS[period.status as keyof typeof SETTLEMENT_STATUS_LABELS] || period.status },
          { label: 'Kapanış Tarihi', value: period.closedAt ? formatDate(period.closedAt) : '-' },
          { label: 'Not', value: period.notes || '-' },
        ],
      },
      {
        title: 'Dönem Özeti',
        type: 'summary-cards',
        data: [
          { label: 'Çalışılan Gün', value: period.workedDays.toLocaleString('tr-TR'), color: 'blue' },
          { label: 'Ekstralar', value: formatCurrency(period.extraAmount), color: 'orange' },
          { label: 'Toplam Hakediş', value: formatCurrency(period.earnedAmount), color: 'positive' },
          { label: 'Toplam Ödeme', value: formatCurrency(period.paidAmount), color: 'orange' },
          { label: 'Kalan Bakiye', value: formatCurrency(period.balance), color: period.balance > 0 ? 'negative' : 'neutral' },
        ],
      },
    ];
    exportToPdf({ title: `Dönem Kapatma Raporu: ${worker.fullName}`, subtitle: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`, sections });
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/tanimlamalar/ustalar">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
          </Link>
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-700 font-bold text-xl">
              {worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{worker.fullName}</h1>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <Badge className={WORKER_ROLE_COLORS[worker.roleType as keyof typeof WORKER_ROLE_COLORS]}>
                {WORKER_ROLE_LABELS[worker.roleType as keyof typeof WORKER_ROLE_LABELS]}
              </Badge>
              <Badge className={worker.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                {worker.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
              <Badge className={`${balanceStatus.bg} ${balanceStatus.color}`}>{balanceStatus.label}</Badge>
              <span className="text-sm text-slate-500">{formatCurrency(worker.dailyRate)}/gün</span>
              {worker.phone && <span className="text-sm text-slate-500">• {formatPhone(worker.phone)}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportMonthlyReport}>Aylık Rapor</Button>
          <Button variant="secondary" onClick={exportLedgerReport}>Cari Ekstre</Button>
          <Button variant="secondary" onClick={() => setEditDrawerOpen(true)}>Düzenle</Button>
          {summary.openBalance > 0 && (
            <Button onClick={() => setPaymentDrawer({ open: true, editing: { quickAmount: summary.openBalance } })}>
              Hızlı Ödeme
            </Button>
          )}
          <Button variant="secondary" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setSettlementDrawerOpen(true)}>
            Hesabı Kapat
          </Button>
        </div>
      </div>

      {/* Ay seçici */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Önceki ay">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-semibold text-slate-900">{monthLabel}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Sonraki ay">
          <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Ay özeti kartları */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Gelinen Gün', value: monthStats.attended.toString(), sub: `Tam: ${monthStats.counts.FULL_DAY} • Yarım: ${monthStats.counts.HALF_DAY}${monthStats.counts.DAY_1_5 ? ` • 1,5: ${monthStats.counts.DAY_1_5}` : ''}${monthStats.counts.DAY_2 ? ` • 2G: ${monthStats.counts.DAY_2}` : ''}` },
          { label: 'Gün Karşılığı', value: monthStats.dayEquivalent.toLocaleString('tr-TR') },
          { label: 'Normal Hakediş', value: formatCurrency(monthStats.normalEarn) },
          { label: 'Ekstra Ücret', value: formatCurrency(monthStats.extras) },
          { label: 'Toplam Hakediş', value: formatCurrency(monthStats.totalEarn), accent: 'text-emerald-600' },
          { label: 'Ay İçi Ödeme', value: formatCurrency(monthStats.monthPaid), accent: 'text-orange-600' },
        ].map((c) => (
          <Card key={c.label}>
            <CardBody className="py-3">
              <p className="text-xs text-slate-500">{c.label}</p>
              <p className={`text-lg font-bold mt-0.5 ${(c as any).accent || 'text-slate-900'}`}>{c.value}</p>
              {(c as any).sub && <p className="text-[11px] text-slate-400 mt-0.5">{(c as any).sub}</p>}
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Cari özet kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Açık Dönem Hakedişi</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.openEarned)}</p>
            <p className="text-[11px] text-slate-400">{summary.openWorkedDays.toLocaleString('tr-TR')} gün{summary.openStartDate ? ` • ${formatDate(summary.openStartDate)} sonrası` : ''}</p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Açık Dönem Ödemesi</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.openPaid)}</p>
          </CardBody>
        </Card>
        <Card className={`border-l-4 ${balanceStatus.border}`}>
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Açık Bakiye</p>
            <p className={`text-lg font-bold ${balanceStatus.color}`}>{formatCurrency(summary.openBalance)}</p>
            <p className="text-[11px] text-slate-400">{balanceStatus.label}</p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-slate-300">
          <CardBody className="py-3">
            <p className="text-xs text-slate-500">Kapalı Dönemler</p>
            <p className="text-lg font-bold text-slate-900">{formatCurrency(summary.closedEarned)}</p>
            <p className="text-[11px] text-slate-400">{settlementPeriods.length} dönem{summary.carriedBalance !== 0 ? ` • Devreden: ${formatCurrency(summary.carriedBalance)}` : ''}</p>
          </CardBody>
        </Card>
      </div>

      {/* Sekmeler */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {t.id === 'donemler' && settlementPeriods.length > 0 && (
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-600 rounded-full px-1.5 py-0.5">{settlementPeriods.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ============ GENEL BAKIŞ ============ */}
      {activeTab === 'genel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Personel Bilgileri</h3></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Yevmiye</span><span className="font-semibold">{formatCurrency(worker.dailyRate)}/gün</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Telefon</span><span>{worker.phone ? formatPhone(worker.phone) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kayıt Tarihi</span><span>{formatDate(worker.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Toplam Yoklama</span><span>{attendances.length} kayıt</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Toplam Ödeme</span><span>{payments.length} kayıt</span></div>
              {worker.notes && (
                <div className="pt-2 border-t">
                  <p className="text-slate-500 mb-1">Notlar</p>
                  <p className="text-slate-800 whitespace-pre-line">{worker.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">Genel Cari Durum</h3></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Toplam Hakediş</span><span className="font-semibold text-emerald-600">{formatCurrency(summary.totalEarned)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Toplam Ödeme</span><span className="font-semibold text-orange-600">{formatCurrency(summary.totalPaid)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-slate-500">Genel Bakiye</span><span className={`font-bold ${workerBalanceStatus(summary.balance).color}`}>{formatCurrency(summary.balance)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Durum</span><Badge className={`${balanceStatus.bg} ${balanceStatus.color}`}>{balanceStatus.label}</Badge></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">Son Hareketler</h3></CardHeader>
            <CardBody className="p-0">
              {ledger.length === 0 ? (
                <p className="text-sm text-slate-500 p-4">Henüz hareket yok</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {[...ledger].reverse().slice(0, 6).map((l: any) => (
                    <li key={l.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{l.label}</p>
                        <p className="text-xs text-slate-400">{formatDate(l.date)}</p>
                      </div>
                      <span className={`font-semibold ${l.debit ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {l.debit ? '+' : '-'}{formatCurrency(l.debit || l.credit)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============ YOKLAMA ============ */}
      {activeTab === 'yoklama' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center flex-wrap gap-3 text-xs">
              {(['FULL_DAY', 'HALF_DAY', 'DAY_1_5', 'DAY_2', 'NONE'] as AttendanceType[]).map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${ATTENDANCE_CALENDAR_COLORS[t].split(' ')[0]}`} />
                  {ATTENDANCE_TYPE_LABELS[t]}
                </span>
              ))}
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                Ekstra ücretli
              </span>
            </div>
            <Button size="sm" onClick={() => setAttendanceDrawer({ open: true, editing: null, date: new Date().toISOString().split('T')[0] })}>
              + Yoklama Ekle
            </Button>
          </div>

          <Card>
            <CardBody>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-slate-400 mb-2">
                {WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {calendarCells.map((cell, i) => {
                  if (!cell) return <div key={`empty-${i}`} />;
                  const att = cell.attendance;
                  const color = att ? ATTENDANCE_CALENDAR_COLORS[att.type as AttendanceType] || 'bg-slate-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100';
                  return (
                    <button
                      key={cell.dateStr}
                      onClick={() => setAttendanceDrawer({ open: true, editing: att, date: cell.dateStr })}
                      className={`relative h-14 md:h-16 rounded-lg border text-sm font-medium transition-transform hover:scale-[1.03] ${color}`}
                      title={att ? `${ATTENDANCE_TYPE_LABELS[att.type as AttendanceType]}${att.extraAmount ? ` + ${formatCurrency(att.extraAmount)} ekstra` : ''}` : 'Yoklama ekle'}
                    >
                      <span className="absolute top-1 left-1.5 text-xs">{cell.day}</span>
                      {att && att.extraAmount > 0 && (
                        <span className="absolute top-1 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500 border border-white" />
                      )}
                      {att && (
                        <span className="absolute bottom-1 inset-x-0 text-[10px] leading-none opacity-90">
                          {att.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[att.type as AttendanceType]} gün
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Ay kayıtları listesi */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{monthLabel} Kayıtları</h3>
                <span className="text-sm text-slate-500">{monthAttendances.length} kayıt</span>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {monthAttendances.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500">Bu ay için henüz yoklama kaydı bulunmuyor.</p>
                  <Button size="sm" className="mt-3" onClick={() => setAttendanceDrawer({ open: true, editing: null, date: `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01` })}>
                    İlk yoklama kaydını ekle
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Çalışma</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Saat</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Ekstra</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Hakediş</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Açıklama</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthAttendances.map((a: any) => {
                        const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
                        const rate = a.dailyRateSnapshot || worker.dailyRate;
                        return (
                          <tr key={a.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2.5">{formatDate(a.date)}</td>
                            <td className="px-4 py-2.5">
                              <Badge className={ATTENDANCE_TYPE_COLORS[a.type as AttendanceType]}>{ATTENDANCE_TYPE_LABELS[a.type as AttendanceType]}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600">{a.job ? (a.job.firmaAdi || a.job.musteriAdi) : '-'}</td>
                            <td className="px-4 py-2.5 text-slate-500 text-xs">{a.startTime || a.endTime ? `${a.startTime || '?'} – ${a.endTime || '?'}` : '-'}</td>
                            <td className="px-4 py-2.5 text-right text-orange-600">{a.extraAmount ? formatCurrency(a.extraAmount) : '-'}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(mult * rate + (a.extraAmount || 0))}</td>
                            <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{[a.extraDescription, a.note].filter(Boolean).join(' • ') || '-'}</td>
                            <td className="px-4 py-2.5 text-right">
                              <Button variant="ghost" size="sm" onClick={() => setAttendanceDrawer({ open: true, editing: a, date: a.date.split('T')[0] })}>Düzenle</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============ CARİ HAREKETLER ============ */}
      {activeTab === 'cari' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold">Cari Hareketler</h3>
              <div className="flex items-center gap-2">
                <select
                  value={ledgerFilter}
                  onChange={(e) => setLedgerFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tüm Hareketler</option>
                  <option value="ATTENDANCE">Yoklama / Çalışma</option>
                  <option value="WORK_ENTRY">İşçilik Kaydı</option>
                  <option value="PAYMENT">Ödeme</option>
                  <option value="SETTLEMENT">Dönem Kapatma</option>
                </select>
                <Button variant="secondary" size="sm" onClick={exportLedgerReport}>Rapor Al</Button>
              </div>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {filteredLedger.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Hareket bulunamadı</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">İşlem</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Açıklama</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Borç</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Ödeme</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.map((l: any) => (
                      <tr key={l.id} className={`hover:bg-slate-50 ${l.kind === 'SETTLEMENT' ? 'bg-amber-50/60' : ''}`}>
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(l.date)}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={
                            l.kind === 'PAYMENT' ? 'bg-orange-100 text-orange-800'
                              : l.kind === 'SETTLEMENT' ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }>
                            {l.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[320px] truncate" title={l.description}>{l.description}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {l.jobId ? <Link href={`/admin/projeler/${l.jobId}`} className="text-blue-600 hover:underline">{l.jobName}</Link> : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{l.debit ? formatCurrency(l.debit) : '-'}</td>
                        <td className="px-4 py-2.5 text-right text-orange-600 font-medium">{l.credit ? formatCurrency(l.credit) : '-'}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${l.balance > 0 ? 'text-rose-600' : l.balance < 0 ? 'text-blue-600' : 'text-slate-600'}`}>{formatCurrency(l.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============ ÖDEMELER ============ */}
      {activeTab === 'odemeler' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ödemeler <span className="text-sm text-slate-400 font-normal">({payments.length})</span></h3>
              <Button size="sm" onClick={() => setPaymentDrawer({ open: true, editing: null })}>+ Ödeme Ekle</Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {payments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">Henüz ödeme kaydı bulunmuyor.</p>
                <Button size="sm" className="mt-3" onClick={() => setPaymentDrawer({ open: true, editing: null })}>İlk ödemeyi ekle</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tür</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Yöntem</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Açıklama</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Tutar</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(p.date)}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={WORKER_PAYMENT_TYPE_COLORS[p.paymentType as keyof typeof WORKER_PAYMENT_TYPE_COLORS] || 'bg-gray-100 text-gray-800'}>
                            {WORKER_PAYMENT_TYPE_LABELS[p.paymentType as keyof typeof WORKER_PAYMENT_TYPE_LABELS] || p.paymentType}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || p.paymentMethod}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.job ? (p.job.firmaAdi || p.job.musteriAdi) : '-'}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[240px] truncate">{p.description || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-orange-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => setPaymentDrawer({ open: true, editing: p })}>Düzenle</Button>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            if (!confirmDouble('Bu ödeme kaydı silinsin mi? Bakiye yeniden hesaplanacak.')) return;
                            const r = await deleteWorkerPayment(p.id);
                            if (r.success) { toast.success(r.message || 'Silindi'); router.refresh(); }
                            else toast.error(r.error || 'Hata');
                          }}>Sil</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============ PROJELER ============ */}
      {activeTab === 'projeler' && (
        <Card>
          <CardHeader><h3 className="font-semibold">Çalıştığı Projeler <span className="text-sm text-slate-400 font-normal">({projectSummary.length})</span></h3></CardHeader>
          <CardBody className="p-0">
            {projectSummary.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Bu personel henüz bir projede çalışmadı.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Müşteri</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Gün</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Normal Hakediş</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Ekstra</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">İlk / Son Çalışma</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectSummary.map((p) => (
                      <tr key={p.jobId} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/admin/projeler/${p.jobId}`)}>
                        <td className="px-4 py-2.5 font-medium text-blue-700">{p.name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.customer}</td>
                        <td className="px-4 py-2.5 text-right">{p.days.toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(p.normalEarn)}</td>
                        <td className="px-4 py-2.5 text-right text-orange-600">{p.extras ? formatCurrency(p.extras) : '-'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(p.total)}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{p.firstDate ? formatDate(p.firstDate) : '-'} → {p.lastDate ? formatDate(p.lastDate) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============ DÖNEMLER ============ */}
      {activeTab === 'donemler' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="secondary" className="border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => setSettlementDrawerOpen(true)}>
              Hesabı Kapat
            </Button>
          </div>
          {settlementPeriods.length === 0 ? (
            <Card>
              <CardBody className="text-center py-10">
                <p className="text-slate-500">Henüz kapatılmış dönem yok.</p>
                <p className="text-sm text-slate-400 mt-1">Personelin hesabını kapattığınızda dönem burada arşivlenir.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...settlementPeriods].reverse().map((s: any, idx: number) => (
                <Card key={s.id} className="border-l-4 border-l-slate-400">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{formatDate(s.startDate)} – {formatDate(s.endDate)}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Kapanış: {s.closedAt ? formatDate(s.closedAt) : '-'}</p>
                      </div>
                      <Badge className={SETTLEMENT_STATUS_COLORS[s.status as keyof typeof SETTLEMENT_STATUS_COLORS] || 'bg-gray-100 text-gray-800'}>
                        {SETTLEMENT_STATUS_LABELS[s.status as keyof typeof SETTLEMENT_STATUS_LABELS] || s.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Çalışılan Gün</span><span>{s.workedDays.toLocaleString('tr-TR')}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Ekstra</span><span>{formatCurrency(s.extraAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Hakediş</span><span className="text-emerald-600 font-medium">{formatCurrency(s.earnedAmount)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Ödeme</span><span className="text-orange-600 font-medium">{formatCurrency(s.paidAmount)}</span></div>
                      <div className="flex justify-between col-span-2 border-t pt-1.5"><span className="text-slate-500">Kalan Bakiye</span><span className={`font-bold ${s.balance > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{formatCurrency(s.balance)}</span></div>
                    </div>
                    {s.notes && <p className="text-xs text-slate-400 mt-2">{s.notes}</p>}
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button variant="secondary" size="sm" onClick={() => exportPeriodReport(s)}>Rapor Al</Button>
                      {idx === 0 && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                          if (!confirm('Bu dönem yeniden açılsın mı? Dönem hareketleri açık döneme aktarılır.')) return;
                          const r = await reopenSettlementPeriod(s.id);
                          if (r.success) { toast.success(r.message || 'Dönem yeniden açıldı'); router.refresh(); }
                          else toast.error(r.error || 'Hata');
                        }}>Yeniden Aç</Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ DRAWERS ============ */}
      <AttendanceDrawer
        state={attendanceDrawer}
        onClose={() => setAttendanceDrawer({ open: false, editing: null, date: '' })}
        worker={worker}
        activeJobs={activeJobs}
        onSaved={() => { setAttendanceDrawer({ open: false, editing: null, date: '' }); router.refresh(); }}
      />

      <PaymentDrawer
        state={paymentDrawer}
        onClose={() => setPaymentDrawer({ open: false, editing: null })}
        worker={worker}
        activeJobs={activeJobs}
        openBalance={summary.openBalance}
        onSaved={() => { setPaymentDrawer({ open: false, editing: null }); router.refresh(); }}
      />

      <SettlementDrawer
        open={settlementDrawerOpen}
        onClose={() => setSettlementDrawerOpen(false)}
        worker={worker}
        summary={summary}
        onSaved={() => { setSettlementDrawerOpen(false); router.refresh(); }}
        onReportOnly={() => {
          const period = {
            startDate: summary.openStartDate || new Date().toISOString(),
            endDate: new Date().toISOString(),
            workedDays: summary.openWorkedDays,
            earnedAmount: summary.openEarned,
            extraAmount: summary.openExtras,
            paidAmount: summary.openPaid,
            balance: summary.openBalance,
            status: 'OPEN',
            closedAt: null,
            notes: 'Açık dönem ön izleme raporu (kapatma yapılmadı)',
          };
          exportPeriodReport(period);
        }}
      />

      {/* Personel düzenleme */}
      <Drawer isOpen={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} title="Personel Düzenle">
        <EditWorkerForm
          worker={worker}
          isLoading={isLoading}
          onSubmit={async (form: any) => {
            setIsLoading(true);
            const r = await updateWorker(worker.id, { ...form, roleType: form.roleType as 'USTA' | 'ISCI' });
            setIsLoading(false);
            if (r.success) { toast.success('Personel güncellendi'); setEditDrawerOpen(false); router.refresh(); }
            else toast.error(r.error || 'Hata oluştu');
          }}
        />
      </Drawer>
    </div>
  );
}

// ============================================================
// YOKLAMA DRAWER
// ============================================================
function AttendanceDrawer({ state, onClose, worker, activeJobs, onSaved }: any) {
  const { open, editing, date } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  // Drawer her açılışta formu tazele
  const formKey = `${open}-${editing?.id || 'new'}-${date}`;
  const [lastKey, setLastKey] = useState('');
  if (open && lastKey !== formKey) {
    setLastKey(formKey);
    setForm({
      date: editing ? editing.date.split('T')[0] : date,
      type: editing?.type || 'FULL_DAY',
      jobId: editing?.jobId || '',
      dailyRate: (editing ? (editing.dailyRateSnapshot || worker.dailyRate) : worker.dailyRate).toString(),
      extraAmount: editing?.extraAmount ? editing.extraAmount.toString() : '',
      extraDescription: editing?.extraDescription || '',
      startTime: editing?.startTime || '',
      endTime: editing?.endTime || '',
      note: editing?.note || '',
    });
  }

  if (!form) return null;

  const mult = ATTENDANCE_TYPE_MULTIPLIERS[form.type as AttendanceType] ?? 0;
  const rate = parseMoney(form.dailyRate) || 0;
  const extra = parseMoney(form.extraAmount) || 0;
  const dailyTotal = mult * rate + extra;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const rateVal = parseMoney(form.dailyRate);
    if (isNaN(rateVal) || rateVal < 0) { toast.error('Geçerli bir yevmiye girin'); return; }

    setIsLoading(true);
    const payload = {
      workerId: worker.id,
      date: form.date,
      type: form.type,
      jobId: form.jobId || null,
      dailyRate: rateVal,
      extraAmount: form.extraAmount ? (parseMoney(form.extraAmount) || 0) : 0,
      extraDescription: form.extraDescription || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      note: form.note || undefined,
    };
    const r = editing
      ? await updateAttendance(editing.id, payload)
      : await createAttendance(payload as any);
    setIsLoading(false);
    if (r.success) { toast.success((r as any).message || 'Kaydedildi'); onSaved(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <Drawer isOpen={open} onClose={onClose} title={editing ? 'Yoklama Düzenle' : 'Yoklama Ekle'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Tarih" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Çalışma Türü</label>
          <div className="grid grid-cols-5 gap-1.5">
            {ATTENDANCE_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setForm({ ...form, type: o.value })}
                className={`px-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  form.type === o.value
                    ? ATTENDANCE_CALENDAR_COLORS[o.value] + ' ring-2 ring-offset-1 ring-blue-400'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İş Emri / Proje</label>
          <select
            value={form.jobId}
            onChange={(e) => setForm({ ...form, jobId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Proje seçilmedi</option>
            {activeJobs.map((j: any) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Yevmiye (₺)" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} placeholder="2000" required />
          <Input label="Ekstra Ücret (₺)" value={form.extraAmount} onChange={(e) => setForm({ ...form, extraAmount: e.target.value })} placeholder="0" />
        </div>

        <Input
          label="Ekstra Çalışma Açıklaması"
          value={form.extraDescription}
          onChange={(e) => setForm({ ...form, extraDescription: e.target.value })}
          placeholder='Ör: "Gece 22.00&apos;ye kadar çalıştı", "Pazar günü özel çalışma"...'
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Giriş Saati" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label="Çıkış Saati" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </div>

        <TextArea label="Genel Not" value={form.note} onChange={(e: any) => setForm({ ...form, note: e.target.value })} placeholder="İsteğe bağlı not..." />

        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Günlük Hakediş</span>
            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(dailyTotal)}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{mult} gün × {formatCurrency(rate)}{extra ? ` + ${formatCurrency(extra)} ekstra` : ''}</p>
        </div>

        <div className="flex space-x-3 pt-4 border-t">
          {editing && (
            <Button type="button" variant="danger" onClick={async () => {
              if (!confirmDouble('Bu yoklama kaydı silinsin mi?')) return;
              const r = await deleteAttendance(editing.id);
              if (r.success) { toast.success('Yoklama silindi'); onSaved(); }
              else toast.error(r.error || 'Hata');
            }}>Sil</Button>
          )}
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </div>
      </form>
    </Drawer>
  );
}

// ============================================================
// ÖDEME DRAWER
// ============================================================
function PaymentDrawer({ state, onClose, worker, activeJobs, openBalance, onSaved }: any) {
  const { open, editing } = state;
  const isEdit = editing && editing.id;
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  const formKey = `${open}-${editing?.id || editing?.quickAmount || 'new'}`;
  const [lastKey, setLastKey] = useState('');
  if (open && lastKey !== formKey) {
    setLastKey(formKey);
    setForm({
      amount: isEdit ? editing.amount.toString() : (editing?.quickAmount ? editing.quickAmount.toString() : ''),
      date: isEdit ? editing.date.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentType: isEdit ? editing.paymentType : 'HAKEDIS',
      paymentMethod: isEdit ? editing.paymentMethod : 'Nakit',
      jobId: isEdit ? (editing.jobId || '') : '',
      description: isEdit ? (editing.description || '') : (editing?.quickAmount ? `${worker.fullName} — kalan bakiye ödemesi` : ''),
    });
  }

  if (!form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    const amount = parseMoney(form.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Tutar sıfırdan büyük olmalı'); return; }

    setIsLoading(true);
    const payload = {
      workerId: worker.id,
      amount,
      date: form.date,
      paymentType: form.paymentType,
      paymentMethod: form.paymentMethod,
      jobId: form.jobId || null,
      description: form.description || undefined,
    };
    const r = isEdit ? await updateWorkerPayment(editing.id, payload) : await createWorkerPayment(payload as any);
    setIsLoading(false);
    if (r.success) { toast.success((r as any).message || 'Ödeme kaydedildi'); onSaved(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <Drawer isOpen={open} onClose={onClose} title={isEdit ? 'Ödeme Düzenle' : 'Ödeme Ekle'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {openBalance > 0 && !isEdit && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center justify-between">
            <span>Açık bakiye: <strong>{formatCurrency(openBalance)}</strong></span>
            <button type="button" className="text-blue-600 underline text-xs" onClick={() => setForm({ ...form, amount: openBalance.toString() })}>
              Tutarı doldur
            </button>
          </div>
        )}

        <Input label="Tutar (₺)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Ör: 5.000 veya 5000,50" required />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Tarih" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Türü</label>
            <select
              value={form.paymentType}
              onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(WORKER_PAYMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Nakit">Nakit</option>
              <option value="HavaleEFT">Banka Havalesi / EFT</option>
              <option value="KrediKarti">Kredi Kartı</option>
              <option value="Diger">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İlgili Proje</label>
            <select
              value={form.jobId}
              onChange={(e) => setForm({ ...form, jobId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Proje seçilmedi</option>
              {activeJobs.map((j: any) => <option key={j.id} value={j.id}>{j.label}</option>)}
            </select>
          </div>
        </div>

        <TextArea label="Açıklama" value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Ödeme açıklaması..." />

        <div className="flex space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
        </div>
      </form>
    </Drawer>
  );
}

// ============================================================
// HESAP KAPATMA DRAWER
// ============================================================
function SettlementDrawer({ open, onClose, worker, summary, onSaved, onReportOnly }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<'PAY_AND_CLOSE' | 'CLOSE_WITH_BALANCE' | 'REPORT_ONLY'>('PAY_AND_CLOSE');
  const [paymentMethod, setPaymentMethod] = useState('Nakit');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (action === 'REPORT_ONLY') { onReportOnly(); return; }
    if (isLoading) return;
    setIsLoading(true);
    const r = await closeWorkerPeriod({
      workerId: worker.id,
      action,
      paymentMethod: paymentMethod as any,
      notes: notes || undefined,
    });
    setIsLoading(false);
    if (r.success) { toast.success((r as any).message || 'Dönem kapatıldı'); onSaved(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <Drawer isOpen={open} onClose={onClose} title="Hesap Kapatma" size="md">
      <div className="space-y-5">
        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Dönem Başlangıcı</span><span className="font-medium">{summary.openStartDate ? formatDate(summary.openStartDate) : '-'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Dönem Bitişi</span><span className="font-medium">{formatDate(new Date().toISOString())}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Toplam Çalışma Günü</span><span className="font-medium">{summary.openWorkedDays.toLocaleString('tr-TR')}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Normal Hakediş</span><span className="font-medium">{formatCurrency(summary.openEarned - summary.openExtras)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Ekstra Ücretler</span><span className="font-medium text-orange-600">{formatCurrency(summary.openExtras)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Toplam Hakediş</span><span className="font-semibold text-emerald-600">{formatCurrency(summary.openEarned)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Toplam Ödeme</span><span className="font-semibold text-orange-600">{formatCurrency(summary.openPaid)}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="text-slate-600 font-medium">Kalan Bakiye</span><span className={`font-bold text-lg ${summary.openBalance > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatCurrency(summary.openBalance)}</span></div>
        </div>

        <div className="space-y-2">
          {[
            { v: 'PAY_AND_CLOSE', title: 'Kalan bakiyeyi öde ve dönemi kapat', desc: summary.openBalance > 0 ? `${formatCurrency(summary.openBalance)} tutarında ödeme kaydı oluşturulur, dönem sıfır bakiyeyle kapanır.` : 'Ödenecek bakiye yok; dönem mevcut haliyle kapanır.' },
            { v: 'CLOSE_WITH_BALANCE', title: 'Mevcut bakiye ile dönemi kapat', desc: 'Ödeme yapılmaz. Bakiye dönem kaydında arşivlenir.' },
            { v: 'REPORT_ONLY', title: 'Sadece rapor oluştur', desc: 'Kapatma yapılmaz, açık dönemin PDF raporu alınır.' },
          ].map((o) => (
            <label key={o.v} className={`block border rounded-xl p-3 cursor-pointer transition-colors ${action === o.v ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div className="flex items-start gap-3">
                <input type="radio" name="settleAction" checked={action === o.v} onChange={() => setAction(o.v as any)} className="mt-1" />
                <div>
                  <p className="font-medium text-slate-900 text-sm">{o.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{o.desc}</p>
                </div>
              </div>
            </label>
          ))}
        </div>

        {action === 'PAY_AND_CLOSE' && summary.openBalance > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Nakit">Nakit</option>
              <option value="HavaleEFT">Banka Havalesi / EFT</option>
              <option value="KrediKarti">Kredi Kartı</option>
              <option value="Diger">Diğer</option>
            </select>
          </div>
        )}

        {action !== 'REPORT_ONLY' && (
          <TextArea label="Kapanış Notu" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="İsteğe bağlı kapanış notu..." />
        )}

        <div className="flex space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
          <Button type="button" className="flex-1" disabled={isLoading} onClick={handleSubmit}>
            {isLoading ? 'İşleniyor...' : action === 'REPORT_ONLY' ? 'Rapor Oluştur' : 'Dönemi Kapat'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ============================================================
// PERSONEL DÜZENLEME FORMU
// ============================================================
function EditWorkerForm({ worker, isLoading, onSubmit }: any) {
  const [form, setForm] = useState({
    fullName: worker.fullName,
    phone: worker.phone || '',
    roleType: worker.roleType,
    hourlyRateDefault: worker.hourlyRateDefault,
    dailyRate: worker.dailyRate || 0,
    notes: worker.notes || '',
    isActive: worker.isActive,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
      <Input label="Ad Soyad" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
      <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0532 123 45 67" />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
        <select
          value={form.roleType}
          onChange={(e) => setForm({ ...form, roleType: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="USTA">Usta</option>
          <option value="ISCI">İşçi</option>
        </select>
      </div>
      <Input
        label="Yevmiye (₺)"
        type="number"
        min="0"
        step="0.01"
        value={form.dailyRate}
        onChange={(e) => setForm({ ...form, dailyRate: parseFloat(e.target.value) || 0 })}
      />
      <TextArea label="Notlar" value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} />
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="isActiveW" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
        <label htmlFor="isActiveW" className="text-sm text-gray-700">Aktif</label>
      </div>
      <div className="flex space-x-3 pt-4 border-t">
        <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
