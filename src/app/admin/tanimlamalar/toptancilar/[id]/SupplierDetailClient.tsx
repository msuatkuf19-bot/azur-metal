'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input, TextArea } from '@/components/ui/Input';
import { formatCurrency, formatDate, formatDateTime, formatPhone, parseMoney } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, PURCHASE_PAYMENT_STATUS_LABELS, PURCHASE_PAYMENT_STATUS_COLORS, supplierBalanceStatus } from '@/lib/constants';
import { createSupplierPayment, updateSupplierPayment, deleteSupplierPayment } from '@/app/actions/supplier-payments';
import { togglePurchasePaymentStatus, deleteMaterialPurchase } from '@/app/actions/material-purchases';
import { updateSupplier } from '@/app/actions/suppliers';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';
import toast from 'react-hot-toast';

type TabId = 'genel' | 'alimlar' | 'musteriler' | 'projeler' | 'malzemeler' | 'odemeler' | 'ekstre' | 'raporlar' | 'aktivite';

const TABS: { id: TabId; label: string }[] = [
  { id: 'genel', label: 'Genel Bakış' },
  { id: 'alimlar', label: 'Alımlar' },
  { id: 'musteriler', label: 'Müşteriler' },
  { id: 'projeler', label: 'Projeler' },
  { id: 'malzemeler', label: 'Malzemeler' },
  { id: 'odemeler', label: 'Ödemeler' },
  { id: 'ekstre', label: 'Ekstre' },
  { id: 'raporlar', label: 'Raporlar' },
  { id: 'aktivite', label: 'Aktivite' },
];

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: 'Oluşturma', color: 'bg-emerald-100 text-emerald-800' },
  UPDATE: { label: 'Güncelleme', color: 'bg-blue-100 text-blue-800' },
  DELETE: { label: 'Silme', color: 'bg-rose-100 text-rose-800' },
  ACTIVATE: { label: 'Aktifleştirme', color: 'bg-emerald-100 text-emerald-800' },
};

const ENTITY_LABELS: Record<string, string> = {
  Supplier: 'Toptancı',
  MaterialPurchase: 'Malzeme Alımı',
  SupplierPayment: 'Toptancı Ödemesi',
};

