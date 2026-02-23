'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_PARTY_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/constants';

interface ExpensesTabProps {
  project: any;
  financials: any;
}

export default function ExpensesTab({ project, financials }: ExpensesTabProps) {
  const giderler = project.payments?.filter((p: any) => p.tip === 'Gider') || [];
  
  // Kategori bazlı gruplama
  const categoryTotals = giderler.reduce((acc: any, payment: any) => {
    const category = payment.taraf || 'Diger';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += payment.tutar;
    acc[category].count += 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardBody className="text-center">
            <p className="text-sm text-orange-600">İşçilik Maliyeti</p>
            <p className="text-2xl font-bold text-orange-800">{formatCurrency(financials.laborCostTotal)}</p>
          </CardBody>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardBody className="text-center">
            <p className="text-sm text-purple-600">Malzeme Maliyeti</p>
            <p className="text-2xl font-bold text-purple-800">{formatCurrency(financials.materialCostTotal)}</p>
          </CardBody>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardBody className="text-center">
            <p className="text-sm text-red-600">Diğer Giderler</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(financials.totalPaymentExpense)}</p>
          </CardBody>
        </Card>
        <Card className="bg-gray-100 border-gray-300">
          <CardBody className="text-center">
            <p className="text-sm text-gray-600">Toplam Maliyet</p>
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(financials.totalProjectCost)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Kategori Bazlı Giderler</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(categoryTotals).map(([category, data]: [string, any]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    {PAYMENT_PARTY_LABELS[category as keyof typeof PAYMENT_PARTY_LABELS] || category}
                  </p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.total)}</p>
                  <p className="text-xs text-gray-400">{data.count} işlem</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Expense List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Gider Kayıtları</h3>
            <span className="text-sm text-gray-500">{giderler.length} kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {giderler.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">Henüz gider kaydı yok</p>
              <p className="text-sm text-gray-400 mt-1">Sağ panelden &quot;Gider Ekle&quot; ile yeni kayıt oluşturabilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taraf</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ödeme Yöntemi</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {giderler.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(payment.tarih)}</td>
                      <td className="px-6 py-4">
                        <Badge variant="default">
                          {PAYMENT_PARTY_LABELS[payment.taraf as keyof typeof PAYMENT_PARTY_LABELS] || payment.taraf}
                        </Badge>
                        {payment.master && (
                          <span className="ml-2 text-sm text-gray-500">{payment.master.adSoyad}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {PAYMENT_METHOD_LABELS[payment.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || payment.odemeYontemi}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{payment.aciklama || '-'}</td>
                      <td className="px-6 py-4 text-right font-semibold text-red-600">{formatCurrency(payment.tutar)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={4} className="px-6 py-3 text-sm font-medium text-gray-700">Toplam</td>
                    <td className="px-6 py-3 text-right font-bold text-red-600">{formatCurrency(financials.totalPaymentExpense)}</td>
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
