'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Drawer';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ATTENDANCE_TYPE_LABELS, ATTENDANCE_TYPE_COLORS, ATTENDANCE_TYPE_MULTIPLIERS, type AttendanceType } from '@/lib/constants';
import { createBulkAttendance } from '@/app/actions/attendance';
import toast from 'react-hot-toast';

function jobCustomerName(job: any): string {
  if (!job) return '-';
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export default function YoklamaClient({ data }: { data: any }) {
  const router = useRouter();
  const { attendances, workers, jobs } = data;

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [workerFilter, setWorkerFilter] = useState('');
  const [bulkDrawerOpen, setBulkDrawerOpen] = useState(false);

  const monthAttendances = useMemo(() => {
    return attendances.filter((a: any) => {
      const d = new Date(a.date);
      if (d.getMonth() !== selectedMonth || d.getFullYear() !== selectedYear) return false;
      if (workerFilter && a.workerId !== workerFilter) return false;
      return true;
    });
  }, [attendances, selectedMonth, selectedYear, workerFilter]);

  const stats = useMemo(() => {
    const attended = monthAttendances.filter((a: any) => a.type !== 'NONE').length;
    const dayEquivalent = monthAttendances.reduce((s: number, a: any) => s + (a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0), 0);
    const totalEarned = monthAttendances.reduce((s: number, a: any) => {
      const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
      return s + mult * a.dailyRateSnapshot + (a.extraAmount || 0);
    }, 0);
    return { attended, dayEquivalent, totalEarned, workerCount: new Set(monthAttendances.map((a: any) => a.workerId)).size };
  }, [monthAttendances]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yoklama"
        subtitle={`Tüm personel yoklama kayıtları • ${attendances.length} toplam kayıt`}
        actions={<Button onClick={() => setBulkDrawerOpen(true)}>+ Toplu Yoklama</Button>}
      />

      <MonthPicker month={selectedMonth} year={selectedYear} onChange={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Bu Ay Kayıt" value={monthAttendances.length} sub={`${stats.workerCount} personel`} accent="info" />
        <StatCard title="Gelinen Gün" value={stats.attended} accent="success" />
        <StatCard title="Gün Karşılığı" value={stats.dayEquivalent.toLocaleString('tr-TR')} accent="default" />
        <StatCard title="Toplam Hakediş" value={formatCurrency(stats.totalEarned)} accent="warning" />
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Personel:</span>
          <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Tüm Personel</option>
            {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {workerFilter && (
            <button onClick={() => setWorkerFilter('')} className="text-sm text-rose-600 hover:text-rose-800 font-medium">
              Filtreyi Temizle
            </button>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {monthAttendances.length === 0 ? (
            <EmptyState title="Bu ay için henüz yoklama kaydı bulunmuyor." actionLabel="Toplu yoklama ekle" onAction={() => setBulkDrawerOpen(true)} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Personel</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Çalışma</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Ekstra</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Hakediş</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Not</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthAttendances.map((a: any) => {
                    const mult = a.dayMultiplier ?? ATTENDANCE_TYPE_MULTIPLIERS[a.type as AttendanceType] ?? 0;
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(a.date)}</td>
                        <td className="px-4 py-2.5">
                          <Link href={`/admin/tanimlamalar/ustalar/${a.workerId}`} className="text-blue-600 hover:underline font-medium">{a.workerName}</Link>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge className={ATTENDANCE_TYPE_COLORS[a.type as AttendanceType]}>{ATTENDANCE_TYPE_LABELS[a.type as AttendanceType]}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">{jobCustomerName(a.job)}</td>
                        <td className="px-4 py-2.5 text-right text-orange-600">{a.extraAmount ? formatCurrency(a.extraAmount) : '-'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(mult * a.dailyRateSnapshot + (a.extraAmount || 0))}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate">{[a.extraDescription, a.note].filter(Boolean).join(' • ') || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <BulkAttendanceDrawer
        isOpen={bulkDrawerOpen}
        onClose={() => setBulkDrawerOpen(false)}
        workers={workers}
        jobs={jobs}
        onSaved={() => { setBulkDrawerOpen(false); router.refresh(); }}
      />
    </div>
  );
}

function BulkAttendanceDrawer({ isOpen, onClose, workers, jobs, onSaved }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<AttendanceType>('FULL_DAY');
  const [jobId, setJobId] = useState('');
  const [extraAmount, setExtraAmount] = useState('0');
  const [note, setNote] = useState('');

  const toggleWorker = (id: string) => {
    setSelectedWorkers((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (selectedWorkers.length === 0) { toast.error('En az bir personel seçin'); return; }

    setIsLoading(true);
    const r = await createBulkAttendance({
      workerIds: selectedWorkers,
      date,
      type,
      jobId: jobId || null,
      extraAmount: Number(extraAmount) || 0,
      note: note || undefined,
    });
    setIsLoading(false);
    if (r.success) {
      toast.success(r.message || 'Toplu yoklama kaydedildi');
      setSelectedWorkers([]);
      onSaved();
    } else {
      toast.error(r.error || 'Hata oluştu');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Toplu Yoklama Ekle" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Personel Seçin ({selectedWorkers.length})</label>
          <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
            {workers.map((w: any) => (
              <label key={w.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selectedWorkers.includes(w.id)} onChange={() => toggleWorker(w.id)} />
                <span className="text-sm text-slate-800">{w.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Türü</label>
            <select value={type} onChange={(e) => setType(e.target.value as AttendanceType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(ATTENDANCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proje</label>
          <select value={jobId} onChange={(e) => setJobId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Proje seçilmedi</option>
            {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ekstra Ücret (₺, hepsi için ortak)</label>
          <input type="number" min="0" value={extraAmount} onChange={(e) => setExtraAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <TextArea label="Not" value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="Ör: Pazar günü özel çalışma" />

        <div className="flex space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : `${selectedWorkers.length} Personel İçin Kaydet`}</Button>
        </div>
      </form>
    </Drawer>
  );
}
