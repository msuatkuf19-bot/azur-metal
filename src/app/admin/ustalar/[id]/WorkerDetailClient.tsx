'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input, TextArea } from '@/components/ui/Input';
import {
  WORKER_ROLE_LABELS,
  WORKER_ROLE_COLORS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate, formatDateTime, formatPhone } from '@/lib/utils';
import { updateWorker } from '@/app/actions/workers';
import toast from 'react-hot-toast';

interface WorkerDetailClientProps {
  data: {
    worker: any;
    projectSummaries: any[];
    summary: {
      totalProjects: number;
      totalHours: number;
      totalEarned: number;
      totalPaid: number;
      totalRemaining: number;
      totalEntries: number;
    };
  };
}

export default function WorkerDetailClient({ data }: WorkerDetailClientProps) {
  const router = useRouter();
  const { worker, projectSummaries, summary } = data;
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: worker.fullName,
    phone: worker.phone || '',
    roleType: worker.roleType,
    hourlyRateDefault: worker.hourlyRateDefault,
    notes: worker.notes || '',
    isActive: worker.isActive,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateWorker(worker.id, {
        ...formData,
        roleType: formData.roleType as 'USTA' | 'ISCI',
      });
      if (result.success) {
        toast.success('Usta bilgileri güncellendi');
        router.refresh();
        setIsEditDrawerOpen(false);
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <Link href="/admin/ustalar">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri
              </Button>
            </Link>
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold text-xl">
                {worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{worker.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={WORKER_ROLE_COLORS[worker.roleType as keyof typeof WORKER_ROLE_COLORS]}>
                  {WORKER_ROLE_LABELS[worker.roleType as keyof typeof WORKER_ROLE_LABELS]}
                </Badge>
                <Badge className={worker.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                  {worker.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
                {worker.phone && (
                  <span className="text-sm text-gray-500">{formatPhone(worker.phone)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <Button variant="secondary" onClick={() => setIsEditDrawerOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Düzenle
        </Button>
      </div>

      {/* 5-Card Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Proje</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalProjects}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Saat</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{summary.totalHours.toFixed(1)}</p>
                <p className="text-xs text-gray-400">{summary.totalEntries} kayıt</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Hakediş</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary.totalEarned)}</p>
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
                <p className="text-sm text-gray-500">Ödenen</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={`border-l-4 ${summary.totalRemaining > 0 ? 'border-l-red-500' : 'border-l-gray-300'}`}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kalan Alacak</p>
                <p className={`text-2xl font-bold mt-1 ${summary.totalRemaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatCurrency(summary.totalRemaining)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${summary.totalRemaining > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <svg className={`w-6 h-6 ${summary.totalRemaining > 0 ? 'text-red-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Worker Info + Hourly Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Usta Bilgileri</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Varsayılan Saat Ücreti</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(worker.hourlyRateDefault)}/saat</p>
            </div>
            {worker.phone && (
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{formatPhone(worker.phone)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Kayıt Tarihi</p>
              <p className="font-medium">{formatDate(worker.createdAt)}</p>
            </div>
            {worker.notes && (
              <div>
                <p className="text-sm text-gray-500">Notlar</p>
                <p className="text-gray-700">{worker.notes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Payment Progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold">Ödeme Durumu</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Ödeme İlerlemesi</span>
                <span className="text-sm font-medium">
                  {summary.totalEarned > 0 
                    ? `%${((summary.totalPaid / summary.totalEarned) * 100).toFixed(0)}`
                    : '%0'
                  }
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ 
                    width: summary.totalEarned > 0 
                      ? `${Math.min((summary.totalPaid / summary.totalEarned) * 100, 100)}%`
                      : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <span className="text-gray-500">Ödenen: </span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(summary.totalPaid)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Kalan: </span>
                  <span className={`font-semibold ${summary.totalRemaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {formatCurrency(summary.totalRemaining)}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Project-based Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Proje Bazlı Çalışmalar</h3>
            <span className="text-sm text-gray-500">{projectSummaries.length} proje</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {projectSummaries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">Henüz proje kaydı yok</p>
              <p className="text-sm text-gray-400 mt-1">Bu usta henüz hiçbir projede çalışmadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kayıt</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hakediş</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ödenen</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kalan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Son İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectSummaries.map((project) => (
                    <tr 
                      key={project.projectId} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/projeler/${project.projectId}`)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 hover:text-primary-600">{project.projectName}</p>
                          <p className="text-sm text-gray-500">{project.referansKodu}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={JOB_STATUS_COLORS[project.durum as keyof typeof JOB_STATUS_COLORS]}>
                          {JOB_STATUS_LABELS[project.durum as keyof typeof JOB_STATUS_LABELS]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{project.entryCount}</td>
                      <td className="px-6 py-4 text-right font-medium">{project.totalHours.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(project.totalEarned)}</td>
                      <td className="px-6 py-4 text-right text-orange-600">{formatCurrency(project.totalPaid)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${project.remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(project.remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {project.lastEntry ? formatDate(project.lastEntry.date) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-700">TOPLAM</td>
                    <td className="px-6 py-3 text-right font-bold">{summary.totalHours.toFixed(1)}</td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(summary.totalEarned)}</td>
                    <td className="px-6 py-3 text-right font-bold text-orange-600">{formatCurrency(summary.totalPaid)}</td>
                    <td className="px-6 py-3 text-right font-bold text-red-600">{formatCurrency(summary.totalRemaining)}</td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Recent Work Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Son İşçilik Kayıtları</h3>
            <span className="text-sm text-gray-500">Son 20 kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {worker.workEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Henüz işçilik kaydı yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat Ücreti</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {worker.workEntries.slice(0, 20).map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(entry.date)}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/projeler/${entry.jobId}`}
                          className="font-medium text-primary-600 hover:text-primary-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {entry.job.firmaAdi || entry.job.musteriAdi}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right">{entry.hours} saat</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(entry.hourlyRate)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(entry.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{entry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        title="Usta Düzenle"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Soyad"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0532 123 45 67"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="USTA">Usta</option>
              <option value="ISCI">İşçi</option>
            </select>
          </div>

          <Input
            label="Varsayılan Saat Ücreti (₺)"
            type="number"
            min="0"
            step="0.01"
            value={formData.hourlyRateDefault}
            onChange={(e) => setFormData({ ...formData, hourlyRateDefault: parseFloat(e.target.value) || 0 })}
          />

          <TextArea
            label="Notlar"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Uzmanlık alanları, iletişim notları vb."
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Aktif
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : 'Güncelle'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsEditDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
