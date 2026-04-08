'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils';

interface SupplierDetailClientProps {
  data: {
    supplier: any;
    purchases: any[];
    filters: {
      projects: { id: string; name: string; refKodu: string }[];
      customers: string[];
    };
    summary: {
      overallTotal: number;
      thisMonthTotal: number;
      totalPurchases: number;
    };
  };
}

export default function SupplierDetailClient({ data }: SupplierDetailClientProps) {
  const { supplier, purchases: allPurchases, filters, summary } = data;

  // Filter state
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtrelenmiş alımlar
  const filteredPurchases = useMemo(() => {
    return allPurchases.filter(p => {
      if (selectedProject && p.jobId !== selectedProject) return false;
      if (selectedCustomer) {
        const customerName = p.job.firmaAdi || p.job.musteriAdi;
        if (customerName !== selectedCustomer) return false;
      }
      if (startDate && new Date(p.purchaseDate) < new Date(startDate)) return false;
      if (endDate && new Date(p.purchaseDate) > new Date(endDate + 'T23:59:59')) return false;
      return true;
    });
  }, [allPurchases, selectedProject, selectedCustomer, startDate, endDate]);

  // Filtrelenmiş toplam
  const filteredTotal = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  }, [filteredPurchases]);

  // Proje bazlı toplamlar (filtrelenmiş)
  const projectTotals = useMemo(() => {
    const map = new Map<string, { name: string; refKodu: string; total: number }>();
    filteredPurchases.forEach(p => {
      const name = p.job.firmaAdi || `${p.job.musteriAdi} ${p.job.musteriSoyadi || ''}`.trim();
      if (!map.has(p.jobId)) {
        map.set(p.jobId, { name, refKodu: p.job.referansKodu, total: 0 });
      }
      map.get(p.jobId)!.total += p.totalAmount;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  // Müşteri bazlı toplamlar (filtrelenmiş)
  const customerTotals = useMemo(() => {
    const map = new Map<string, number>();
    filteredPurchases.forEach(p => {
      const name = p.job.firmaAdi || p.job.musteriAdi;
      map.set(name, (map.get(name) || 0) + p.totalAmount);
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredPurchases]);

  const hasActiveFilter = selectedProject || selectedCustomer || startDate || endDate;

  const clearFilters = () => {
    setSelectedProject('');
    setSelectedCustomer('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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
            <span className="text-indigo-600 font-bold text-xl">
              {supplier.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={supplier.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                {supplier.isActive ? 'Aktif' : 'Pasif'}
              </Badge>
              {supplier.contactName && (
                <span className="text-sm text-gray-500">{supplier.contactName}</span>
              )}
              {supplier.phone && (
                <span className="text-sm text-gray-500">• {formatPhone(supplier.phone)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Harcama</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(summary.overallTotal)}</p>
                <p className="text-xs text-gray-400">{summary.totalPurchases} alım</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bu Ay</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary.thisMonthTotal)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className={`border-l-4 ${hasActiveFilter ? 'border-l-orange-500' : 'border-l-gray-300'}`}>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{hasActiveFilter ? 'Filtre Toplamı' : 'Genel Toplam'}</p>
                <p className={`text-2xl font-bold mt-1 ${hasActiveFilter ? 'text-orange-600' : 'text-gray-600'}`}>
                  {formatCurrency(filteredTotal)}
                </p>
                <p className="text-xs text-gray-400">{filteredPurchases.length} kayıt</p>
              </div>
              <div className={`p-3 rounded-lg ${hasActiveFilter ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <svg className={`w-6 h-6 ${hasActiveFilter ? 'text-orange-600' : 'text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Filtreler</h3>
            {hasActiveFilter && (
              <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 font-medium">
                Filtreleri Temizle
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proje</label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              >
                <option value="">Tüm Projeler</option>
                {filters.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.refKodu})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              >
                <option value="">Tüm Müşteriler</option>
                {filters.customers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Breakdown tables side by side */}
      {(projectTotals.length > 0 || customerTotals.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proje Bazlı Toplam */}
          {projectTotals.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Proje Bazlı Harcama</h3>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {projectTotals.map((pt) => (
                      <tr key={pt.refKodu} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{pt.name}</p>
                          <p className="text-xs text-gray-500">{pt.refKodu}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                          {formatCurrency(pt.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td className="px-4 py-2 font-bold text-sm">TOPLAM</td>
                      <td className="px-4 py-2 text-right font-bold text-indigo-600">
                        {formatCurrency(filteredTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardBody>
            </Card>
          )}

          {/* Müşteri Bazlı Toplam */}
          {customerTotals.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Müşteri Bazlı Harcama</h3>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerTotals.map((ct) => (
                      <tr key={ct.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{ct.name}</td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                          {formatCurrency(ct.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2">
                    <tr>
                      <td className="px-4 py-2 font-bold text-sm">TOPLAM</td>
                      <td className="px-4 py-2 text-right font-bold text-indigo-600">
                        {formatCurrency(filteredTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Tüm Alım Kayıtları */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alım Kayıtları</h3>
            <span className="text-sm text-gray-500">{filteredPurchases.length} kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500">
                {hasActiveFilter ? 'Filtrelere uygun kayıt bulunamadı' : 'Henüz alım kaydı yok'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje / Müşteri</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Malzeme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miktar</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Birim Fiyat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(purchase.purchaseDate)}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/projeler/${purchase.jobId}`}
                          className="font-medium text-primary-600 hover:text-primary-800"
                        >
                          {purchase.job.firmaAdi || purchase.job.musteriAdi}
                        </Link>
                        <p className="text-xs text-gray-500">{purchase.job.referansKodu}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {purchase.material?.name || purchase.materialName || '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {purchase.quantity} {purchase.unit}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatCurrency(purchase.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={5} className="px-6 py-3 text-sm font-bold text-gray-700">TOPLAM</td>
                    <td className="px-6 py-3 text-right font-bold text-indigo-600">{formatCurrency(filteredTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Supplier Info */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Toptancı Bilgileri</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Firma Adı</p>
              <p className="font-medium">{supplier.name}</p>
            </div>
            {supplier.contactName && (
              <div>
                <p className="text-sm text-gray-500">Yetkili Kişi</p>
                <p className="font-medium">{supplier.contactName}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{formatPhone(supplier.phone)}</p>
              </div>
            )}
            {supplier.email && (
              <div>
                <p className="text-sm text-gray-500">E-posta</p>
                <p className="font-medium">{supplier.email}</p>
              </div>
            )}
            {supplier.taxNo && (
              <div>
                <p className="text-sm text-gray-500">Vergi No</p>
                <p className="font-medium">{supplier.taxNo}</p>
              </div>
            )}
            {supplier.address && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Adres</p>
                <p className="font-medium">{supplier.address}</p>
              </div>
            )}
            {supplier.notes && (
              <div className="md:col-span-3">
                <p className="text-sm text-gray-500">Notlar</p>
                <p className="text-gray-700">{supplier.notes}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
