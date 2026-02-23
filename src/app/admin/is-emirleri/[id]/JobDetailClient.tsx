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
} from '@/lib/constants';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils';
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

  // Parse etiketler if it's a JSON string
  const etiketler = typeof job.etiketler === 'string' 
    ? JSON.parse(job.etiketler || '[]') 
    : (job.etiketler || []);

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
            {etiketler.map((tag: string) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
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
