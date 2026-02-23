'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Drawer } from '@/components/ui/Drawer';
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_PRIORITY_LABELS,
  JOB_PRIORITY_COLORS,
  PROFITABILITY_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate, formatDateTime, parseEtiketler } from '@/lib/utils';
import { updateJobStatus, deleteBusinessJob } from '@/app/actions/business-jobs';
import toast from 'react-hot-toast';

// Tab Components
import GeneralTab from './tabs/GeneralTab';
import WorkersTab from './tabs/WorkersTab';
import MaterialsTab from './tabs/MaterialsTab';
import ExpensesTab from './tabs/ExpensesTab';
import CollectionsTab from './tabs/CollectionsTab';
import ProfitAnalysisTab from './tabs/ProfitAnalysisTab';
import FilesTab from './tabs/FilesTab';
import ActivityTab from './tabs/ActivityTab';

// Drawer Forms
import AddWorkEntryDrawer from './drawers/AddWorkEntryDrawer';
import AddMaterialPurchaseDrawer from './drawers/AddMaterialPurchaseDrawer';
import AddExpenseDrawer from './drawers/AddExpenseDrawer';
import AddCollectionDrawer from './drawers/AddCollectionDrawer';

interface ProjectDetailClientProps {
  data: any;
  formData: {
    workers: any[];
    suppliers: any[];
    materials: any[];
  };
}

