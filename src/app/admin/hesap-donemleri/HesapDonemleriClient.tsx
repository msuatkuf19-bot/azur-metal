'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SETTLEMENT_STATUS_LABELS, SETTLEMENT_STATUS_COLORS } from '@/lib/constants';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';

export default function HesapDonemleriClient({ data }: { data: any }) {
  const { periods, workers } = data;

  const [filters, setFilters] = useState({ workerId: '', status: '' });
  const hasActiveFilter = Object.values(filters).some((v) => v !== '');
  const clearFilters = () => setFilters({ workerId: '', status: '' });

  const filtered = useMemo(() => {
    return periods.filter((p: any) => {
      if (filters.workerId && p.workerId !== filters.workerId) return false;
      if (filters.status && p.status !== filters.status) return false;
      return true;
    });
  }, [periods, filters]);

  const totalEarned = filtered.reduce((s: number, p: any) => s + p.earnedAmount, 0);
  const totalPaid = filtered.reduce((s: number, p: any) => s + p.paidAmount, 0);
  const totalBalance = filtered.reduce((s: number, p: any) => s + p.balance, 0);

  const exportPeriodReport = (period: any) => {
    const sections: PdfSection[] = [
      {
        title: 'Dönem Bilgileri',
        type: 'info-grid',
        data: [
          { label: 'Personel', value: period.workerName },
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
    exportToPdf({ title: `Dönem Kapatma Raporu: ${period.workerName}`, subtitle: `${formatDate(period.startDate)} – ${formatDate(period.endDate)}`, sections });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Hesap Dönemleri" subtitle={`Tüm personel dönem kapatma kayıtları • ${periods.length} kayıt`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Toplam Dönem" value={filtered.length} accent="default" />
        <StatCard title="Toplam Hakediş" value={formatCurrency(totalEarned)} accent="success" />
        <StatCard title="Toplam Ödeme" value={formatCurrency(totalPaid)} accent="warning" />
        <StatCard title="Toplam Bakiye" value={formatCurrency(totalBalance)} accent={totalBalance > 0 ? 'danger' : 'success'} />
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filtreler</h3>
            {hasActiveFilter && <button onClick={clearFilters} className="text-sm text-rose-600 hover:text-rose-800 font-medium">Filtreleri Temizle</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personel</label>
              <select value={filters.workerId} onChange={(e) => setFilters({ ...filters, workerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Personel</option>
                {workers.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tümü</option>
                {Object.entries(SETTLEMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title={hasActiveFilter ? 'Filtrelere uygun dönem bulunamadı' : 'Henüz kapatılan dönem yok'} description="Personel detayından 'Hesabı Kapat' ile yeni dönem oluşturabilirsiniz." />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p: any) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/admin/tanimlamalar/ustalar/${p.workerId}`} className="font-semibold text-slate-900 hover:text-blue-600">
                      {p.workerName}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {formatDate(p.startDate)} – {formatDate(p.endDate)}
                    </p>
                  </div>
                  <Badge className={SETTLEMENT_STATUS_COLORS[p.status as keyof typeof SETTLEMENT_STATUS_COLORS]}>
                    {SETTLEMENT_STATUS_LABELS[p.status as keyof typeof SETTLEMENT_STATUS_LABELS]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs text-slate-400">Çalışılan Gün</p>
                    <p className="font-medium">{p.workedDays.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Hakediş</p>
                    <p className="font-medium">{formatCurrency(p.earnedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Ödeme</p>
                    <p className="font-medium">{formatCurrency(p.paidAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Bakiye</p>
                    <p className={`font-semibold ${p.balance > 0.005 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(p.balance)}</p>
                  </div>
                </div>
                {p.closedAt && <p className="text-xs text-slate-400">Kapanış: {formatDate(p.closedAt)}</p>}
                <Button size="sm" variant="secondary" className="w-full" onClick={() => exportPeriodReport(p)}>
                  Rapor Al
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
