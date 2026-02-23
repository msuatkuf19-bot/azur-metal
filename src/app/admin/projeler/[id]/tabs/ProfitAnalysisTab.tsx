'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { formatCurrency, calculatePercentage } from '@/lib/utils';

interface ProfitAnalysisTabProps {
  project: any;
  financials: any;
}

export default function ProfitAnalysisTab({ project, financials }: ProfitAnalysisTabProps) {
  const contractTotal = financials.contractTotal || financials.totalOfferAmount;
  const profitMargin = contractTotal > 0 
    ? ((financials.netProfit / contractTotal) * 100).toFixed(1) 
    : '0.0';
  const expectedProfitMargin = contractTotal > 0
    ? ((financials.expectedProfit / contractTotal) * 100).toFixed(1)
    : '0.0';

  const costBreakdown = [
    { label: 'İşçilik', value: financials.laborCostTotal, color: 'bg-blue-500' },
    { label: 'Malzeme', value: financials.materialCostTotal, color: 'bg-purple-500' },
    { label: 'Diğer Giderler', value: financials.totalPaymentExpense, color: 'bg-orange-500' },
  ];

  const totalCost = financials.totalProjectCost || 1;

  return (
    <div className="space-y-6">
      {/* Main Profit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`border-2 ${financials.netProfit >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          <CardBody className="text-center py-8">
            <p className="text-sm font-medium text-gray-600 mb-2">Gerçekleşen Kâr</p>
            <p className={`text-4xl font-bold ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(financials.netProfit)}
            </p>
            <p className={`text-sm mt-2 ${financials.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              Kâr Marjı: %{profitMargin}
            </p>
          </CardBody>
        </Card>

        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardBody className="text-center py-8">
            <p className="text-sm font-medium text-gray-600 mb-2">Beklenen Kâr</p>
            <p className={`text-4xl font-bold ${financials.expectedProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(financials.expectedProfit)}
            </p>
            <p className="text-sm text-blue-500 mt-2">
              Beklenen Marj: %{expectedProfitMargin}
            </p>
          </CardBody>
        </Card>

        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardBody className="text-center py-8">
            <p className="text-sm font-medium text-gray-600 mb-2">Kâr Farkı</p>
            <p className={`text-4xl font-bold ${(financials.netProfit - financials.expectedProfit) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {formatCurrency(financials.netProfit - financials.expectedProfit)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Gerçekleşen - Beklenen
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Gelir - Gider Özeti</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3" />
                <span className="font-medium">Sözleşme / Teklif Toplamı</span>
              </div>
              <span className="font-bold text-blue-600">{formatCurrency(contractTotal)}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3" />
                <span className="font-medium">Toplam Tahsilat</span>
              </div>
              <span className="font-bold text-emerald-600">{formatCurrency(financials.totalCollection)}</span>
            </div>

            <hr />

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
                <span className="font-medium">Toplam Maliyet</span>
              </div>
              <span className="font-bold text-orange-600">{formatCurrency(financials.totalProjectCost)}</span>
            </div>

            <hr />

            <div className={`flex items-center justify-between p-4 rounded-lg ${financials.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${financials.netProfit >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="font-bold">Net Kâr/Zarar</span>
              </div>
              <span className={`font-bold text-lg ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(financials.netProfit)}
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Maliyet Dağılımı</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            {costBreakdown.map((item) => {
              const percentage = calculatePercentage(item.value, totalCost);
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    <span className="text-sm font-bold">{formatCurrency(item.value)} (%{percentage})</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <hr className="my-4" />

            <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
              <span className="font-bold">Toplam Maliyet</span>
              <span className="font-bold text-lg">{formatCurrency(financials.totalProjectCost)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Formula Explanation */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Hesaplama Formülü</h3>
        </CardHeader>
        <CardBody>
          <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 w-48">Toplam Maliyet</span>
                <span className="text-gray-400 mx-2">=</span>
                <span className="text-gray-900">İşçilik + Malzeme + Diğer Giderler</span>
              </div>
              <div className="flex items-center pl-48">
                <span className="text-gray-400 mx-2">=</span>
                <span className="text-orange-600">
                  {formatCurrency(financials.laborCostTotal)} + {formatCurrency(financials.materialCostTotal)} + {formatCurrency(financials.totalPaymentExpense)}
                </span>
              </div>
              <div className="flex items-center pl-48">
                <span className="text-gray-400 mx-2">=</span>
                <span className="font-bold text-orange-600">{formatCurrency(financials.totalProjectCost)}</span>
              </div>

              <hr className="my-4" />

              <div className="flex items-center">
                <span className="text-gray-600 w-48">Net Kâr/Zarar</span>
                <span className="text-gray-400 mx-2">=</span>
                <span className="text-gray-900">Tahsilat - Toplam Maliyet</span>
              </div>
              <div className="flex items-center pl-48">
                <span className="text-gray-400 mx-2">=</span>
                <span className="text-gray-600">
                  {formatCurrency(financials.totalCollection)} - {formatCurrency(financials.totalProjectCost)}
                </span>
              </div>
              <div className="flex items-center pl-48">
                <span className="text-gray-400 mx-2">=</span>
                <span className={`font-bold ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(financials.netProfit)}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
