'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PAYMENT_PARTY_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_PLAN_STATUS_LABELS,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentRowActions } from '@/components/payments/PaymentRowActions';
import AddCollectionDrawer from '@/app/admin/projeler/[id]/drawers/AddCollectionDrawer';
import AddExpenseDrawer from '@/app/admin/projeler/[id]/drawers/AddExpenseDrawer';

export default function PaymentsTab({ job, paymentPlans }: any) {
  const [openDrawer, setOpenDrawer] = useState<'collection' | 'expense' | null>(null);
  const tahsilatlar = job.payments.filter((p: any) => p.tip === 'Tahsilat');
  const giderler = job.payments.filter((p: any) => p.tip === 'Gider');

  return (
    <div className="space-y-6">
      {/* Ödeme Planı */}
      {paymentPlans && paymentPlans.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ödeme Planı</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {paymentPlans.map((plan: any) => (
                <div key={plan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{plan.aciklama || 'Ödeme'}</p>
                    <p className="text-sm text-gray-600">Vade: {formatDate(plan.vadeTarihi)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(plan.tutar, plan.paraBirimi)}</p>
                    <Badge variant={plan.durum === 'Odendi' ? 'success' : plan.durum === 'Gecikti' ? 'danger' : 'warning'}>
                      {PAYMENT_PLAN_STATUS_LABELS[plan.durum as keyof typeof PAYMENT_PLAN_STATUS_LABELS]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tahsilatlar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tahsilatlar ({tahsilatlar.length})</h3>
            <Button size="sm" onClick={() => setOpenDrawer('collection')}>Yeni Tahsilat</Button>
          </div>
        </CardHeader>
        <CardBody>
          {tahsilatlar.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Henüz tahsilat kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {tahsilatlar.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 p-3 border rounded">
                  <div className="min-w-0">
                    <p className="font-medium">{PAYMENT_PARTY_LABELS[payment.taraf as keyof typeof PAYMENT_PARTY_LABELS] || payment.taraf}</p>
                    <p className="text-sm text-gray-600">
                      {PAYMENT_METHOD_LABELS[payment.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || payment.odemeYontemi} • {formatDate(payment.tarih)}
                    </p>
                    {payment.aciklama && <p className="text-sm text-gray-500">{payment.aciklama}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-semibold text-green-600">{formatCurrency(payment.tutar, payment.paraBirimi)}</p>
                    <PaymentRowActions payment={payment} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Giderler */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Giderler ({giderler.length})</h3>
            <Button size="sm" onClick={() => setOpenDrawer('expense')}>Yeni Gider</Button>
          </div>
        </CardHeader>
        <CardBody>
          {giderler.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Henüz gider kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {giderler.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between gap-4 p-3 border rounded">
                  <div className="min-w-0">
                    <p className="font-medium">{PAYMENT_PARTY_LABELS[payment.taraf as keyof typeof PAYMENT_PARTY_LABELS] || payment.taraf}</p>
                    {payment.master && <p className="text-sm text-gray-600">{payment.master.adSoyad}</p>}
                    <p className="text-sm text-gray-600">
                      {PAYMENT_METHOD_LABELS[payment.odemeYontemi as keyof typeof PAYMENT_METHOD_LABELS] || payment.odemeYontemi} • {formatDate(payment.tarih)}
                    </p>
                    {payment.aciklama && <p className="text-sm text-gray-500">{payment.aciklama}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="font-semibold text-red-600">{formatCurrency(payment.tutar, payment.paraBirimi)}</p>
                    <PaymentRowActions payment={payment} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <AddCollectionDrawer
        isOpen={openDrawer === 'collection'}
        onClose={() => setOpenDrawer(null)}
        projectId={job.id}
      />
      <AddExpenseDrawer
        isOpen={openDrawer === 'expense'}
        onClose={() => setOpenDrawer(null)}
        projectId={job.id}
      />
    </div>
  );
}
