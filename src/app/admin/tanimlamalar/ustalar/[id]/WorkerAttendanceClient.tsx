'use client';

import { useState, useMemo } from 'react';
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
  ATTENDANCE_TYPE_COLORS,
  WORKER_BALANCE_STATUS,
} from '@/lib/constants';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils';
import { createAttendance, deleteAttendance } from '@/app/actions/attendance';
import { createWorkerPayment, deleteWorkerPayment } from '@/app/actions/worker-payments';
import { updateWorker } from '@/app/actions/workers';
import toast from 'react-hot-toast';

interface WorkerAttendanceClientProps {
  data: {
    worker: any;
    attendances: any[];
    workerPayments: any[];
    workEntries: any[];
    summary: {
      fullDays: number;
      halfDays: number;
      totalExtras: number;
      attendanceEarned: number;
      workEntryEarned: number;
      totalHours: number;
      totalEarned: number;
      totalPaid: number;
      balance: number;
      thisMonth: {
        fullDays: number;
        halfDays: number;
        extras: number;
        earned: number;
      };
    };
  };
}

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export default function WorkerAttendanceClient({ data }: WorkerAttendanceClientProps) {
  const router = useRouter();
  const { worker, attendances, workerPayments, workEntries, summary } = data;

  // Tab state
  const [activeTab, setActiveTab] = useState<'attendance' | 'payments' | 'entries'>('attendance');

  // Month filter
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Drawers
  const [isAttendanceDrawerOpen, setIsAttendanceDrawerOpen] = useState(false);
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Attendance form
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'FULL_DAY' as 'FULL_DAY' | 'HALF_DAY',
    extraAmount: 0,
    note: '',
  });

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Edit form
  const [editForm, setEditForm] = useState({
    fullName: worker.fullName,
    phone: worker.phone || '',
    roleType: worker.roleType,
    hourlyRateDefault: worker.hourlyRateDefault,
    dailyRate: worker.dailyRate,
    notes: worker.notes || '',
    isActive: worker.isActive,
  });

  // Filtered attendances by month
  const filteredAttendances = useMemo(() => {
    return attendances.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [attendances, selectedMonth, selectedYear]);

  // Month summary
  const monthSummary = useMemo(() => {
    const full = filteredAttendances.filter(a => a.type === 'FULL_DAY').length;
    const half = filteredAttendances.filter(a => a.type === 'HALF_DAY').length;
    const extras = filteredAttendances.reduce((sum: number, a: any) => sum + a.extraAmount, 0);
    const earned = (full * worker.dailyRate) + (half * worker.dailyRate / 2) + extras;
    return { full, half, extras, earned, total: filteredAttendances.length };
  }, [filteredAttendances, worker.dailyRate]);

  // Balance status
  const balanceStatus = summary.balance > 0
    ? WORKER_BALANCE_STATUS.DEBT
    : summary.balance === 0
      ? WORKER_BALANCE_STATUS.CLEAR
      : WORKER_BALANCE_STATUS.ADVANCE;

  // Calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const att = filteredAttendances.find(a => {
        const ad = new Date(a.date);
        return ad.getDate() === d;
      });
      days.push({ day: d, dateStr, attendance: att || null });
    }
    return days;
  }, [selectedYear, selectedMonth, filteredAttendances]);

  // Quick payment - fill amount with remaining balance
  const openQuickPayment = () => {
    setPaymentForm({
      amount: summary.balance > 0 ? summary.balance.toString() : '',
      date: new Date().toISOString().split('T')[0],
      description: `${worker.fullName} - Hızlı ödeme`,
    });
    setIsPaymentDrawerOpen(true);
  };

  // Handlers
  const handleCreateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await createAttendance({
        workerId: worker.id,
        ...attendanceForm,
      });
      if (result.success) {
        toast.success('Yoklama kaydedildi');
        setIsAttendanceDrawerOpen(false);
        setAttendanceForm({ date: new Date().toISOString().split('T')[0], type: 'FULL_DAY', extraAmount: 0, note: '' });
        router.refresh();
      } else {
        toast.error(result.error || 'Hata oluştu');
      }
    } catch { toast.error('Hata oluştu'); }
    finally { setIsLoading(false); }
  };

  const handleDeleteAttendance = async (id: string) => {
    if (!confirm('Bu yoklama kaydını silmek istediğinize emin misiniz?')) return;
    const result = await deleteAttendance(id);
    if (result.success) {
      toast.success('Yoklama silindi');
      router.refresh();
    } else {
      toast.error(result.error || 'Hata');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const amount = parseFloat(paymentForm.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Geçerli bir tutar girin');
        setIsLoading(false);
        return;
      }
      const result = await createWorkerPayment({
        workerId: worker.id,
        amount,
        date: paymentForm.date,
        description: paymentForm.description,
      });
      if (result.success) {
        toast.success('Ödeme kaydedildi');
        setIsPaymentDrawerOpen(false);
        setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
        router.refresh();
      } else {
        toast.error(result.error || 'Hata oluştu');
      }
    } catch { toast.error('Hata oluştu'); }
    finally { setIsLoading(false); }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Bu ödeme kaydını silmek istediğinize emin misiniz?')) return;
    const result = await deleteWorkerPayment(id);
    if (result.success) {
      toast.success('Ödeme silindi');
      router.refresh();
    } else {
      toast.error(result.error || 'Hata');
    }
  };

  const handleEditWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateWorker(worker.id, {
        ...editForm,
        roleType: editForm.roleType as 'USTA' | 'ISCI',
      });
      if (result.success) {
        toast.success('Bilgiler güncellendi');
        setIsEditDrawerOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Hata oluştu');
      }
    } catch { toast.error('Hata oluştu'); }
    finally { setIsLoading(false); }
  };

  // Navigate months
  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
    else { setSelectedMonth(selectedMonth - 1); }
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
    else { setSelectedMonth(selectedMonth + 1); }
  };

  // Payment progress percentage
  const paymentPct = summary.totalEarned > 0 ? Math.min((summary.totalPaid / summary.totalEarned) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/tanimlamalar/ustalar">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
          </Link>
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-xl">
              {worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{worker.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={WORKER_ROLE_COLORS[worker.roleType as keyof typeof WORKER_ROLE_COLORS]}>
                {WORKER_ROLE_LABELS[worker.roleType as keyof typeof WORKER_ROLE_LABELS]}
              </Badge>
              <Badge className={worker.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                {worker.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
              {worker.phone && <span className="text-sm text-gray-500">{formatPhone(worker.phone)}</span>}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => setIsEditDrawerOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Düzenle
          </Button>
          <Button onClick={openQuickPayment}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Hızlı Ödeme
          </Button>
        </div>
      </div>

      {/* KPI Cards - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <p className="text-sm text-gray-500">Yevmiye</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(worker.dailyRate)}</p>
            <p className="text-xs text-gray-400">/gün</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardBody>
            <p className="text-sm text-gray-500">Çalışma</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{summary.fullDays + summary.halfDays * 0.5}</p>
            <p className="text-xs text-gray-400">{summary.fullDays} tam + {summary.halfDays} yarım gün</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardBody>
            <p className="text-sm text-gray-500">Toplam Hakediş</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalEarned)}</p>
            {summary.totalExtras > 0 && <p className="text-xs text-gray-400">+{formatCurrency(summary.totalExtras)} ekstra</p>}
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardBody>
            <p className="text-sm text-gray-500">Ödenen</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-gray-400">{workerPayments.length} ödeme</p>
          </CardBody>
        </Card>

        <Card className={`border-l-4 ${balanceStatus.border}`}>
          <CardBody>
            <p className="text-sm text-gray-500">Bakiye</p>
            <p className={`text-2xl font-bold mt-1 ${balanceStatus.color}`}>
              {formatCurrency(Math.abs(summary.balance))}
            </p>
            <Badge className={`${balanceStatus.bg} ${balanceStatus.color} mt-1`}>
              {balanceStatus.label}
            </Badge>
          </CardBody>
        </Card>
      </div>

      {/* Payment Progress Bar */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Ödeme İlerlemesi</span>
            <span className="text-sm font-semibold">{paymentPct.toFixed(0)}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                summary.balance > 0
                  ? 'bg-gradient-to-r from-red-400 to-red-600'
                  : summary.balance === 0
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                    : 'bg-gradient-to-r from-blue-400 to-blue-600'
              }`}
              style={{ width: `${paymentPct}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-emerald-600 font-medium">Hakediş: {formatCurrency(summary.totalEarned)}</span>
            <span className="text-orange-600 font-medium">Ödenen: {formatCurrency(summary.totalPaid)}</span>
            <span className={`font-semibold ${balanceStatus.color}`}>
              Kalan: {formatCurrency(Math.abs(summary.balance))} {summary.balance < 0 ? '(avans)' : ''}
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'attendance', label: 'Yoklama / Takvim', count: attendances.length },
            { key: 'payments', label: 'Ödemeler', count: workerPayments.length },
            { key: 'entries', label: 'İşçilik Kayıtları', count: workEntries.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* TAB: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Month selector + add button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {MONTHS[selectedMonth]} {selectedYear}
              </h3>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <Button onClick={() => setIsAttendanceDrawerOpen(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yoklama Ekle
            </Button>
          </div>

          {/* Month Summary Bar */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-wrap gap-6 md:gap-12">
              <div>
                <span className="text-sm text-gray-500">Tam Gün</span>
                <p className="text-xl font-bold text-emerald-600">{monthSummary.full}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Yarım Gün</span>
                <p className="text-xl font-bold text-amber-600">{monthSummary.half}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Ekstra</span>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(monthSummary.extras)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Ay Kazancı</span>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(monthSummary.earned)}</p>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardBody className="p-0">
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500 uppercase">
                    {day}
                  </div>
                ))}
                {/* Empty cells for first week offset */}
                {(() => {
                  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
                  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday=0
                  return Array.from({ length: offset }, (_, i) => (
                    <div key={`empty-${i}`} className="bg-white p-2 min-h-[60px]" />
                  ));
                })()}
                {calendarDays.map(({ day, attendance }) => (
                  <div
                    key={day}
                    className={`bg-white p-2 min-h-[60px] border-t ${
                      attendance
                        ? attendance.type === 'FULL_DAY'
                          ? 'bg-emerald-50'
                          : 'bg-amber-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-700">{day}</span>
                      {attendance && (
                        <button
                          onClick={() => handleDeleteAttendance(attendance.id)}
                          className="text-gray-400 hover:text-red-500 opacity-0 hover:opacity-100 transition-opacity"
                          title="Sil"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {attendance && (
                      <div className="mt-1">
                        <Badge className={ATTENDANCE_TYPE_COLORS[attendance.type as keyof typeof ATTENDANCE_TYPE_COLORS] + ' text-[10px]'}>
                          {ATTENDANCE_TYPE_LABELS[attendance.type as keyof typeof ATTENDANCE_TYPE_LABELS]}
                        </Badge>
                        {attendance.extraAmount > 0 && (
                          <p className="text-[10px] text-blue-600 mt-0.5">+{formatCurrency(attendance.extraAmount)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Attendance List */}
          {filteredAttendances.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Yoklama Listesi - {MONTHS[selectedMonth]} {selectedYear}</h3>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Yevmiye</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ekstra</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Not</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAttendances.map((att: any) => {
                        const dayEarned = att.type === 'FULL_DAY' ? worker.dailyRate : worker.dailyRate / 2;
                        return (
                          <tr key={att.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm">{formatDate(att.date)}</td>
                            <td className="px-6 py-4">
                              <Badge className={ATTENDANCE_TYPE_COLORS[att.type as keyof typeof ATTENDANCE_TYPE_COLORS]}>
                                {ATTENDANCE_TYPE_LABELS[att.type as keyof typeof ATTENDANCE_TYPE_LABELS]}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right text-sm">{formatCurrency(dayEarned)}</td>
                            <td className="px-6 py-4 text-right text-sm text-blue-600">
                              {att.extraAmount > 0 ? `+${formatCurrency(att.extraAmount)}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{att.note || '-'}</td>
                            <td className="px-6 py-4 text-right font-semibold">{formatCurrency(dayEarned + att.extraAmount)}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleDeleteAttendance(att.id)} className="text-red-500 hover:text-red-700 text-sm">
                                Sil
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr>
                        <td colSpan={5} className="px-6 py-3 text-sm font-bold">AY TOPLAMI</td>
                        <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(monthSummary.earned)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* TAB: Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ödeme Geçmişi</h3>
            <Button onClick={() => {
              setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
              setIsPaymentDrawerOpen(true);
            }}>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ödeme Ekle
            </Button>
          </div>

          <Card>
            <CardBody className="p-0">
              {workerPayments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500">Henüz ödeme kaydı yok</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {workerPayments.map((payment: any) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{formatDate(payment.date)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-orange-600">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.description || '-'}</td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => handleDeletePayment(payment.id)} className="text-red-500 hover:text-red-700 text-sm">
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2">
                      <tr>
                        <td className="px-6 py-3 text-sm font-bold">TOPLAM</td>
                        <td className="px-6 py-3 text-right font-bold text-orange-600">
                          {formatCurrency(summary.totalPaid)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* TAB: Work Entries */}
      {activeTab === 'entries' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">İşçilik Kayıtları</h3>
              <span className="text-sm text-gray-500">{workEntries.length} kayıt • {summary.totalHours.toFixed(1)} saat</span>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {workEntries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Henüz işçilik kaydı yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat Ücreti</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workEntries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{formatDate(entry.date)}</td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/projeler/${entry.jobId}`} className="font-medium text-primary-600 hover:text-primary-800">
                            {entry.job?.firmaAdi || entry.job?.musteriAdi || '-'}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-right">{entry.hours}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(entry.hourlyRate)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(entry.totalAmount)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{entry.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td colSpan={2} className="px-6 py-3 font-bold text-sm">TOPLAM</td>
                      <td className="px-6 py-3 text-right font-bold">{summary.totalHours.toFixed(1)}</td>
                      <td></td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(summary.workEntryEarned)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Attendance Drawer */}
      <Drawer isOpen={isAttendanceDrawerOpen} onClose={() => setIsAttendanceDrawerOpen(false)} title="Yoklama Ekle">
        <form onSubmit={handleCreateAttendance} className="space-y-4">
          <Input
            label="Tarih"
            type="date"
            value={attendanceForm.date}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip <span className="text-red-500">*</span></label>
            <select
              value={attendanceForm.type}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="FULL_DAY">Tam Gün ({formatCurrency(worker.dailyRate)})</option>
              <option value="HALF_DAY">Yarım Gün ({formatCurrency(worker.dailyRate / 2)})</option>
            </select>
          </div>

          <Input
            label="Ekstra Ücret (₺)"
            type="number"
            min="0"
            step="0.01"
            value={attendanceForm.extraAmount}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, extraAmount: parseFloat(e.target.value) || 0 })}
            placeholder="Gece mesai vb."
          />

          <TextArea
            label="Not"
            value={attendanceForm.note}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, note: e.target.value })}
            placeholder="Opsiyonel not..."
          />

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500">Hesaplanan kazanç:</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(
                (attendanceForm.type === 'FULL_DAY' ? worker.dailyRate : worker.dailyRate / 2) + attendanceForm.extraAmount
              )}
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsAttendanceDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Payment Drawer */}
      <Drawer isOpen={isPaymentDrawerOpen} onClose={() => setIsPaymentDrawerOpen(false)} title="Ödeme Yap">
        <form onSubmit={handleCreatePayment} className="space-y-4">
          {/* Balance info */}
          <div className={`p-4 rounded-lg ${balanceStatus.bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">Güncel Bakiye:</span>
              <span className={`text-lg font-bold ${balanceStatus.color}`}>
                {formatCurrency(Math.abs(summary.balance))}
              </span>
            </div>
            <Badge className={`${balanceStatus.bg} ${balanceStatus.color} mt-1`}>
              {balanceStatus.label}
            </Badge>
          </div>

          <Input
            label="Tutar (₺)"
            type="number"
            min="0.01"
            step="0.01"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            required
          />

          <Input
            label="Tarih"
            type="date"
            value={paymentForm.date}
            onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
            required
          />

          <TextArea
            label="Açıklama"
            value={paymentForm.description}
            onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
            placeholder="Ödeme notu..."
          />

          {summary.balance > 0 && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setPaymentForm({ ...paymentForm, amount: summary.balance.toString() })}
            >
              Tüm Borcu Öde ({formatCurrency(summary.balance)})
            </Button>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsPaymentDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Edit Worker Drawer */}
      <Drawer isOpen={isEditDrawerOpen} onClose={() => setIsEditDrawerOpen(false)} title="Çalışan Düzenle">
        <form onSubmit={handleEditWorker} className="space-y-4">
          <Input
            label="Ad Soyad"
            value={editForm.fullName}
            onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
            required
          />

          <Input
            label="Telefon"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select
              value={editForm.roleType}
              onChange={(e) => setEditForm({ ...editForm, roleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="USTA">Usta</option>
              <option value="ISCI">İşçi</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Saat Ücreti (₺)"
              type="number"
              min="0"
              step="0.01"
              value={editForm.hourlyRateDefault}
              onChange={(e) => setEditForm({ ...editForm, hourlyRateDefault: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Yevmiye (₺)"
              type="number"
              min="0"
              step="0.01"
              value={editForm.dailyRate}
              onChange={(e) => setEditForm({ ...editForm, dailyRate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <TextArea
            label="Notlar"
            value={editForm.notes}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editForm.isActive}
              onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="editIsActive" className="text-sm text-gray-700">Aktif</label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Güncelle'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
