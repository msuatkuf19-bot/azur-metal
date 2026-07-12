'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Drawer } from '@/components/ui/Drawer';
import { formatCurrency, formatDate, parseMoney } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS } from '@/lib/constants';
import { createSupplierPayment, updateSupplierPayment, deleteSupplierPayment } from '@/app/actions/supplier-payments';
import toast from 'react-hot-toast';

function jobCustomerName(job: any): string {
  if (!job) return 'Bilinmeyen';
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export default function TedarikciOdemeleriClient({ data }: { data: any }) {
  const router = useRouter();
  const { payments, suppliers, jobs } = data;

  const [filters, setFilters] = useState({ supplierId: '', startDate: '', endDate: '', paymentMethod: '' });
  const [drawer, setDrawer] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });

  const hasActiveFilter = Object.values(filters).some((v) => v !== '');
  const clearFilters = () => setFilters({ supplierId: '', startDate: '', endDate: '', paymentMethod: '' });

  const filtered = useMemo(() => {
    return payments.filter((p: any) => {
      if (filters.supplierId && p.supplierId !== filters.supplierId) return false;
      if (filters.paymentMethod && p.paymentMethod !== filters.paymentMethod) return false;
      if (filters.startDate && new Date(p.paymentDate) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(p.paymentDate) > new Date(filters.endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [payments, filters]);

  const totalPaid = filtered.reduce((s: number, p: any) => s + p.amount, 0);
  const totalOpenBalance = suppliers.reduce((s: number, sup: any) => s + Math.max(0, sup.openBalance), 0);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ödeme kaydı silinsin mi? Bakiye yeniden hesaplanacak.')) return;
    const r = await deleteSupplierPayment(id);
    if (r.success) { toast.success(r.message || 'Silindi'); router.refresh(); }
    else toast.error(r.error || 'Hata');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tedarikçi Ödemeleri"
        subtitle={`Tüm toptancılara yapılan ödemeler • ${payments.length} kayıt`}
        actions={<Button onClick={() => setDrawer({ open: true, editing: null })}>+ Ödeme Ekle</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Filtrelenmiş Ödeme" value={formatCurrency(totalPaid)} sub={`${filtered.length} kayıt`} accent="info" />
        <StatCard title="Toplam Açık Bakiye" value={formatCurrency(totalOpenBalance)} accent={totalOpenBalance > 0 ? 'danger' : 'success'} />
        <StatCard title="Toptancı Sayısı" value={suppliers.length} accent="default" />
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filtreler</h3>
            {hasActiveFilter && <button onClick={clearFilters} className="text-sm text-rose-600 hover:text-rose-800 font-medium">Filtreleri Temizle</button>}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
              <select value={filters.paymentMethod} onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Tümü</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <Input label="Başlangıç" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
            <Input label="Bitiş" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {filtered.length === 0 ? (
            <EmptyState title={hasActiveFilter ? 'Filtrelere uygun kayıt bulunamadı' : 'Henüz toptancı ödemesi yok'} actionLabel={!hasActiveFilter ? 'İlk ödemeyi ekle' : undefined} onAction={!hasActiveFilter ? () => setDrawer({ open: true, editing: null }) : undefined} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Toptancı</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Yöntem</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Açıklama</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Tutar</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-2.5"><Link href={`/admin/tanimlamalar/toptancilar/${p.supplierId}`} className="text-blue-600 hover:underline font-medium">{p.supplierName}</Link></td>
                      <td className="px-4 py-2.5 text-slate-600">{PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || p.paymentMethod}</td>
                      <td className="px-4 py-2.5 text-slate-500">{p.job ? jobCustomerName(p.job) : '-'}</td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[240px] truncate">{p.description || '-'}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-orange-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => setDrawer({ open: true, editing: p })}>Düzenle</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>Sil</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <SupplierPaymentDrawer state={drawer} onClose={() => setDrawer({ open: false, editing: null })} suppliers={suppliers} jobs={jobs} onSaved={() => { setDrawer({ open: false, editing: null }); router.refresh(); }} />
    </div>
  );
}

function SupplierPaymentDrawer({ state, onClose, suppliers, jobs, onSaved }: any) {
  const { open, editing } = state;
  const isEdit = editing && editing.id;
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<any>(null);

  const formKey = `${open}-${editing?.id || 'new'}`;
  const [lastKey, setLastKey] = useState('');
  if (open && lastKey !== formKey) {
    setLastKey(formKey);
    setForm({
      supplierId: isEdit ? editing.supplierId : (suppliers[0]?.id || ''),
      amount: isEdit ? editing.amount.toString() : '',
      paymentDate: isEdit ? editing.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: isEdit ? editing.paymentMethod : 'Nakit',
      jobId: isEdit ? (editing.jobId || '') : '',
      description: isEdit ? (editing.description || '') : '',
    });
  }

  if (!form) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!form.supplierId) { toast.error('Toptancı seçin'); return; }
    const amount = parseMoney(form.amount);
    if (isNaN(amount) || amount <= 0) { toast.error('Tutar sıfırdan büyük olmalı'); return; }

    setIsLoading(true);
    const payload = { supplierId: form.supplierId, amount, paymentDate: form.paymentDate, paymentMethod: form.paymentMethod, jobId: form.jobId || null, description: form.description || undefined };
    const r = isEdit ? await updateSupplierPayment(editing.id, payload) : await createSupplierPayment(payload as any);
    setIsLoading(false);
    if (r.success) { toast.success((r as any).message || 'Ödeme kaydedildi'); onSaved(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <Drawer isOpen={open} onClose={onClose} title={isEdit ? 'Ödeme Düzenle' : 'Ödeme Ekle'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Toptancı</label>
          <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
            <option value="">Toptancı seçin</option>
            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <Input label="Tutar (₺)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Ör: 5.000 veya 5000,50" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Tarih" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Yöntemi</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İlgili Proje</label>
          <select value={form.jobId} onChange={(e) => setForm({ ...form, jobId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Proje seçilmedi</option>
            {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
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
