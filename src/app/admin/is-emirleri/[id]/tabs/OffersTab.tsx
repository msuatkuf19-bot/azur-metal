'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OFFER_STATUS_LABELS, CURRENCY_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OffersTab({ job }: any) {
  return (
    <div className="space-y-4">
      {job.offers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz teklif yok</h3>
            <p className="text-gray-600 mb-4">İlk teklifinizi oluşturun</p>
            <Button>Yeni Teklif</Button>
          </CardBody>
        </Card>
      ) : (
        job.offers.map((offer: any) => (
          <Card key={offer.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{offer.baslik}</h3>
                  <p className="text-sm text-gray-600">{offer.teklifNo}</p>
                </div>
                <Badge variant={offer.durum === 'Kabul' ? 'success' : offer.durum === 'Red' ? 'danger' : 'default'}>
                  {OFFER_STATUS_LABELS[offer.durum as keyof typeof OFFER_STATUS_LABELS]}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {/* Kalemler */}
              <div className="space-y-2 mb-4">
                {offer.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.urunAdi}</p>
                      {item.aciklama && <p className="text-sm text-gray-600">{item.aciklama}</p>}
                      <p className="text-sm text-gray-500">
                        {item.miktar} {item.birim} × {formatCurrency(item.birimFiyat, offer.paraBirimi)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.satirToplam, offer.paraBirimi)}</p>
                  </div>
                ))}
              </div>

              {/* Toplamlar */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ara Toplam</span>
                  <span className="font-medium">{formatCurrency(offer.araToplam, offer.paraBirimi)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>KDV</span>
                  <span className="font-medium">{formatCurrency(offer.kdvToplam, offer.paraBirimi)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Genel Toplam</span>
                  <span>{formatCurrency(offer.genelToplam, offer.paraBirimi)}</span>
                </div>
              </div>

              {offer.gecerlilikTarihi && (
                <p className="text-sm text-gray-600 mt-4">
                  Geçerlilik: {formatDate(offer.gecerlilikTarihi)}
                </p>
              )}

              {offer.notlar && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{offer.notlar}</p>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
