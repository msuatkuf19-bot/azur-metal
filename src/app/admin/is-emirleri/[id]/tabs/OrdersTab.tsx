'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersTab({ job }: any) {
  return (
    <div className="space-y-4">
      {job.orders.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sipariş yok</h3>
            <Button>Yeni Sipariş</Button>
          </CardBody>
        </Card>
      ) : (
        job.orders.map((order: any) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{order.tedarikciAdi}</h3>
                  <p className="text-sm text-gray-600">{order.orderNo}</p>
                </div>
                <Badge variant={order.durum === 'Teslim' ? 'success' : 'info'}>
                  {ORDER_STATUS_LABELS[order.durum as keyof typeof ORDER_STATUS_LABELS]}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 mb-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{item.urunAdi}</p>
                      <p className="text-sm text-gray-600">{item.adet} adet × {formatCurrency(item.birimFiyat)}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.toplam)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="font-semibold">Toplam</span>
                <span className="text-lg font-bold">{formatCurrency(order.toplamTutar)}</span>
              </div>
              {order.teslimTarihi && (
                <p className="text-sm text-gray-600 mt-2">Teslim: {formatDate(order.teslimTarihi)}</p>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
