'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  JOB_PRIORITY_LABELS,
  JOB_PRIORITY_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function JobsListClient({ jobs, searchParams }: any) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(searchParams.search || '');
  const [view, setView] = useState(searchParams.view || 'card');

  const handleSearch = () => {
    const newParams = new URLSearchParams(params);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    router.push(`/admin/is-emirleri?${newParams.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(params);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.push(`/admin/is-emirleri?${newParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İş Emirleri</h1>
          <p className="text-gray-600 mt-1">{jobs.length} iş emri bulundu</p>
        </div>
        <Link href="/admin/is-emirleri/yeni">
          <Button>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni İş Emri
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="İşletme adı, yetkili, telefon ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>Ara</Button>
              </div>
            </div>
            <Select
              options={[
                { value: '', label: 'Tüm Durumlar' },
                ...Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              value={searchParams.durum || ''}
              onChange={(e) => handleFilterChange('durum', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'Tüm Öncelikler' },
                ...Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                })),
              ]}
              value={searchParams.oncelik || ''}
              onChange={(e) => handleFilterChange('oncelik', e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setView('card')}
                className={`p-2 rounded ${view === 'card' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded ${view === 'table' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>

            {(searchParams.search || searchParams.durum || searchParams.oncelik) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/is-emirleri')}
              >
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Content */}
      {jobs.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz iş emri yok</h3>
            <p className="text-gray-600 mb-4">İlk iş emrinizi oluşturarak başlayın</p>
            <Link href="/admin/is-emirleri/yeni">
              <Button>Yeni İş Emri Oluştur</Button>
            </Link>
          </CardBody>
        </Card>
      ) : view === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <Link key={job.id} href={`/admin/is-emirleri/${job.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {job.isletmeAdi}
                      </h3>
                      <p className="text-sm text-gray-500">{job.referansKodu}</p>
                    </div>
                    <Badge className={JOB_PRIORITY_COLORS[job.oncelik as keyof typeof JOB_PRIORITY_COLORS]}>
                      {JOB_PRIORITY_LABELS[job.oncelik as keyof typeof JOB_PRIORITY_LABELS]}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    {job.yetkiliAdSoyad && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {job.yetkiliAdSoyad}
                      </div>
                    )}
                    {job.telefon && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {job.telefon}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <Badge className={JOB_STATUS_COLORS[job.durum as keyof typeof JOB_STATUS_COLORS]}>
                      {JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS]}
                    </Badge>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-gray-500">Teklif Toplamı</p>
                        <p className="font-semibold">{formatCurrency(job.financials.acceptedOfferTotal)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Kalan Alacak</p>
                        <p className="font-semibold text-orange-600">{formatCurrency(job.financials.remaining)}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      Güncelleme: {formatDate(job.guncellemeTarihi)}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İşletme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yetkili</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Öncelik</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teklif</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kalan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/is-emirleri/${job.id}`)}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{job.isletmeAdi}</p>
                        <p className="text-sm text-gray-500">{job.referansKodu}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{job.yetkiliAdSoyad || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge className={JOB_STATUS_COLORS[job.durum as keyof typeof JOB_STATUS_COLORS]}>
                        {JOB_STATUS_LABELS[job.durum as keyof typeof JOB_STATUS_LABELS]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={JOB_PRIORITY_COLORS[job.oncelik as keyof typeof JOB_PRIORITY_COLORS]}>
                        {JOB_PRIORITY_LABELS[job.oncelik as keyof typeof JOB_PRIORITY_LABELS]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{formatCurrency(job.financials.acceptedOfferTotal)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-orange-600">{formatCurrency(job.financials.remaining)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(job.guncellemeTarihi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
