'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_PRIORITY_LABELS,
  JOB_PRIORITY_COLORS,
  PAYMENT_PARTY_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/constants';
import { formatCurrency, formatDate, formatDateTime, formatPhone, parseEtiketler } from '@/lib/utils';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';
import { updateJobStatus, deleteBusinessJob } from '@/app/actions/business-jobs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Tab Components
import GeneralTab from './tabs/GeneralTab';
import OffersTab from './tabs/OffersTab';
import ContractsTab from './tabs/ContractsTab';
import PaymentsTab from './tabs/PaymentsTab';
import OrdersTab from './tabs/OrdersTab';
import WorkLogsTab from './tabs/WorkLogsTab';
import WorkEntriesTab from './tabs/WorkEntriesTab';
import MaterialPurchasesTab from './tabs/MaterialPurchasesTab';
import LedgerTab from './tabs/LedgerTab';
import AuditTab from './tabs/AuditTab';

export default function JobDetailClient({ data }: any) {
  const router = useRouter();
  const { job, financials } = data;
  const [isStatusChanging, setIsStatusChanging] = useState(false);

  // Parse etiketler güvenli şekilde
  const etiketler = parseEtiketler(job.etiketler);

  const handleStatusChange = async (newStatus: string) => {
    if (confirm(`Durum "${JOB_STATUS_LABELS[newStatus as keyof typeof JOB_STATUS_LABELS]}" olarak değiştirilsin mi?`)) {
      setIsStatusChanging(true);
      const result = await updateJobStatus(job.id, newStatus);
      if (result.success) {
        toast.success('Durum güncellendi');
        router.refresh();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
      setIsStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`"${job.firmaAdi || job.musteriAdi}" iş emri silinsin mi? Bu işlem geri alınamaz!`)) {
      const result = await deleteBusinessJob(job.id);
      if (result.success) {
        toast.success('İş emri silindi');
        router.push('/admin/is-emirleri');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    }
  };

  const handleExportPdf = () => {
    const sections: PdfSection[] = [];

    // Müşteri bilgileri
    sections.push({
      title: 'Müşteri / İş Emri Bilgileri',
      type: 'info-grid',
      data: [
        { label: 'Referans Kodu', value: job.referansKodu },
        { label: 'Firma Adı', value: job.firmaAdi || '-' },
        { label: 'Müşteri', value: `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim() },
        { label: 'İş Tipi', value: job.isTipi || '-' },
        { label: 'Durum', value: JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS] || job.durum },
        { label: 'Öncelik', value: JOB_PRIORITY_LABELS[job.oncelik as keyof typeof JOB_PRIORITY_LABELS] || job.oncelik },
        { label: 'Telefon', value: formatPhone(job.telefon) },
        { label: 'E-posta', value: job.email || '-' },
        { label: 'TC Kimlik No', value: job.tcKimlikNo || '-' },
        { label: 'Vergi No', value: job.vergiNo || '-' },
        { label: 'İl / İlçe', value: `${job.il || ''} ${job.ilce ? '/ ' + job.ilce : ''}`.trim() || '-' },
        { label: 'Adres', value: job.adres || '-' },
        { label: 'Fatura Ünvanı', value: job.faturaUnvani || '-' },
        { label: 'Oluşturma Tarihi', value: formatDate(job.olusturmaTarihi) },
      ],
    });

    // Finansal özet
    sections.push({
      title: 'Finansal Özet',
      type: 'summary-cards',
      data: [
        { label: 'Toplam Teklif', value: formatCurrency(financials.totalOfferAmount), color: 'blue' },
        { label: 'Toplam Tahsilat', value: formatCurrency(financials.totalIncome), color: 'positive' },
        { label: 'Toplam Maliyet', value: formatCurrency(financials.totalProjectCost || 0), color: 'orange', sub: `İşçilik: ${formatCurrency(financials.laborCostTotal || 0)} | Malzeme: ${formatCurrency(financials.materialCostTotal || 0)}` },
        { label: 'Kalan Alacak', value: formatCurrency(financials.remainingReceivable), color: financials.remainingReceivable > 0 ? 'orange' : 'neutral' },
        { label: 'Net Kar/Zarar', value: formatCurrency(financials.netProfit), color: financials.netProfit >= 0 ? 'positive' : 'negative' },
      ],
    });

    // Notlar
    if (job.notlar) {
      sections.push({ title: 'Notlar', type: 'text', data: job.notlar });
    }

    sections.push({ type: 'divider' });

    // Teklifler
    if (job.offers && job.offers.length > 0) {
      sections.push({
        title: `Teklifler (${job.offers.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Teklif No', key: 'no', bold: true },
            { header: 'Başlık', key: 'baslik' },
            { header: 'Durum', key: 'durum' },
            { header: 'Genel Toplam', key: 'toplam', align: 'right' as const },
            { header: 'Tarih', key: 'tarih' },
          ],
          rows: job.offers.map((o: any) => ({
            no: o.teklifNo,
            baslik: o.baslik,
            durum: o.durum,
            toplam: formatCurrency(o.genelToplam),
            tarih: formatDate(o.createdAt),
          })),
        },
      });
    }

    // Sözleşmeler
    if (job.contracts && job.contracts.length > 0) {
      sections.push({
        title: `Sözleşmeler (${job.contracts.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Sözleşme No', key: 'no', bold: true },
            { header: 'Başlık', key: 'baslik' },
            { header: 'Durum', key: 'durum' },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: job.contracts.map((c: any) => ({
            no: c.sozlesmeNo,
            baslik: c.baslik,
            durum: c.durum,
            toplam: formatCurrency(c.toplamTutar),
          })),
        },
      });
    }

    // Tahsilatlar
    const tahsilatlar = (job.payments || []).filter((p: any) => p.tip === 'Tahsilat');
    if (tahsilatlar.length > 0) {
      const totalTahsilat = tahsilatlar.reduce((s: number, p: any) => s + p.tutar, 0);
      sections.push({
        title: `Tahsilatlar (${tahsilatlar.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Taraf', key: 'taraf' },
            { header: 'Yöntem', key: 'yontem' },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Tutar', key: 'tutar', align: 'right' as const },
          ],
          rows: tahsilatlar.map((p: any) => ({
            tarih: formatDate(p.tarih),
            taraf: PAYMENT_PARTY_LABELS[p.taraf as keyof typeof PAYMENT_PARTY_LABELS] || p.taraf,
            yontem: PAYMENT_METHOD_LABELS[p.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || p.odemeYontemi,
            aciklama: p.aciklama || '-',
            tutar: formatCurrency(p.tutar),
          })),
          footer: { tarih: 'TOPLAM', taraf: '', yontem: '', aciklama: '', tutar: formatCurrency(totalTahsilat) },
        },
      });
    }

    // Giderler
    const giderler = (job.payments || []).filter((p: any) => p.tip === 'Gider');
    if (giderler.length > 0) {
      const totalGider = giderler.reduce((s: number, p: any) => s + p.tutar, 0);
      sections.push({
        title: `Giderler (${giderler.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Taraf', key: 'taraf' },
            { header: 'Usta', key: 'usta' },
            { header: 'Yöntem', key: 'yontem' },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Tutar', key: 'tutar', align: 'right' as const },
          ],
          rows: giderler.map((p: any) => ({
            tarih: formatDate(p.tarih),
            taraf: PAYMENT_PARTY_LABELS[p.taraf as keyof typeof PAYMENT_PARTY_LABELS] || p.taraf,
            usta: p.master?.adSoyad || '-',
            yontem: PAYMENT_METHOD_LABELS[p.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || p.odemeYontemi,
            aciklama: p.aciklama || '-',
            tutar: formatCurrency(p.tutar),
          })),
          footer: { tarih: 'TOPLAM', taraf: '', usta: '', yontem: '', aciklama: '', tutar: formatCurrency(totalGider) },
        },
      });
    }

    // İşçilik Kayıtları (WorkEntries)
    if (job.workEntries && job.workEntries.length > 0) {
      const totalWE = job.workEntries.reduce((s: number, e: any) => s + e.totalAmount, 0);
      const totalHours = job.workEntries.reduce((s: number, e: any) => s + e.hours, 0);
      sections.push({
        title: `İşçilik Kayıtları (${job.workEntries.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Çalışan', key: 'calisan', bold: true },
            { header: 'Saat', key: 'saat', align: 'right' as const },
            { header: 'Saat Ücreti', key: 'ucret', align: 'right' as const },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: job.workEntries.map((e: any) => ({
            tarih: formatDate(e.date),
            calisan: e.worker?.fullName || '-',
            saat: e.hours.toFixed(1),
            ucret: formatCurrency(e.hourlyRate),
            aciklama: e.description || '-',
            toplam: formatCurrency(e.totalAmount),
          })),
          footer: { tarih: 'TOPLAM', calisan: '', saat: totalHours.toFixed(1), ucret: '', aciklama: '', toplam: formatCurrency(totalWE) },
        },
      });
    }

    // Malzeme Alımları
    if (job.materialPurchases && job.materialPurchases.length > 0) {
      const totalMP = job.materialPurchases.reduce((s: number, p: any) => s + p.totalAmount, 0);
      sections.push({
        title: `Malzeme Alımları (${job.materialPurchases.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Tedarikçi', key: 'tedarikci', bold: true },
            { header: 'Malzeme', key: 'malzeme' },
            { header: 'Miktar', key: 'miktar', align: 'right' as const },
            { header: 'Birim Fiyat', key: 'birimFiyat', align: 'right' as const },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: job.materialPurchases.map((p: any) => ({
            tarih: formatDate(p.purchaseDate),
            tedarikci: p.supplier?.name || '-',
            malzeme: p.material?.name || p.materialName || '-',
            miktar: `${p.quantity} ${p.unit}`,
            birimFiyat: formatCurrency(p.unitPrice),
            toplam: formatCurrency(p.totalAmount),
          })),
          footer: { tarih: 'TOPLAM', tedarikci: '', malzeme: '', miktar: '', birimFiyat: '', toplam: formatCurrency(totalMP) },
        },
      });
    }

    // Usta Kayıtları (WorkLogs - eski sistem)
    if (job.workLogs && job.workLogs.length > 0) {
      const totalWL = job.workLogs.reduce((s: number, w: any) => s + (w.toplamTutar || 0), 0);
      const totalWLHours = job.workLogs.reduce((s: number, w: any) => s + w.toplamSaat, 0);
      sections.push({
        title: `Usta Çalışma Kayıtları (${job.workLogs.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Usta', key: 'usta', bold: true },
            { header: 'Saat', key: 'saat', align: 'right' as const },
            { header: 'Birim Ücret', key: 'ucret', align: 'right' as const },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: job.workLogs.map((w: any) => ({
            tarih: formatDate(w.tarih),
            usta: w.master?.adSoyad || '-',
            saat: w.toplamSaat.toFixed(1),
            ucret: formatCurrency(w.birimUcret),
            aciklama: w.aciklama || '-',
            toplam: formatCurrency(w.toplamTutar),
          })),
          footer: { tarih: 'TOPLAM', usta: '', saat: totalWLHours.toFixed(1), ucret: '', aciklama: '', toplam: formatCurrency(totalWL) },
        },
      });
    }

    // Siparişler
    if (job.orders && job.orders.length > 0) {
      sections.push({
        title: `Siparişler (${job.orders.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Sipariş No', key: 'no', bold: true },
            { header: 'Tedarikçi', key: 'tedarikci' },
            { header: 'Durum', key: 'durum' },
            { header: 'Genel Toplam', key: 'toplam', align: 'right' as const },
          ],
          rows: job.orders.map((o: any) => ({
            no: o.siparisNo,
            tedarikci: o.tedarikci,
            durum: o.durum,
            toplam: formatCurrency(o.genelToplam),
          })),
        },
      });
    }

    // Ekstre
    sections.push({ type: 'divider' });
    const transactions: any[] = [];
    (job.offers || []).filter((o: any) => o.durum === 'Kabul').forEach((offer: any) => {
      transactions.push({ tarih: offer.updatedAt, tur: 'Teklif (Kabul)', aciklama: offer.baslik, borc: 0, alacak: offer.genelToplam });
    });
    (job.payments || []).forEach((payment: any) => {
      transactions.push({
        tarih: payment.tarih,
        tur: payment.tip === 'Tahsilat' ? 'Tahsilat' : 'Gider',
        aciklama: payment.aciklama || payment.taraf,
        borc: payment.tip === 'Gider' ? payment.tutar : 0,
        alacak: payment.tip === 'Tahsilat' ? payment.tutar : 0,
      });
    });
    transactions.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());
    let bakiye = 0;
    transactions.forEach((t) => { bakiye += t.alacak - t.borc; t.bakiye = bakiye; });

    if (transactions.length > 0) {
      sections.push({
        title: 'Ekstre',
        type: 'table',
        data: {
          columns: [
            { header: 'Tarih', key: 'tarih' },
            { header: 'Tür', key: 'tur' },
            { header: 'Açıklama', key: 'aciklama' },
            { header: 'Borç', key: 'borc', align: 'right' as const },
            { header: 'Alacak', key: 'alacak', align: 'right' as const },
            { header: 'Bakiye', key: 'bakiye', align: 'right' as const },
          ],
          rows: transactions.map((t) => ({
            tarih: formatDate(t.tarih),
            tur: t.tur,
            aciklama: t.aciklama,
            borc: t.borc > 0 ? formatCurrency(t.borc) : '-',
            alacak: t.alacak > 0 ? formatCurrency(t.alacak) : '-',
            bakiye: formatCurrency(t.bakiye),
          })),
        },
      });
    }

    exportToPdf({
      title: `İş Emri: ${job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim()}`,
      subtitle: `${job.referansKodu} • ${JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS] || job.durum}${job.isTipi ? ' • ' + job.isTipi : ''}`,
      sections,
    });
  };

  const tabs = [
    {
      id: 'genel',
      label: 'Genel Bilgiler',
      content: <GeneralTab job={job} />,
    },
    {
      id: 'teklifler',
      label: `Teklifler (${job.offers?.length || 0})`,
      content: <OffersTab job={job} />,
    },
    {
      id: 'sozlesmeler',
      label: `Sözleşmeler (${job.contracts?.length || 0})`,
      content: <ContractsTab job={job} />,
    },
    {
      id: 'odemeler',
      label: `Ödemeler (${job.payments?.length || 0})`,
      content: <PaymentsTab job={job} paymentPlans={job.paymentPlans || []} />,
    },
    {
      id: 'siparisler',
      label: `Siparişler (${job.orders?.length || 0})`,
      content: <OrdersTab job={job} />,
    },
    {
      id: 'iscilik',
      label: `İşçilik (${job.workEntries?.length || 0})`,
      content: <WorkEntriesTab job={job} workEntries={job.workEntries || []} />,
    },
    {
      id: 'malzeme',
      label: `Malzeme (${job.materialPurchases?.length || 0})`,
      content: <MaterialPurchasesTab job={job} materialPurchases={job.materialPurchases || []} />,
    },
    {
      id: 'ustalar',
      label: `Usta Kayıtları (${job.workLogs?.length || 0})`,
      content: <WorkLogsTab job={job} />,
    },
    {
      id: 'ekstre',
      label: 'Ekstre',
      content: <LedgerTab job={job} financials={financials} />,
    },
    {
      id: 'audit',
      label: 'Aktivite',
      content: <AuditTab auditLogs={job.auditLogs || []} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link href="/admin/is-emirleri">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`}</h1>
          </div>
          <div className="mt-2 flex items-center flex-wrap gap-2">
            <p className="text-gray-600">{job.referansKodu}</p>
            <Badge className={JOB_STATUS_COLORS[job.durum as keyof typeof JOB_STATUS_COLORS]}>
              {JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS]}
            </Badge>
            <Badge className={JOB_PRIORITY_COLORS[job.oncelik as keyof typeof JOB_PRIORITY_COLORS]}>
              {JOB_PRIORITY_LABELS[job.oncelik as keyof typeof JOB_PRIORITY_COLORS]}
            </Badge>
            {job.isTipi && (
              <Badge className="bg-indigo-100 text-indigo-800">{job.isTipi}</Badge>
            )}
            {etiketler.map((tag: string) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleExportPdf}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </Button>
          <Link href={`/admin/is-emirleri/${job.id}/duzenle`}>
            <Button variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Düzenle
            </Button>
          </Link>
          <Button variant="danger" onClick={handleDelete}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Sil
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards - Enhanced */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Toplam Teklif</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(financials.totalOfferAmount)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Toplam Tahsilat</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(financials.totalIncome)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Toplam Maliyet</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {formatCurrency(financials.totalProjectCost || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              İşçilik: {formatCurrency(financials.laborCostTotal || 0)} | Malzeme: {formatCurrency(financials.materialCostTotal || 0)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Kalan Alacak</p>
            <p className={`text-2xl font-bold mt-1 ${financials.remainingReceivable > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {formatCurrency(financials.remainingReceivable)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Net Kar/Zarar</p>
            <p className={`text-2xl font-bold mt-1 ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Status Change Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Durum Değiştir</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {Object.entries(JOB_STATUS_LABELS).map(([status, label]) => (
              <Button
                key={status}
                variant={job.durum === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleStatusChange(status)}
                disabled={isStatusChanging || job.durum === status}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="genel" />
    </div>
  );
}
