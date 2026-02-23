'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MaterialsTabProps {
  project: any;
  supplierSummary: any[];
}

export default function MaterialsTab({ project, supplierSummary }: MaterialsTabProps) {
  const materialPurchases = project.materialPurchases || [];
  const totalAmount = materialPurchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0);
  const totalQuantity = materialPurchases.reduce((sum: number, p: any) => sum + p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-purple-50 border-purple-200">
          <CardBody className="text-center">
            <p className="text-sm text-purple-600">Toplam Toptancı</p>
            <p className="text-3xl font-bold text-purple-800">{supplierSummary.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="text-center">
            <p className="text-sm text-blue-600">Toplam Alım</p>
            <p className="text-3xl font-bold text-blue-800">{materialPurchases.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardBody className="text-center">
            <p className="text-sm text-orange-600">Toplam Maliyet</p>
            <p className="text-3xl font-bold text-orange-800">{formatCurrency(totalAmount)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Supplier Summary */}
      {supplierSummary.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Toptancı Bazlı Özet</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toptancı</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Alım Sayısı</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {supplierSummary.map((item: any) => (
                    <tr key={item.supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.supplier.name}</p>
                            {item.supplier.phone && (
                              <p className="text-sm text-gray-500">{item.supplier.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{item.purchaseCount}</td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-600">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* All Material Purchases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Malzeme Alımları</h3>
            <span className="text-sm text-gray-500">{materialPurchases.length} kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {materialPurchases.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-gray-500">Henüz malzeme alımı yok</p>
              <p className="text-sm text-gray-400 mt-1">Sağ panelden &quot;Malzeme Alımı&quot; ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Toptancı</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Malzeme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miktar</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Birim Fiyat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materialPurchases.map((purchase: any) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(purchase.purchaseDate)}</td>
                      <td className="px-6 py-4 font-medium">{purchase.supplier?.name || '-'}</td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900">{purchase.material?.name || purchase.materialName || '-'}</p>
                        {purchase.note && (
                          <p className="text-xs text-gray-500 mt-1">{purchase.note}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">{purchase.quantity} {purchase.unit}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(purchase.unitPrice)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-orange-600">{formatCurrency(purchase.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
