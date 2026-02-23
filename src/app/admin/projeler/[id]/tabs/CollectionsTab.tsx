'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_METHOD_LABELS, PAYMENT_PLAN_STATUS_LABELS } from '@/lib/constants';

interface CollectionsTabProps {
  project: any;
  financials: any;
  metrics: any;
}

export default function CollectionsTab({ project, financials, metrics }: CollectionsTabProps) {
  const tahsilatlar = project.payments?.filter((p: any) => p.tip === 'Tahsilat') || [];
  const paymentPlans = project.paymentPlans || [];

  const getPlanStatusColor = (durum: string) => {
    switch (durum) {
      case 'Odendi':
        return 'bg-emerald-100 text-emerald-800';
      case 'Gecikti':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="text-center">
            <p className="text-sm text-blue-600">Sözleşme Toplamı</p>
            <p className="text-2xl font-bold text-blue-800">
              {formatCurrency(financials.contractTotal || financials.totalOfferAmount)}
            </p>
          </CardBody>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardBody className="text-center">
            <p className="text-sm text-emerald-600">Tahsil Edilen</p>
            <p className="text-2xl font-bold text-emerald-800">{formatCurrency(financials.totalCollection)}</p>
          </CardBody>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardBody className="text-center">
            <p className="text-sm text-amber-600">Kalan Alacak</p>
            <p className="text-2xl font-bold text-amber-800">{formatCurrency(financials.remainingReceivable)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gray-100 border-gray-300">
          <CardBody className="text-center">
            <p className="text-sm text-gray-600">Tahsilat Oranı</p>
            <p className="text-2xl font-bold text-gray-800">
              %{((financials.totalCollection / (financials.contractTotal || financials.totalOfferAmount || 1)) * 100).toFixed(0)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Warning Alerts */}
      {metrics.overduePayments.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <CardBody>
            <div className="flex items-start">
              <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="font-semibold text-red-800">Geciken Ödemeler</h4>
                <p className="text-sm text-red-700 mt-1">
                  {metrics.overduePayments.length} adet ödeme vadesi geçmiş. 
                  Toplam: <strong>{formatCurrency(metrics.overduePayments.reduce((sum: number, p: any) => sum + p.tutar, 0))}</strong>
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Payment Plan */}
      {paymentPlans.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ödeme Planı</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vade Tarihi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentPlans.map((plan: any) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(plan.vadeTarihi)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{plan.aciklama || '-'}</td>
                      <td className="px-6 py-4">
                        <Badge className={getPlanStatusColor(plan.durum)}>
                          {PAYMENT_PLAN_STATUS_LABELS[plan.durum as keyof typeof PAYMENT_PLAN_STATUS_LABELS] || plan.durum}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">{formatCurrency(plan.tutar)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Collection Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tahsilat Kayıtları</h3>
            <span className="text-sm text-gray-500">{tahsilatlar.length} kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {tahsilatlar.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">Henüz tahsilat kaydı yok</p>
              <p className="text-sm text-gray-400 mt-1">Sağ panelden &quot;Tahsilat Ekle&quot; ile yeni kayıt oluşturabilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ödeme Yöntemi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tahsilatlar.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(payment.tarih)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {PAYMENT_METHOD_LABELS[payment.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || payment.odemeYontemi}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{payment.aciklama || '-'}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(payment.tutar)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-700">Toplam Tahsilat</td>
                    <td className="px-6 py-3 text-right font-bold text-emerald-600">{formatCurrency(financials.totalCollection)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
