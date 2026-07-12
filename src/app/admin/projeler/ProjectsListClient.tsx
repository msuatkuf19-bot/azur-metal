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
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PROFITABILITY_COLORS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import ProjectCard from './components/ProjectCard';
import ProjectCardSkeleton from './components/ProjectCardSkeleton';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';

interface ProjectsListClientProps {
  projects: any[];
  searchParams: any;
}

export default function ProjectsListClient({ projects, searchParams }: ProjectsListClientProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(searchParams.search || '');
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleSearch = () => {
    setIsLoading(true);
    const newParams = new URLSearchParams(params);
    if (search) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    router.push(`/admin/projeler?${newParams.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleFilterChange = (key: string, value: string) => {
    setIsLoading(true);
    const newParams = new URLSearchParams(params);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    router.push(`/admin/projeler?${newParams.toString()}`);
    setTimeout(() => setIsLoading(false), 500);
  };

  const clearFilters = () => {
    router.push('/admin/projeler');
  };

  const hasFilters = searchParams.search || searchParams.durum || searchParams.karlilik;

  const handleExportPdf = () => {
    const totalCollection = projects.reduce((s, p) => s + (p.metrics?.totalCollection || 0), 0);
    const totalCost = projects.reduce((s, p) => s + (p.metrics?.totalCost || 0), 0);
    const totalProfit = projects.reduce((s, p) => s + (p.metrics?.profit || 0), 0);

    const sections: PdfSection[] = [
      {
        title: 'Genel Özet',
        type: 'summary-cards',
        data: [
          { label: 'Toplam Proje', value: projects.length.toString(), color: 'blue' },
          { label: 'Toplam Tahsilat', value: formatCurrency(totalCollection), color: 'positive' },
          { label: 'Toplam Maliyet', value: formatCurrency(totalCost), color: 'orange' },
          { label: 'Toplam Kâr', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? 'positive' : 'negative' },
        ],
      },
      { type: 'divider' },
      {
        title: `Proje Listesi (${projects.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Ref. Kodu', key: 'ref', bold: true },
            { header: 'Proje', key: 'proje' },
            { header: 'Durum', key: 'durum' },
            { header: 'Tahsilat', key: 'tahsilat', align: 'right' as const },
            { header: 'Maliyet', key: 'maliyet', align: 'right' as const },
            { header: 'Kâr', key: 'kar', align: 'right' as const },
            { header: 'Tarih', key: 'tarih' },
          ],
          rows: projects.map((p) => ({
            ref: p.referansKodu,
            proje: p.projeAdi,
            durum: JOB_STATUS_LABELS[p.durum as keyof typeof JOB_STATUS_LABELS] || p.durum,
            tahsilat: formatCurrency(p.metrics?.totalCollection || 0),
            maliyet: formatCurrency(p.metrics?.totalCost || 0),
            kar: formatCurrency(p.metrics?.profit || 0),
            tarih: formatDate(p.guncellemeTarihi || p.olusturmaTarihi),
          })),
          footer: {
            ref: 'TOPLAM', proje: `${projects.length} proje`, durum: '',
            tahsilat: formatCurrency(totalCollection),
            maliyet: formatCurrency(totalCost),
            kar: formatCurrency(totalProfit),
            tarih: '',
          },
        },
      },
    ];

    exportToPdf({
      title: 'Projeler Raporu',
      subtitle: 'Tüm Projeler',
      sections,
      orientation: 'landscape',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projeler</h1>
          <p className="text-gray-600 mt-1">{projects.length} proje bulundu</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleExportPdf}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Rapor Al
          </Button>
          <Link href="/admin/projeler/yeni">
            <Button className="shadow-lg hover:shadow-xl transition-shadow">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Proje Oluştur
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex space-x-2">
                <Input
                  placeholder="Proje adı, müşteri, telefon ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Ara'
                  )}
                </Button>
              </div>
            </div>

            {/* Durum Filter */}
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

            {/* Kârlılık Filter */}
            <Select
              options={[
                { value: '', label: 'Tüm Kârlılık' },
                { value: 'positive', label: '🟢 Kârlı' },
                { value: 'negative', label: '🔴 Zararlı' },
              ]}
              value={searchParams.karlilik || ''}
              onChange={(e) => handleFilterChange('karlilik', e.target.value)}
            />

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" onClick={clearFilters} className="self-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Temizle
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardBody className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz proje yok</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              İlk projenizi oluşturarak müşteri işlerinizi takip etmeye başlayın
            </p>
            <Link href="/admin/projeler/yeni">
              <Button size="lg" className="shadow-lg">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Proje Oluştur
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onMenuOpen={(id) => setMenuOpen(menuOpen === id ? null : id)}
              isMenuOpen={menuOpen === project.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
