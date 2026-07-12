'use client';

import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { MoneyDisplay } from '@/components/ui/MoneyDisplay';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS, ATTENDANCE_TYPE_LABELS, ATTENDANCE_TYPE_COLORS } from '@/lib/constants';

interface DashboardClientProps {
  data: any;
  userName: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'oluşturdu',
  UPDATE: 'güncelledi',
  DELETE: 'sildi',
  ACTIVATE: 'aktifleştirdi',
  CLOSE_PERIOD: 'dönem kapattı',
};

const ICONS = {
  jobs: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  income: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  expense: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  cash: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  worker: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  supplier: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
};

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function MiniBarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  return (
    <div className="flex items-end justify-between gap-3 h-40 px-2">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center gap-1 h-32">
            <div className="w-1/2 bg-success-400 rounded-t" style={{ height: `${(d.income / max) * 100}%` }} title={formatCurrency(d.income)} />
            <div className="w-1/2 bg-danger-400 rounded-t" style={{ height: `${(d.expense / max) * 100}%` }} title={formatCurrency(d.expense)} />
          </div>
          <span className="text-[11px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function ProfitBarList({ items, colorClass }: { items: { id: string; name: string; refKodu: string; value: number }[]; colorClass: string }) {
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <Link key={i.id} href={`/admin/is-emirleri/${i.id}`} className="block group">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-700 group-hover:text-blue-600 truncate">{i.name}</span>
            <MoneyDisplay amount={i.value} size="sm" className="font-semibold text-slate-800" />
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${(Math.abs(i.value) / max) * 100}%` }} />
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardClient({ data, userName }: DashboardClientProps) {
  const { stats, recentActivities, upcomingPayments, overdueList, recentJobs, workerOpenBalances, supplierOpenBalances, todayAttendanceCounts, topProfitable, topCostly, monthlyTrend } = data;
  const todayLabel = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {greeting()}, {userName}
          </h1>
          <p className="text-slate-500 mt-1 capitalize">{todayLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/is-emirleri/yeni">
            <Button size="sm">+ Yeni İş Emri</Button>
          </Link>
          <Link href="/admin/projeler/yeni">
            <Button size="sm" variant="secondary">
              + Yeni Proje
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Aktif Proje" value={stats.activeJobs} sub={`Toplam ${stats.totalJobs} iş emri`} icon={ICONS.jobs} accent="info" href="/admin/is-emirleri" />
        <StatCard title="Bu Ayki Gelir" value={formatCurrency(stats.monthlyIncome)} icon={ICONS.income} accent="success" />
        <StatCard title="Bu Ayki Gider" value={formatCurrency(stats.monthlyExpense)} icon={ICONS.expense} accent="danger" />
        <StatCard title="Net Nakit Durumu" value={formatCurrency(stats.netCash)} sub="Gelir - gider - açık borçlar" icon={ICONS.cash} accent={stats.netCash >= 0 ? 'success' : 'danger'} />
        <StatCard title="Personel Borcu" value={formatCurrency(stats.totalPersonnelDebt)} sub={`${workerOpenBalances.length} açık bakiye`} icon={ICONS.worker} accent="warning" href="/admin/personel-odemeleri" />
        <StatCard title="Toptancı Borcu" value={formatCurrency(stats.totalSupplierDebt)} sub={`${supplierOpenBalances.length} açık bakiye`} icon={ICONS.supplier} accent="warning" href="/admin/tedarikci-odemeleri" />
        <StatCard title="Bekleyen Tahsilat" value={upcomingPayments.length} sub="Önümüzdeki 7 gün" icon={ICONS.cash} accent="info" />
        <StatCard title="Geciken Ödeme" value={stats.overduePayments} sub={`${stats.pendingContracts} imza bekleyen sözleşme`} icon={ICONS.warning} accent={stats.overduePayments > 0 ? 'danger' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aylık gelir-gider grafiği */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Aylık Gelir - Gider</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-success-400" /> Gelir
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-danger-400" /> Gider
                </span>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <MiniBarChart data={monthlyTrend} />
          </CardBody>
        </Card>

        {/* Proje kârlılık grafiği */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Proje Kârlılığı</h3>
          </CardHeader>
          <CardBody>
            {topProfitable.length === 0 ? (
              <EmptyState title="Henüz kâr analizi için veri yok" />
            ) : (
              <ProfitBarList
                items={topProfitable.map((p: any) => ({ id: p.id, name: p.name, refKodu: p.refKodu, value: p.profit }))}
                colorClass="bg-blue-500"
              />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bugünkü yoklama özeti */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Bugünkü Yoklama Özeti</h3>
          </CardHeader>
          <CardBody>
            {Object.keys(todayAttendanceCounts).length === 0 ? (
              <EmptyState title="Bugün henüz yoklama kaydı girilmedi" actionLabel="Yoklama Ekle" onAction={() => (window.location.href = '/admin/yoklama')} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(todayAttendanceCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                    <Badge className={ATTENDANCE_TYPE_COLORS[type as keyof typeof ATTENDANCE_TYPE_COLORS] || 'bg-gray-100 text-gray-800'}>
                      {ATTENDANCE_TYPE_LABELS[type as keyof typeof ATTENDANCE_TYPE_LABELS] || type}
                    </Badge>
                    <span className="font-semibold text-slate-800">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Geciken Ödemeler */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Geciken Ödemeler</h3>
          </CardHeader>
          <CardBody className="p-0">
            {overdueList.length === 0 ? (
              <EmptyState title="Geciken ödeme yok" className="py-8" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {overdueList.map((p: any) => (
                  <li key={p.id}>
                    <Link href={`/admin/is-emirleri/${p.jobId}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{p.job.firmaAdi || `${p.job.musteriAdi} ${p.job.musteriSoyadi || ''}`.trim()}</p>
                        <p className="text-xs text-danger-600">Vade: {formatDate(p.vadeTarihi)}</p>
                      </div>
                      <span className="font-semibold text-danger-600 text-sm shrink-0">{formatCurrency(p.tutar)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Açık personel bakiyeleri */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Açık Personel Bakiyeleri</h3>
              <Link href="/admin/personel-odemeleri" className="text-xs text-blue-600 hover:underline">
                Tümü
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {workerOpenBalances.length === 0 ? (
              <EmptyState title="Açık personel bakiyesi yok" className="py-8" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {workerOpenBalances.map((w: any) => (
                  <li key={w.id}>
                    <Link href={`/admin/tanimlamalar/ustalar/${w.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                      <span className="text-sm font-medium text-slate-800">{w.name}</span>
                      <MoneyDisplay amount={w.balance} size="sm" className="font-semibold text-rose-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Açık tedarikçi bakiyeleri */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Açık Tedarikçi Bakiyeleri</h3>
              <Link href="/admin/tedarikci-odemeleri" className="text-xs text-blue-600 hover:underline">
                Tümü
              </Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {supplierOpenBalances.length === 0 ? (
              <EmptyState title="Açık tedarikçi bakiyesi yok" className="py-8" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {supplierOpenBalances.map((s: any) => (
                  <li key={s.id}>
                    <Link href={`/admin/tanimlamalar/toptancilar/${s.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50">
                      <span className="text-sm font-medium text-slate-800">{s.name}</span>
                      <MoneyDisplay amount={s.balance} size="sm" className="font-semibold text-rose-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yaklaşan Ödemeler */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Yaklaşan Tahsilatlar (7 Gün)</h3>
          </CardHeader>
          <CardBody>
            {upcomingPayments.length === 0 ? (
              <EmptyState title="Yaklaşan ödeme yok" className="py-8" />
            ) : (
              <div className="space-y-1">
                {upcomingPayments.map((payment: any) => (
                  <Link key={payment.id} href={`/admin/is-emirleri/${payment.jobId}`}>
                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{payment.job.firmaAdi || `${payment.job.musteriAdi} ${payment.job.musteriSoyadi || ''}`.trim()}</p>
                        <p className="text-xs text-slate-500 truncate">{payment.aciklama}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="font-semibold text-slate-900 text-sm">{formatCurrency(payment.tutar)}</p>
                        <p className="text-xs text-slate-500">{formatDate(payment.vadeTarihi)}</p>
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
            <h3 className="text-base font-semibold text-slate-900">Son İş Emirleri</h3>
          </CardHeader>
          <CardBody>
            {recentJobs.length === 0 ? (
              <EmptyState title="Henüz iş emri yok" className="py-8" />
            ) : (
              <div className="space-y-1">
                {recentJobs.map((job: any) => (
                  <Link key={job.id} href={`/admin/is-emirleri/${job.id}`}>
                    <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim()}</p>
                        <p className="text-xs text-slate-500">{job.referansKodu}</p>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <Badge className={JOB_STATUS_COLORS[job.durum as keyof typeof JOB_STATUS_COLORS]}>{JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS]}</Badge>
                        <p className="text-xs text-slate-500 mt-1">{formatDate(job.olusturmaTarihi)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* En yüksek maliyetli projeler */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">En Yüksek Maliyetli Projeler</h3>
          </CardHeader>
          <CardBody>
            {topCostly.length === 0 ? (
              <EmptyState title="Veri yok" className="py-8" />
            ) : (
              <ProfitBarList items={topCostly.map((p: any) => ({ id: p.id, name: p.name, refKodu: p.refKodu, value: p.cost }))} colorClass="bg-orange-500" />
            )}
          </CardBody>
        </Card>

        {/* Son Aktiviteler */}
        <Card>
          <CardHeader>
            <h3 className="text-base font-semibold text-slate-900">Son Aktiviteler</h3>
          </CardHeader>
          <CardBody className="p-0">
            {recentActivities.length === 0 ? (
              <EmptyState title="Henüz aktivite yok" className="py-8" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentActivities.map((a: any) => (
                  <li key={a.id} className="px-4 py-2.5">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">{a.user.adSoyad}</span> {ACTION_LABELS[a.action] || a.action.toLowerCase()}
                      {a.details && <span className="text-slate-500"> — {a.details}</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
