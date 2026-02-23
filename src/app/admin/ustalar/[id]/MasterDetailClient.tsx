'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Input, TextArea } from '@/components/ui/Input';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/lib/constants';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MasterDetailClientProps {
  data: {
    master: any;
    projectSummaries: any[];
    recentWorkLogs: any[];
    recentPayments: any[];
    summary: {
      totalProjects: number;
      totalHours: number;
      totalEarned: number;
      totalPaid: number;
      totalRemaining: number;
      totalWorkLogs: number;
    };
  };
}

export default function MasterDetailClient({ data }: MasterDetailClientProps) {
  const router = useRouter();
  const { master, projectSummaries, recentWorkLogs, recentPayments, summary } = data;
  
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Ödeme yapılabilecek projeler (kalan borcu olanlar)
  const projectsWithDebt = projectSummaries.filter(p => p.remaining > 0);

  const openPaymentDrawer = (project?: any) => {
    if (project) {
      setSelectedProject(project);
      setPaymentAmount(project.remaining.toString());
    } else {
      setSelectedProject(null);
      setPaymentAmount('');
    }
    setPaymentNote('');
    setIsPaymentDrawerOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Lütfen bir proje seçin');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }

    if (amount > selectedProject.remaining) {
      toast.error('Ödeme tutarı kalan borçtan fazla olamaz');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/master-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterId: master.id,
          masterName: master.adSoyad,
          jobId: selectedProject.projectId,
          tutar: amount,
          aciklama: paymentNote || `${master.adSoyad} - ${selectedProject.projectName} ödeme`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Ödeme başarıyla kaydedildi');
        setIsPaymentDrawerOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPayment = (project: any, payFull: boolean) => {
    setSelectedProject(project);
    setPaymentAmount(payFull ? project.remaining.toString() : '');
    setPaymentNote('');
    setIsPaymentDrawerOpen(true);
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
                {master.adSoyad.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{master.adSoyad}</h1>
              <div className="flex items-center gap-2 mt-1">
                {master.uzmanlik && (
                  <Badge className="bg-blue-100 text-blue-800">{master.uzmanlik}</Badge>
                )}
                <Badge className={master.aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                  {master.aktif ? 'Aktif' : 'Pasif'}
                </Badge>
                <span className="text-sm text-gray-500">{formatPhone(master.telefon)}</span>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => openPaymentDrawer()} 
          disabled={projectsWithDebt.length === 0}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Ödeme Yap
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
                <p className="text-xs text-gray-400">{summary.totalWorkLogs} kayıt</p>
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
                <p className="text-sm text-gray-500">Kalan Borç</p>
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

      {/* Master Info + Payment Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Usta Bilgileri</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Saat Ücreti</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(master.saatlikUcret)}/saat</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{formatPhone(master.telefon)}</p>
            </div>
            {master.uzmanlik && (
              <div>
                <p className="text-sm text-gray-500">Uzmanlık</p>
                <p className="font-medium">{master.uzmanlik}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Kayıt Tarihi</p>
              <p className="font-medium">{formatDate(master.createdAt)}</p>
            </div>
            {master.notlar && (
              <div>
                <p className="text-sm text-gray-500">Notlar</p>
                <p className="text-gray-700">{master.notlar}</p>
              </div>
            )}
          </CardBody>
        </Card>

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

      {/* Project-based Breakdown with Quick Payment */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Proje Bazlı Hakedişler</h3>
            <span className="text-sm text-gray-500">{projectSummaries.length} proje</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {projectSummaries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-gray-500">Henüz iş kaydı yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hakediş</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ödenen</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kalan</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectSummaries.map((project) => (
                    <tr key={project.projectId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/projeler/${project.projectId}`}
                          className="font-medium text-primary-600 hover:text-primary-800"
                        >
                          {project.projectName}
                        </Link>
                        <p className="text-sm text-gray-500">{project.referansKodu}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={JOB_STATUS_COLORS[project.durum as keyof typeof JOB_STATUS_COLORS]}>
                          {JOB_STATUS_LABELS[project.durum as keyof typeof JOB_STATUS_LABELS]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{project.totalHours.toFixed(1)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(project.totalEarned)}</td>
                      <td className="px-6 py-4 text-right text-orange-600">{formatCurrency(project.totalPaid)}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${project.remaining > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {formatCurrency(project.remaining)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {project.remaining > 0 ? (
                          <div className="flex items-center justify-center space-x-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleQuickPayment(project, false)}
                              title="Kısmi Ödeme"
                            >
                              Kısmi
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleQuickPayment(project, true)}
                              title="Tamamını Öde"
                            >
                              Tamamı
                            </Button>
                          </div>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800">Ödendi</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-700">TOPLAM</td>
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

      {/* Recent Payments */}
      {recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Son Ödemeler</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proje</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentPayments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">{formatDate(payment.tarih)}</td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/admin/projeler/${payment.jobId}`}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          {payment.job?.firmaAdi || payment.job?.musteriAdi}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                        {formatCurrency(payment.tutar)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{payment.aciklama || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment Drawer */}
      <Drawer
        isOpen={isPaymentDrawerOpen}
        onClose={() => setIsPaymentDrawerOpen(false)}
        title="Usta Ödemesi Yap"
        size="lg"
      >
        <form onSubmit={handlePayment} className="space-y-6">
          {/* Master Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold">
                  {master.adSoyad.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{master.adSoyad}</p>
                <p className="text-sm text-gray-500">
                  Toplam Alacak: <span className="font-semibold text-red-600">{formatCurrency(summary.totalRemaining)}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proje Seçin <span className="text-red-500">*</span>
            </label>
            {projectsWithDebt.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 mx-auto text-emerald-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 font-medium">Tüm ödemeler tamamlandı!</p>
                <p className="text-sm text-gray-500">Bu ustaya borç kalmamış.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {projectsWithDebt.map((project) => (
                  <div
                    key={project.projectId}
                    onClick={() => {
                      setSelectedProject(project);
                      setPaymentAmount(project.remaining.toString());
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProject?.projectId === project.projectId
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{project.projectName}</p>
                        <p className="text-sm text-gray-500">{project.referansKodu}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Kalan</p>
                        <p className="font-bold text-red-600">{formatCurrency(project.remaining)}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Hakediş: {formatCurrency(project.totalEarned)}</span>
                      <span>Ödenen: {formatCurrency(project.totalPaid)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Amount */}
          {selectedProject && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Tutarı <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedProject.remaining}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="pr-16"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    Kalan: {formatCurrency(selectedProject.remaining)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedProject.remaining.toString())}
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Tamamını Öde
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const amount = selectedProject.remaining * ratio;
                  return (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setPaymentAmount(amount.toFixed(2))}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        parseFloat(paymentAmount) === amount
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      %{ratio * 100} ({formatCurrency(amount)})
                    </button>
                  );
                })}
              </div>

              <TextArea
                label="Açıklama (Opsiyonel)"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Ödeme hakkında not..."
                rows={2}
              />

              {/* Summary */}
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-emerald-700">Ödenecek Tutar</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(parseFloat(paymentAmount) || 0)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Ödeme Sonrası Kalan</p>
                    <p className="text-lg font-semibold text-gray-700">
                      {formatCurrency(selectedProject.remaining - (parseFloat(paymentAmount) || 0))}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex space-x-3 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !selectedProject || !paymentAmount}
              className="flex-1"
            >
              {isLoading ? 'Kaydediliyor...' : 'Ödemeyi Kaydet'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsPaymentDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
