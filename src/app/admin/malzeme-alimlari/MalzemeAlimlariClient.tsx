'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, parseMoney } from '@/lib/utils';
import { PURCHASE_PAYMENT_STATUS_LABELS, PURCHASE_PAYMENT_STATUS_COLORS } from '@/lib/constants';
import { togglePurchasePaymentStatus, deleteMaterialPurchase } from '@/app/actions/material-purchases';
import toast from 'react-hot-toast';

function jobCustomerName(job: any): string {
  if (!job) return 'Bilinmeyen';
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export default function MalzemeAlimlariClient({ data }: { data: any }) {
  const router = useRouter();
  const { purchases, suppliers, materials, jobs } = data;

  const [filters, setFilters] = useState({
    startDate: '', endDate: '', supplierId: '', jobId: '', materialId: '', paymentStatus: '', minAmount: '', maxAmount: '', search: '',
  });

  const hasActiveFilter = Object.values(filters).some((v) => v !== '');
  const clearFilters = () => setFilters({ startDate: '', endDate: '', supplierId: '', jobId: '', materialId: '', paymentStatus: '', minAmount: '', maxAmount: '', search: '' });

  const filtered = useMemo(() => {
    return purchases.filter((p: any) => {
      if (filters.startDate && new Date(p.purchaseDate) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(p.purchaseDate) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters.supplierId && p.supplierId !== filters.supplierId) return false;
      if (filters.jobId && p.jobId !== filters.jobId) return false;
      if (filters.materialId && p.materialId !== filters.materialId) return false;
      if (filters.paymentStatus && p.paymentStatus !== filters.paymentStatus) return false;
      if (filters.minAmount && p.totalAmount < parseMoney(filters.minAmount)) return false;
      if (filters.maxAmount && p.totalAmount > parseMoney(filters.maxAmount)) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const hay = `${p.materialName} ${p.supplierName} ${p.invoiceNo || ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [purchases, filters]);

  const stats = useMemo(() => {
    const total = filtered.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const vat = filtered.reduce((s: number, p: any) => s + (p.vatRate ? p.totalAmount - p.totalAmount / (1 + p.vatRate / 100) : 0), 0);
    const openCount = filtered.filter((p: any) => p.paymentStatus === 'Acik').length;
    return { count: filtered.length, total, vat, openCount };
  }, [filtered]);

  const handleToggleStatus = async (id: string) => {
    const r = await togglePurchasePaymentStatus(id);
    if (r.success) { toast.success(r.message || 'Durum güncellendi'); router.refresh(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu alım kaydı silinsin mi?')) return;
    const r = await deleteMaterialPurchase(id);
    if (r.success) { toast.success('Alım kaydı silindi'); router.refresh(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Malzeme Alımları" subtitle={`Tüm toptancılardan yapılan alımlar • ${purchases.length} kayıt`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Toplam Kayıt" value={stats.count} accent="info" />
        <StatCard title="Toplam Tutar" value={formatCurrency(stats.total)} accent="default" />
        <StatCard title="KDV Toplamı" value={formatCurrency(stats.vat)} accent="default" />
        <StatCard title="Açık Ödeme" value={stats.openCount} accent={stats.openCount > 0 ? 'warning' : 'success'} />
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filtreler</h3>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="text-sm text-rose-600 hover:text-rose-800 font-medium">
                Filtreleri Temizle
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Toptancı</label>
              <select value={filters.supplierId} onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Toptancılar</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proje</label>
              <select value={filters.jobId} onChange={(e) => setFilters({ ...filters, jobId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Projeler</option>
                {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme</label>
              <select value={filters.materialId} onChange={(e) => setFilters({ ...filters, materialId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tüm Malzemeler</option>
                {materials.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Durumu</label>
              <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tümü</option>
                <option value="Acik">Açık</option>
                <option value="Odendi">Ödendi</option>
              </select>
            </div>
            <Input label="Ara" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Malzeme, toptancı, fatura no..." />
            <Input label="Başlangıç" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            <Input label="Bitiş" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
            <Input label="Min Tutar" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} placeholder="Ör: 1000" />
            <Input label="Max Tutar" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} placeholder="Ör: 50000" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title={hasActiveFilter ? 'Filtrelere uygun kayıt bulunamadı' : 'Henüz malzeme alımı yok'} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Toptancı</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Malzeme</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Miktar</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje / Müşteri</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/tanimlamalar/toptancilar/${p.supplierId}`} className="text-blue-600 hover:underline font-medium">{p.supplierName}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-slate-800">{p.materialName}</td>
                      <td className="px-4 py-2.5 text-right text-slate-600">{p.quantity} {p.unit}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(p.totalAmount)}</td>
                      <td className="px-4 py-2.5">
                        {p.jobId ? <Link href={`/admin/projeler/${p.jobId}`} className="text-blue-600 hover:underline">{jobCustomerName(p.job)}</Link> : '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleToggleStatus(p.id)}>
                          <Badge className={PURCHASE_PAYMENT_STATUS_COLORS[p.paymentStatus as keyof typeof PURCHASE_PAYMENT_STATUS_COLORS]}>
                            {PURCHASE_PAYMENT_STATUS_LABELS[p.paymentStatus as keyof typeof PURCHASE_PAYMENT_STATUS_LABELS]}
                          </Badge>
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t-2">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm font-bold text-slate-700">TOPLAM</td>
                    <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(stats.total)}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
