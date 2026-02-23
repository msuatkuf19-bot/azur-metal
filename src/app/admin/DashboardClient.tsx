'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, JOB_PRIORITY_LABELS } from '@/lib/constants';

interface DashboardClientProps {
  data: any;
  userName: string;
}

export default function DashboardClient({ data, userName }: DashboardClientProps) {
  const { stats, recentActivities, upcomingPayments, recentJobs } = data;
  const netProfit = stats.monthlyIncome - stats.monthlyExpense;

  const kpiCards = [
    {
      title: 'Aktif İş Emirleri',
      value: stats.activeJobs,
      total: stats.totalJobs,
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-blue-500',
      href: '/admin/is-emirleri',
    },
    {
      title: 'Bu Ay Tahsilat',
      value: formatCurrency(stats.monthlyIncome),
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Bu Ay Gider',
      value: formatCurrency(stats.monthlyExpense),
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-red-500',
    },
    {
      title: 'Net Kar/Zarar',
      value: formatCurrency(netProfit),
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      color: netProfit >= 0 ? 'bg-emerald-500' : 'bg-orange-500',
    },
  ];

  const alerts = [
    ...(stats.overduePayments > 0 ? [{
      type: 'danger' as const,
      title: 'Geciken Ödemeler',
      message: `${stats.overduePayments} ödeme vadesi geçmiş`,
      href: '/admin/is-emirleri',
    }] : []),
    ...(stats.pendingContracts > 0 ? [{
      type: 'warning' as const,
      title: 'İmza Bekleyen Sözleşmeler',
      message: `${stats.pendingContracts} sözleşme imza bekliyor`,
      href: '/admin/is-emirleri',
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hoş geldiniz, {userName}! 👋
        </h1>
        <p className="text-gray-600 mt-1">İşte bugünkü özet</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                alert.type === 'danger' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className={`w-5 h-5 mr-3 ${alert.type === 'danger' ? 'text-red-600' : 'text-yellow-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className={`font-semibold ${alert.type === 'danger' ? 'text-red-900' : 'text-yellow-900'}`}>
                      {alert.title}
                    </p>
                    <p className={`text-sm ${alert.type === 'danger' ? 'text-red-700' : 'text-yellow-700'}`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
                <Link href={alert.href}>
                  <Button variant="ghost" size="sm">
                    Görüntüle
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, idx) => (
          <Card key={idx} className="hover:shadow-lg transition-shadow">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {kpi.value}
                  </p>
                  {kpi.total !== undefined && (
                    <p className="mt-1 text-sm text-gray-500">
                      Toplam: {kpi.total}
                    </p>
                  )}
                </div>
                <div className={`${kpi.color} text-white p-3 rounded-lg`}>
                  {kpi.icon}
                </div>
              </div>
              {kpi.href && (
                <Link href={kpi.href}>
                  <Button variant="ghost" size="sm" className="mt-4 w-full">
                    Detay →
                  </Button>
                </Link>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Ödemeler */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Yaklaşan Ödemeler (7 Gün)</h3>
          </CardHeader>
          <CardBody>
            {upcomingPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Yaklaşan ödeme yok</p>
            ) : (
              <div className="space-y-3">
                {upcomingPayments.map((payment: any) => (
                  <Link key={payment.id} href={`/admin/is-emirleri/${payment.jobId}`}>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {payment.job.firmaAdi || `${payment.job.musteriAdi} ${payment.job.musteriSoyadi || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-500">{payment.aciklama}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.tutar)}</p>
                        <p className="text-sm text-gray-500">{formatDate(payment.vadeTarihi)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Son İş Emirleri */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Son İş Emirleri</h3>
          </CardHeader>
          <CardBody>
            {recentJobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Henüz iş emri yok</p>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job: any) => (
                  <Link key={job.id} href={`/admin/is-emirleri/${job.id}`}>
                    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim()}
                        </p>
                        <p className="text-sm text-gray-500">{job.referansKodu}</p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={JOB_STATUS_COLORS[job.durum as keyof typeof JOB_STATUS_COLORS]}>
                          {JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS]}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">{formatDate(job.olusturmaTarihi)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Hızlı Aksiyonlar */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Hızlı Aksiyonlar</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/is-emirleri/yeni">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <p className="font-medium text-gray-700">Yeni İş Emri</p>
              </div>
            </Link>
            <Link href="/admin/ustalar">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-medium text-gray-700">Usta Yönetimi</p>
              </div>
            </Link>
            <Link href="/admin/is-emirleri">
              <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors cursor-pointer text-center">
                <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="font-medium text-gray-700">Raporlar</p>
              </div>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