function jobCustomerName(job: any): string {
  if (!job) return 'Bilinmeyen';
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export default function SupplierDetailClient({ data }: { data: any }) {
  const router = useRouter();
  const { supplier, purchases, payments, ledger, customerBreakdown, projectBreakdown, materialBreakdown, summary, materials, jobs, auditLogs } = data;

  const [activeTab, setActiveTab] = useState<TabId>('genel');
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [paymentDrawer, setPaymentDrawer] = useState<{ open: boolean; editing: any | null }>({ open: false, editing: null });
  const [ledgerFilter, setLedgerFilter] = useState('');
  const [drillCustomer, setDrillCustomer] = useState<string | null>(null);
  const [drillProject, setDrillProject] = useState<string | null>(null);
  const [reportCustomer, setReportCustomer] = useState('');

  const [filters, setFilters] = useState({
    startDate: '', endDate: '', customer: '', jobId: '', materialId: '', paymentStatus: '', minAmount: '', maxAmount: '', search: '',
  });

  const balanceStatus = supplierBalanceStatus(summary.openBalance);
  const hasActiveFilter = Object.values(filters).some((v) => v !== '');

  const clearFilters = () => setFilters({ startDate: '', endDate: '', customer: '', jobId: '', materialId: '', paymentStatus: '', minAmount: '', maxAmount: '', search: '' });

  const filteredPurchases = useMemo(() => {
    return purchases.filter((p: any) => {
      if (filters.startDate && new Date(p.purchaseDate) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(p.purchaseDate) > new Date(filters.endDate + 'T23:59:59')) return false;
      if (filters.customer && jobCustomerName(p.job) !== filters.customer) return false;
      if (filters.jobId && p.jobId !== filters.jobId) return false;
      if (filters.materialId && p.materialId !== filters.materialId) return false;
      if (filters.paymentStatus && p.paymentStatus !== filters.paymentStatus) return false;
      if (filters.minAmount && p.totalAmount < parseMoney(filters.minAmount)) return false;
      if (filters.maxAmount && p.totalAmount > parseMoney(filters.maxAmount)) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const hay = `${p.materialName || ''} ${p.invoiceNo || ''} ${p.note || ''}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [purchases, filters]);

  const filteredStats = useMemo(() => {
    const total = filteredPurchases.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const vat = filteredPurchases.reduce((s: number, p: any) => s + (p.vatRate ? p.totalAmount - p.totalAmount / (1 + p.vatRate / 100) : 0), 0);
    const materialCounts = new Map<string, number>();
    for (const p of filteredPurchases) {
      const name = p.materialName || '-';
      materialCounts.set(name, (materialCounts.get(name) || 0) + 1);
    }
    let topMaterial = '-';
    let topCount = 0;
    for (const [name, count] of materialCounts) { if (count > topCount) { topMaterial = name; topCount = count; } }
    return { count: filteredPurchases.length, total, vat, topMaterial };
  }, [filteredPurchases]);

  const filteredLedger = useMemo(() => {
    const list = ledgerFilter ? ledger.filter((l: any) => l.kind === ledgerFilter) : ledger;
    return [...list].reverse();
  }, [ledger, ledgerFilter]);

  const customerProjectTotals = useMemo(() => {
    if (!drillCustomer) return [];
    const map = new Map<string, { refKodu: string; total: number }>();
    for (const p of purchases) {
      if (jobCustomerName(p.job) !== drillCustomer) continue;
      if (!map.has(p.jobId)) map.set(p.jobId, { refKodu: p.job?.referansKodu || '-', total: 0 });
      map.get(p.jobId)!.total += p.totalAmount;
    }
    return Array.from(map.entries()).map(([jobId, v]) => ({ jobId, ...v })).sort((a, b) => b.total - a.total);
  }, [drillCustomer, purchases]);

  const drillCustomerPurchases = useMemo(() => {
    if (!drillCustomer) return [];
    return purchases.filter((p: any) => jobCustomerName(p.job) === drillCustomer);
  }, [drillCustomer, purchases]);

  const drillProjectPurchases = useMemo(() => {
    if (!drillProject) return [];
    return purchases.filter((p: any) => p.jobId === drillProject);
  }, [drillProject, purchases]);

  // ============ PDF RAPORLAR ============
  const exportSupplierReport = () => {
    const sections: PdfSection[] = [
      {
        title: 'Toptancı Bilgileri',
        type: 'info-grid',
        data: [
          { label: 'Firma Adı', value: supplier.name },
          { label: 'Yetkili', value: supplier.contactName || '-' },
          { label: 'Telefon', value: supplier.phone ? formatPhone(supplier.phone) : '-' },
          { label: 'E-posta', value: supplier.email || '-' },
          { label: 'Vergi No', value: supplier.taxNo || '-' },
          { label: 'Durum', value: supplier.isActive ? 'Aktif' : 'Pasif' },
        ],
      },
      {
        title: 'Özet',
        type: 'summary-cards',
        data: [
          { label: 'Toplam Alış', value: formatCurrency(summary.totalPurchases), color: 'blue' },
          { label: 'Toplam Ödeme', value: formatCurrency(summary.totalPaid), color: 'orange' },
          { label: 'Açık Bakiye', value: formatCurrency(summary.openBalance), color: summary.openBalance > 0 ? 'negative' : 'neutral' },
          { label: 'KDV Toplamı', value: formatCurrency(summary.totalVat), color: 'neutral' },
        ],
      },
      { type: 'divider' },
      {
        title: `Alım Listesi ${hasActiveFilter ? '(Filtrelenmiş)' : ''} (${filteredPurchases.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Malzeme', key: 'malzeme', bold: true },
            { header: 'Proje', key: 'proje' },
            { header: 'Müşteri', key: 'musteri' },
            { header: 'Miktar', key: 'miktar', align: 'right' as const },
            { header: 'Tutar', key: 'tutar', align: 'right' as const },
          ],
          rows: filteredPurchases.map((p: any) => ({
            tarih: formatDate(p.purchaseDate),
            malzeme: p.materialName || '-',
            proje: p.job?.referansKodu || '-',
            musteri: jobCustomerName(p.job),
            miktar: `${p.quantity} ${p.unit}`,
            tutar: formatCurrency(p.totalAmount),
          })),
          footer: { tarih: 'TOPLAM', malzeme: '', proje: '', musteri: '', miktar: '', tutar: formatCurrency(filteredStats.total) },
        },
      },
      {
        title: 'Proje Kırılımı',
        type: 'table',
        data: {
          columns: [
            { header: 'Proje', key: 'proje', bold: true },
            { header: 'Müşteri', key: 'musteri' },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: projectBreakdown.map((p: any) => ({ proje: p.name, musteri: p.customer, toplam: formatCurrency(p.total) })),
        },
      },
      {
        title: 'Müşteri Kırılımı',
        type: 'table',
        data: {
          columns: [
            { header: 'Müşteri', key: 'musteri', bold: true },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: customerBreakdown.map((c: any) => ({ musteri: c.name, toplam: formatCurrency(c.total) })),
        },
      },
      {
        title: 'Malzeme Kırılımı',
        type: 'table',
        data: {
          columns: [
            { header: 'Malzeme', key: 'malzeme', bold: true },
            { header: 'Miktar', key: 'miktar', align: 'right' as const },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: materialBreakdown.map((m: any) => ({ malzeme: m.name, miktar: `${m.quantity} ${m.unit}`, toplam: formatCurrency(m.total) })),
        },
      },
    ];
    exportToPdf({ title: `Toptancı Detay Raporu: ${supplier.name}`, subtitle: hasActiveFilter ? 'Filtrelenmiş kayıtlar' : 'Tüm kayıtlar', sections });
  };

  const exportCustomerReport = () => {
    if (!reportCustomer) { toast.error('Rapor için bir müşteri seçin'); return; }
    const custPurchases = purchases.filter((p: any) => jobCustomerName(p.job) === reportCustomer);
    const total = custPurchases.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const projMap = new Map<string, { name: string; total: number }>();
    for (const p of custPurchases) {
      const key = p.jobId;
      if (!projMap.has(key)) projMap.set(key, { name: p.job?.referansKodu || '-', total: 0 });
      projMap.get(key)!.total += p.totalAmount;
    }
    const sections: PdfSection[] = [
      {
        title: 'Rapor Bilgileri',
        type: 'info-grid',
        data: [
          { label: 'Toptancı', value: supplier.name },
          { label: 'Müşteri', value: reportCustomer },
          { label: 'Toplam Alım', value: formatCurrency(total) },
        ],
      },
      { type: 'divider' },
      {
        title: 'Proje Bazlı Toplamlar',
        type: 'table',
        data: {
          columns: [
            { header: 'Proje', key: 'proje', bold: true },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: Array.from(projMap.values()).map((p) => ({ proje: p.name, toplam: formatCurrency(p.total) })),
          footer: { proje: 'GENEL TOPLAM', toplam: formatCurrency(total) },
        },
      },
      {
        title: `Alım Kayıtları (${custPurchases.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Malzeme', key: 'malzeme', bold: true },
            { header: 'Proje', key: 'proje' },
            { header: 'Tutar', key: 'tutar', align: 'right' as const },
          ],
          rows: custPurchases.map((p: any) => ({ tarih: formatDate(p.purchaseDate), malzeme: p.materialName || '-', proje: p.job?.referansKodu || '-', tutar: formatCurrency(p.totalAmount) })),
        },
      },
    ];
    exportToPdf({ title: `Toptancı-Müşteri Raporu: ${supplier.name} → ${reportCustomer}`, sections });
  };

  const exportLedgerReport = () => {
    const sections: PdfSection[] = [
      {
        title: 'Ekstre Özeti',
        type: 'summary-cards',
        data: [
          { label: 'Toplam Alış', value: formatCurrency(summary.totalPurchases), color: 'positive' },
          { label: 'Toplam Ödeme', value: formatCurrency(summary.totalPaid), color: 'orange' },
          { label: 'Açık Bakiye', value: formatCurrency(summary.openBalance), color: summary.openBalance > 0 ? 'negative' : 'neutral' },
        ],
      },
      { type: 'divider' },
      {
        title: `Ekstre (${ledger.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'İşlem', key: 'islem', bold: true },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Müşteri', key: 'musteri' },
            { header: 'Borç', key: 'borc', align: 'right' as const },
            { header: 'Ödeme', key: 'odeme', align: 'right' as const },
            { header: 'Bakiye', key: 'bakiye', align: 'right' as const },
          ],
          rows: ledger.map((l: any) => ({
            tarih: formatDate(l.date), islem: l.label, aciklama: l.description, musteri: l.customerName || '-',
            borc: l.debit ? formatCurrency(l.debit) : '-', odeme: l.credit ? formatCurrency(l.credit) : '-', bakiye: formatCurrency(l.balance),
          })),
          footer: { tarih: 'TOPLAM', islem: '', aciklama: '', musteri: '', borc: formatCurrency(summary.totalPurchases), odeme: formatCurrency(summary.totalPaid), bakiye: formatCurrency(summary.openBalance) },
        },
      },
    ];
    exportToPdf({ title: `Toptancı Ekstresi: ${supplier.name}`, subtitle: 'Tüm hareketler', sections, orientation: 'landscape' });
  };

  const handleTogglePaymentStatus = async (id: string) => {
    const r = await togglePurchasePaymentStatus(id);
    if (r.success) { toast.success(r.message || 'Durum güncellendi'); router.refresh(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm('Bu alım kaydı silinsin mi? Bu işlem geri alınamaz.')) return;
    const r = await deleteMaterialPurchase(id);
    if (r.success) { toast.success('Alım kaydı silindi'); router.refresh(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link href="/admin/tanimlamalar/toptancilar">
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Geri
            </Button>
          </Link>
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 font-bold text-xl">{supplier.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{supplier.name}</h1>
            <div className="flex items-center flex-wrap gap-2 mt-1">
              <Badge className={supplier.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>{supplier.isActive ? 'Aktif' : 'Pasif'}</Badge>
              <Badge className={`${balanceStatus.bg} ${balanceStatus.color}`}>{balanceStatus.label}</Badge>
              {supplier.contactName && <span className="text-sm text-slate-500">{supplier.contactName}</span>}
              {supplier.phone && <span className="text-sm text-slate-500">• {formatPhone(supplier.phone)}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportSupplierReport}>Rapor Al</Button>
          <Button variant="secondary" onClick={() => setEditDrawerOpen(true)}>Düzenle</Button>
          {summary.openBalance > 0 && (
            <Button onClick={() => setPaymentDrawer({ open: true, editing: { quickAmount: summary.openBalance } })}>Hızlı Ödeme</Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardBody>
            <p className="text-sm text-slate-500">Toplam Alım</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(summary.totalPurchases)}</p>
            <p className="text-xs text-slate-400">{summary.purchaseCount} işlem</p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <p className="text-sm text-slate-500">Bu Ay</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.thisMonthTotal)}</p>
          </CardBody>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardBody>
            <p className="text-sm text-slate-500">Ödenen Tutar</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
            <p className="text-xs text-slate-400">{summary.paymentCount} ödeme</p>
          </CardBody>
        </Card>
        <Card className={`border-l-4 ${summary.openBalance > 0 ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
          <CardBody>
            <p className="text-sm text-slate-500">Açık Borç</p>
            <p className={`text-2xl font-bold mt-1 ${summary.openBalance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatCurrency(summary.openBalance)}</p>
          </CardBody>
        </Card>
      </div>

      {summary.openBalance > 0.005 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-rose-800"><strong>{formatCurrency(summary.openBalance)}</strong> tutarında ödenmemiş bakiye var.</span>
          <Button size="sm" onClick={() => setPaymentDrawer({ open: true, editing: { quickAmount: summary.openBalance } })}>Ödeme Yap</Button>
        </div>
      )}

      {/* Sekmeler */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ============ GENEL BAKIŞ ============ */}
      {activeTab === 'genel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Toptancı Bilgileri</h3></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Yetkili</span><span>{supplier.contactName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Telefon</span><span>{supplier.phone ? formatPhone(supplier.phone) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">E-posta</span><span>{supplier.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Vergi No</span><span>{supplier.taxNo || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Kayıt Tarihi</span><span>{formatDate(supplier.createdAt)}</span></div>
              {supplier.address && <div className="pt-2 border-t"><p className="text-slate-500 mb-1">Adres</p><p className="text-slate-800">{supplier.address}</p></div>}
              {supplier.notes && <div className="pt-2 border-t"><p className="text-slate-500 mb-1">Notlar</p><p className="text-slate-800 whitespace-pre-line">{supplier.notes}</p></div>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">Genel Cari Durum</h3></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Toplam Alış</span><span className="font-semibold text-indigo-600">{formatCurrency(summary.totalPurchases)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Toplam Ödeme</span><span className="font-semibold text-orange-600">{formatCurrency(summary.totalPaid)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">KDV Toplamı</span><span>{formatCurrency(summary.totalVat)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-slate-600 font-medium">Açık Bakiye</span><span className={`font-bold ${balanceStatus.color}`}>{formatCurrency(summary.openBalance)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">En Çok Alım Yapılan Müşteri</span><span className="font-medium">{summary.topCustomer || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">En Çok Alım Yapılan Proje</span><span className="font-medium">{summary.topProject || '-'}</span></div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">En Çok Alınan Malzemeler</h3></CardHeader>
            <CardBody className="p-0">
              {materialBreakdown.length === 0 ? (
                <p className="text-sm text-slate-500 p-4">Henüz malzeme alımı yok</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {materialBreakdown.slice(0, 6).map((m: any) => (
                    <li key={m.name} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="min-w-0"><p className="font-medium text-slate-800 truncate">{m.name}</p><p className="text-xs text-slate-400">{m.quantity} {m.unit} • {m.purchaseCount} işlem</p></div>
                      <span className="font-semibold text-indigo-600">{formatCurrency(m.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader><h3 className="font-semibold">Son Hareketler</h3></CardHeader>
            <CardBody className="p-0">
              {ledger.length === 0 ? (
                <p className="text-sm text-slate-500 p-4">Henüz hareket yok</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {[...ledger].reverse().slice(0, 8).map((l: any) => (
                    <li key={l.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{l.label} {l.customerName ? `— ${l.customerName}` : ''}</p>
                        <p className="text-xs text-slate-400">{formatDate(l.date)}</p>
                      </div>
                      <span className={`font-semibold ${l.debit ? 'text-indigo-600' : 'text-orange-600'}`}>{l.debit ? '+' : '-'}{formatCurrency(l.debit || l.credit)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============ ALIMLAR ============ */}
      {activeTab === 'alimlar' && (
        <div className="space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Filtreler</h3>
                {hasActiveFilter && <button onClick={clearFilters} className="text-sm text-rose-600 hover:text-rose-800 font-medium">Filtreleri Temizle</button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                  <select value={filters.customer} onChange={(e) => setFilters({ ...filters, customer: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Tüm Müşteriler</option>
                    {customerBreakdown.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
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
                <Input label="Başlangıç" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
                <Input label="Bitiş" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
                <Input label="Min Tutar" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} placeholder="Ör: 1000" />
                <Input label="Max Tutar" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} placeholder="Ör: 50000" />
                <div className="md:col-span-4">
                  <Input label="Ara" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Malzeme, fatura no veya not içinde ara..." />
                </div>
              </div>
              {hasActiveFilter && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {filters.customer && <Badge className="bg-blue-100 text-blue-800">Müşteri: {filters.customer}</Badge>}
                  {filters.jobId && <Badge className="bg-blue-100 text-blue-800">Proje: {jobs.find((j: any) => j.id === filters.jobId)?.label}</Badge>}
                  {filters.materialId && <Badge className="bg-blue-100 text-blue-800">Malzeme: {materials.find((m: any) => m.id === filters.materialId)?.name}</Badge>}
                  {filters.paymentStatus && <Badge className="bg-blue-100 text-blue-800">Durum: {PURCHASE_PAYMENT_STATUS_LABELS[filters.paymentStatus as keyof typeof PURCHASE_PAYMENT_STATUS_LABELS]}</Badge>}
                  {(filters.startDate || filters.endDate) && <Badge className="bg-blue-100 text-blue-800">Tarih: {filters.startDate || '…'} – {filters.endDate || '…'}</Badge>}
                  {(filters.minAmount || filters.maxAmount) && <Badge className="bg-blue-100 text-blue-800">Tutar: {filters.minAmount || '0'} – {filters.maxAmount || '∞'}</Badge>}
                  {filters.search && <Badge className="bg-blue-100 text-blue-800">Arama: &ldquo;{filters.search}&rdquo;</Badge>}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardBody className="py-3"><p className="text-xs text-slate-500">İşlem Sayısı</p><p className="text-lg font-bold">{filteredStats.count}</p></CardBody></Card>
            <Card><CardBody className="py-3"><p className="text-xs text-slate-500">Toplam Harcama</p><p className="text-lg font-bold text-indigo-600">{formatCurrency(filteredStats.total)}</p></CardBody></Card>
            <Card><CardBody className="py-3"><p className="text-xs text-slate-500">KDV Toplamı</p><p className="text-lg font-bold">{formatCurrency(filteredStats.vat)}</p></CardBody></Card>
            <Card><CardBody className="py-3"><p className="text-xs text-slate-500">En Çok Alınan</p><p className="text-lg font-bold truncate">{filteredStats.topMaterial}</p></CardBody></Card>
          </div>

          <Card>
            <CardHeader><div className="flex items-center justify-between"><h3 className="font-semibold">Alım Kayıtları</h3><span className="text-sm text-slate-500">{filteredPurchases.length} kayıt</span></div></CardHeader>
            <CardBody className="p-0">
              {filteredPurchases.length === 0 ? (
                <p className="text-center text-slate-500 py-10">{hasActiveFilter ? 'Filtrelere uygun kayıt bulunamadı' : 'Henüz alım kaydı yok'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Malzeme</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Miktar</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Birim Fiyat</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">KDV</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje / Müşteri</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Fatura No</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Durum</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPurchases.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(p.purchaseDate)}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">{p.materialName || '-'}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{p.quantity} {p.unit}</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{formatCurrency(p.unitPrice)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{p.vatRate ? `%${p.vatRate}` : '-'}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(p.totalAmount)}</td>
                          <td className="px-4 py-2.5">
                            {p.jobId ? (
                              <Link href={`/admin/projeler/${p.jobId}`} className="text-blue-600 hover:underline font-medium">{jobCustomerName(p.job)}</Link>
                            ) : '-'}
                            <p className="text-xs text-slate-400">{p.job?.referansKodu}</p>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{p.invoiceNo || '-'}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => handleTogglePaymentStatus(p.id)}>
                              <Badge className={PURCHASE_PAYMENT_STATUS_COLORS[p.paymentStatus as keyof typeof PURCHASE_PAYMENT_STATUS_COLORS]}>
                                {PURCHASE_PAYMENT_STATUS_LABELS[p.paymentStatus as keyof typeof PURCHASE_PAYMENT_STATUS_LABELS]}
                              </Badge>
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePurchase(p.id)}>Sil</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm font-bold text-slate-700">TOPLAM</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatCurrency(filteredStats.total)}</td>
                        <td colSpan={4} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============ MÜŞTERİLER ============ */}
      {activeTab === 'musteriler' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold">Müşteri Bazlı Analiz <span className="text-sm text-slate-400 font-normal">({customerBreakdown.length})</span></h3></CardHeader>
            <CardBody className="p-0">
              {customerBreakdown.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Henüz müşteri bazlı alım yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Müşteri</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam Alım</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Proje Sayısı</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">İşlem Sayısı</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam KDV</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Son Alım</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerBreakdown.map((c: any) => (
                        <tr key={c.name} className={`hover:bg-slate-50 cursor-pointer ${drillCustomer === c.name ? 'bg-blue-50' : ''}`} onClick={() => setDrillCustomer(drillCustomer === c.name ? null : c.name)}>
                          <td className="px-4 py-2.5 font-medium text-blue-700">{c.name}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(c.total)}</td>
                          <td className="px-4 py-2.5 text-right">{c.projectCount}</td>
                          <td className="px-4 py-2.5 text-right">{c.purchaseCount}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(c.vat)}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.lastDate ? formatDate(c.lastDate) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {drillCustomer && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{supplier.name} → {drillCustomer}</h3>
                  <button onClick={() => setDrillCustomer(null)} className="text-sm text-slate-500 hover:text-slate-700">Kapat</button>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerProjectTotals.map((p) => (
                    <div key={p.jobId} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
                      <Link href={`/admin/projeler/${p.jobId}`} className="text-blue-600 hover:underline font-medium">{p.refKodu}</Link>
                      <span className="font-semibold text-indigo-600">{formatCurrency(p.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3 font-semibold">
                  <span>Toplam</span>
                  <span className="text-indigo-600">{formatCurrency(drillCustomerPurchases.reduce((s: number, p: any) => s + p.totalAmount, 0))}</span>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ============ PROJELER ============ */}
      {activeTab === 'projeler' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold">Proje Bazlı Analiz <span className="text-sm text-slate-400 font-normal">({projectBreakdown.length})</span></h3></CardHeader>
            <CardBody className="p-0">
              {projectBreakdown.length === 0 ? (
                <p className="text-center text-slate-500 py-10">Henüz proje bazlı alım yok</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Proje</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Müşteri</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Malzeme Sayısı</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam Miktar</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam Harcama</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">KDV Toplamı</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">İlk / Son Alım</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectBreakdown.map((p: any) => (
                        <tr key={p.jobId} className={`hover:bg-slate-50 cursor-pointer ${drillProject === p.jobId ? 'bg-blue-50' : ''}`} onClick={() => setDrillProject(drillProject === p.jobId ? null : p.jobId)}>
                          <td className="px-4 py-2.5 font-medium text-blue-700">{p.name} <span className="text-xs text-slate-400">({p.refKodu})</span></td>
                          <td className="px-4 py-2.5 text-slate-600">{p.customer}</td>
                          <td className="px-4 py-2.5 text-right">{p.purchaseCount}</td>
                          <td className="px-4 py-2.5 text-right">{p.quantity.toLocaleString('tr-TR')}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(p.total)}</td>
                          <td className="px-4 py-2.5 text-right">{formatCurrency(p.vat)}</td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(p.firstDate)} → {formatDate(p.lastDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {drillProject && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Proje Malzemeleri</h3>
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/projeler/${drillProject}`} className="text-sm text-blue-600 hover:underline">Projeye Git</Link>
                    <button onClick={() => setDrillProject(null)} className="text-sm text-slate-500 hover:text-slate-700">Kapat</button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                        <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Malzeme</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Miktar</th>
                        <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drillProjectPurchases.map((p: any) => (
                        <tr key={p.id}>
                          <td className="px-4 py-2.5">{formatDate(p.purchaseDate)}</td>
                          <td className="px-4 py-2.5">{p.materialName || '-'}</td>
                          <td className="px-4 py-2.5 text-right">{p.quantity} {p.unit}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(p.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* ============ MALZEMELER ============ */}
      {activeTab === 'malzemeler' && (
        <Card>
          <CardHeader><h3 className="font-semibold">Malzeme Bazlı Analiz <span className="text-sm text-slate-400 font-normal">({materialBreakdown.length})</span></h3></CardHeader>
          <CardBody className="p-0">
            {materialBreakdown.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Henüz malzeme alımı yok</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Malzeme</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam Miktar</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">İşlem Sayısı</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Toplam Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {materialBreakdown.map((m: any) => (
                      <tr key={m.name} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-medium text-slate-800">{m.name}</td>
                        <td className="px-4 py-2.5 text-right">{m.quantity.toLocaleString('tr-TR')} {m.unit}</td>
                        <td className="px-4 py-2.5 text-right">{m.purchaseCount}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-indigo-600">{formatCurrency(m.total)}</td>
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
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                        <td className="px-4 py-2.5 text-slate-600">{PAYMENT_METHOD_LABELS[p.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS] || p.paymentMethod}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.job ? jobCustomerName(p.job) : '-'}</td>
                        <td className="px-4 py-2.5 text-slate-500 max-w-[240px] truncate">{p.description || '-'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-orange-600">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <Button variant="ghost" size="sm" onClick={() => setPaymentDrawer({ open: true, editing: p })}>Düzenle</Button>
                          <Button variant="ghost" size="sm" onClick={async () => {
                            if (!confirm('Bu ödeme kaydı silinsin mi? Bakiye yeniden hesaplanacak.')) return;
                            const r = await deleteSupplierPayment(p.id);
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

      {/* ============ EKSTRE ============ */}
      {activeTab === 'ekstre' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold">Ekstre</h3>
              <div className="flex items-center gap-2">
                <select value={ledgerFilter} onChange={(e) => setLedgerFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tüm Hareketler</option>
                  <option value="PURCHASE">Malzeme Alımı</option>
                  <option value="PAYMENT">Ödeme</option>
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
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Müşteri</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Borç</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Ödeme</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLedger.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(l.date)}</td>
                        <td className="px-4 py-2.5"><Badge className={l.kind === 'PAYMENT' ? 'bg-orange-100 text-orange-800' : 'bg-indigo-100 text-indigo-800'}>{l.label}</Badge></td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-[320px] truncate" title={l.description}>{l.description}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {l.jobId ? <Link href={`/admin/projeler/${l.jobId}`} className="text-blue-600 hover:underline">{l.customerName}</Link> : (l.customerName || '-')}
                        </td>
                        <td className="px-4 py-2.5 text-right text-indigo-600 font-medium">{l.debit ? formatCurrency(l.debit) : '-'}</td>
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

      {/* ============ RAPORLAR ============ */}
      {activeTab === 'raporlar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><h3 className="font-semibold">Toptancı Detay Raporu</h3></CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-500">Bu toptancı için tüm alım, müşteri, proje ve malzeme kırılımlarını içeren detaylı rapor{hasActiveFilter ? ' (Alımlar sekmesindeki filtrelere göre)' : ''}.</p>
              <Button onClick={exportSupplierReport}>Raporu Al</Button>
            </CardBody>
          </Card>
          <Card>
            <CardHeader><h3 className="font-semibold">Toptancı-Müşteri Raporu</h3></CardHeader>
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-500">Seçilen müşteri için bu toptancıdan yapılan tüm alımları ve proje bazlı toplamları içerir.</p>
              <select value={reportCustomer} onChange={(e) => setReportCustomer(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Müşteri seçin...</option>
                {customerBreakdown.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <Button onClick={exportCustomerReport} disabled={!reportCustomer}>Raporu Al</Button>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ============ AKTİVİTE ============ */}
      {activeTab === 'aktivite' && (
        <Card>
          <CardHeader><h3 className="font-semibold">Aktivite Geçmişi <span className="text-sm text-slate-400 font-normal">({auditLogs.length})</span></h3></CardHeader>
          <CardBody className="p-0">
            {auditLogs.length === 0 ? (
              <p className="text-center text-slate-500 py-10">Henüz aktivite kaydı yok</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800' };
                  const entityLabel = ENTITY_LABELS[log.entity] || log.entity;
                  return (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
                        <div>
                          <span className="text-sm font-medium text-slate-600">{entityLabel}</span>
                          {log.details && <p className="text-sm text-slate-800 mt-1">{log.details}</p>}
                          <p className="text-xs text-slate-500 mt-1">{log.user.adSoyad} tarafından</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* ============ DRAWERS ============ */}
      <SupplierPaymentDrawer
        state={paymentDrawer}
        onClose={() => setPaymentDrawer({ open: false, editing: null })}
        supplier={supplier}
        jobs={jobs}
        openBalance={summary.openBalance}
        onSaved={() => { setPaymentDrawer({ open: false, editing: null }); router.refresh(); }}
      />

      <Drawer isOpen={editDrawerOpen} onClose={() => setEditDrawerOpen(false)} title="Toptancı Düzenle">
        <EditSupplierForm
          supplier={supplier}
          onSaved={() => { setEditDrawerOpen(false); router.refresh(); }}
          onClose={() => setEditDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}

// ============================================================
// TOPTANCI ÖDEME DRAWER
// ============================================================
function SupplierPaymentDrawer({ state, onClose, supplier, jobs, openBalance, onSaved }: any) {
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
      paymentDate: isEdit ? editing.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: isEdit ? editing.paymentMethod : 'Nakit',
      jobId: isEdit ? (editing.jobId || '') : '',
      description: isEdit ? (editing.description || '') : (editing?.quickAmount ? `${supplier.name} — kalan bakiye ödemesi` : ''),
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
      supplierId: supplier.id,
      amount,
      paymentDate: form.paymentDate,
      paymentMethod: form.paymentMethod,
      jobId: form.jobId || null,
      description: form.description || undefined,
    };
    const r = isEdit ? await updateSupplierPayment(editing.id, payload) : await createSupplierPayment(payload as any);
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
            <button type="button" className="text-blue-600 underline text-xs" onClick={() => setForm({ ...form, amount: openBalance.toString() })}>Tutarı doldur</button>
          </div>
        )}

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

// ============================================================
// TOPTANCI DÜZENLEME FORMU
// ============================================================
function EditSupplierForm({ supplier, onSaved, onClose }: any) {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: supplier.name,
    contactName: supplier.contactName || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    taxNo: supplier.taxNo || '',
    notes: supplier.notes || '',
    isActive: supplier.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (!form.name.trim()) { toast.error('Firma adı gerekli'); return; }
    setIsLoading(true);
    const r = await updateSupplier(supplier.id, form);
    setIsLoading(false);
    if (r.success) { toast.success('Toptancı bilgileri güncellendi'); onSaved(); }
    else toast.error(r.error || 'Hata oluştu');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Firma Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <Input label="Yetkili Kişi" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="E-posta" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <Input label="Vergi No" value={form.taxNo} onChange={(e) => setForm({ ...form, taxNo: e.target.value })} />
      <TextArea label="Adres" value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} />
      <TextArea label="Notlar" value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Aktif
      </label>
      <div className="flex space-x-3 pt-4 border-t">
        <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
        <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
      </div>
    </form>
  );
}