export default function ProjectDetailClient({ data, formData }: ProjectDetailClientProps) {
  const router = useRouter();
  const { project, financials, metrics } = data;
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // Parse etiketler güvenli şekilde
  const etiketler = parseEtiketler(project.etiketler);

  const handleStatusChange = async (newStatus: string) => {
    if (confirm(`Durum "${JOB_STATUS_LABELS[newStatus as keyof typeof JOB_STATUS_LABELS]}" olarak değiştirilsin mi?`)) {
      setIsStatusChanging(true);
      const result = await updateJobStatus(project.id, newStatus);
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
    if (confirm(`"${project.projeAdi}" projesi silinsin mi? Bu işlem geri alınamaz!`)) {
      const result = await deleteBusinessJob(project.id);
      if (result.success) {
        toast.success('Proje silindi');
        router.push('/admin/projeler');
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    }
  };

  const getProfitColor = () => {
    if (financials.netProfit > 0) return 'text-emerald-600';
    if (financials.netProfit < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const tabs = [
    {
      id: 'genel',
      label: 'Genel',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: <GeneralTab project={project} metrics={metrics} />,
    },
    {
      id: 'ustalar',
      label: `Ustalar & İşçilik (${project.workEntries?.length || 0})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: <WorkersTab project={project} workerSummary={metrics.workerSummary} />,
    },
    {
      id: 'malzemeler',
      label: `Malzemeler (${project.materialPurchases?.length || 0})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      content: <MaterialsTab project={project} supplierSummary={metrics.supplierSummary} />,
    },
    {
      id: 'giderler',
      label: `Giderler`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: <ExpensesTab project={project} financials={financials} />,
    },
    {
      id: 'tahsilat',
      label: `Tahsilat & Ödemeler`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: <CollectionsTab project={project} financials={financials} metrics={metrics} />,
    },
    {
      id: 'kar-analizi',
      label: 'Kâr Analizi',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: <ProfitAnalysisTab project={project} financials={financials} />,
    },
    {
      id: 'dosyalar',
      label: `Dosyalar (${project.files?.length || 0})`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      content: <FilesTab project={project} />,
    },
    {
      id: 'aktivite',
      label: 'Aktivite',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: <ActivityTab auditLogs={project.auditLogs || []} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link href="/admin/projeler">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{project.projeAdi}</h1>
          </div>
          <div className="mt-2 flex items-center flex-wrap gap-2">
            <span className="text-gray-500 text-sm">{project.referansKodu}</span>
            <Badge className={JOB_STATUS_COLORS[project.durum as keyof typeof JOB_STATUS_COLORS]}>
              {JOB_STATUS_LABELS[project.durum as keyof typeof JOB_STATUS_LABELS]}
            </Badge>
            <Badge className={JOB_PRIORITY_COLORS[project.oncelik as keyof typeof JOB_PRIORITY_COLORS]}>
              {JOB_PRIORITY_LABELS[project.oncelik as keyof typeof JOB_PRIORITY_LABELS]}
            </Badge>
            {etiketler.map((tag: string) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <Link href={`/admin/projeler/${project.id}/duzenle`}>
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

      {/* 5-Card Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sözleşme Toplamı</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(financials.contractTotal || financials.totalOfferAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Tahsilat</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {formatCurrency(financials.totalCollection)}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Maliyet</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(financials.totalProjectCost)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  İşçilik: {formatCurrency(financials.laborCostTotal)} | Malzeme: {formatCurrency(financials.materialCostTotal)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kalan Alacak</p>
                <p className={`text-2xl font-bold mt-1 ${financials.remainingReceivable > 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                  {formatCurrency(financials.remainingReceivable)}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={`border-l-4 ${financials.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Kâr/Zarar</p>
                <p className={`text-2xl font-bold mt-1 ${getProfitColor()}`}>
                  {formatCurrency(financials.netProfit)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${financials.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <svg className={`w-6 h-6 ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Content: Tabs + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content - Tabs */}
        <div className="lg:col-span-3">
          {/* Status Change */}
          <Card className="mb-6">
            <CardBody>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Proje Durumu</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_STATUS_LABELS).map(([status, label]) => (
                    <Button
                      key={status}
                      variant={project.durum === status ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={isStatusChanging || project.durum === status}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          <Tabs tabs={tabs} defaultTab="genel" />
        </div>

        {/* Right Sidebar - Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Add Buttons */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Hızlı Ekle
              </h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setActiveDrawer('workEntry')}
              >
                <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                İşçilik Kaydı
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setActiveDrawer('materialPurchase')}
              >
                <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Malzeme Alımı
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setActiveDrawer('expense')}
              >
                <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gider Ekle
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => setActiveDrawer('collection')}
              >
                <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tahsilat Ekle
              </Button>
            </CardBody>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">İlerleme</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <span>{JOB_STATUS_LABELS[project.durum as keyof typeof JOB_STATUS_LABELS]}</span>
                <span>%{metrics.progress}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.progress}%` }}
                />
              </div>
            </CardBody>
          </Card>

          {/* Overdue Payments Warning */}
          {metrics.overduePayments.length > 0 && (
            <Card className="border-l-4 border-l-red-500 bg-red-50">
              <CardBody>
                <h4 className="font-semibold text-red-800 flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Geciken Ödemeler
                </h4>
                <p className="text-sm text-red-700">
                  {metrics.overduePayments.length} adet geciken ödeme var
                </p>
                <p className="text-lg font-bold text-red-800 mt-1">
                  {formatCurrency(metrics.overduePayments.reduce((sum: number, p: any) => sum + p.tutar, 0))}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Upcoming Payments */}
          {metrics.upcomingPayments.length > 0 && (
            <Card className="border-l-4 border-l-amber-500 bg-amber-50">
              <CardBody>
                <h4 className="font-semibold text-amber-800 flex items-center mb-2">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Yaklaşan Ödemeler
                </h4>
                <p className="text-sm text-amber-700">
                  7 gün içinde {metrics.upcomingPayments.length} ödeme var
                </p>
                <p className="text-lg font-bold text-amber-800 mt-1">
                  {formatCurrency(metrics.upcomingPayments.reduce((sum: number, p: any) => sum + p.tutar, 0))}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Son Aktiviteler</h3>
            </CardHeader>
            <CardBody className="p-0">
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {project.auditLogs?.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm text-gray-900">{log.details || log.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.user?.adSoyad} • {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))}
                {(!project.auditLogs || project.auditLogs.length === 0) && (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    Henüz aktivite yok
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Drawers */}
      <AddWorkEntryDrawer
        isOpen={activeDrawer === 'workEntry'}
        onClose={() => setActiveDrawer(null)}
        projectId={project.id}
        workers={formData.workers}
      />
      <AddMaterialPurchaseDrawer
        isOpen={activeDrawer === 'materialPurchase'}
        onClose={() => setActiveDrawer(null)}
        projectId={project.id}
        suppliers={formData.suppliers}
        materials={formData.materials}
      />
      <AddExpenseDrawer
        isOpen={activeDrawer === 'expense'}
        onClose={() => setActiveDrawer(null)}
        projectId={project.id}
      />
      <AddCollectionDrawer
        isOpen={activeDrawer === 'collection'}
        onClose={() => setActiveDrawer(null)}
        projectId={project.id}
      />
    </div>
  );
}
