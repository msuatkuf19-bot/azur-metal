'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function LedgerTab({ job, financials }: any) {
  // Tüm hareketleri birleştir ve sırala
  const transactions: any[] = [];

  // Teklifler
  job.offers
    .filter((o: any) => o.durum === 'Kabul')
    .forEach((offer: any) => {
      transactions.push({
        id: `offer-${offer.id}`,
        tarih: offer.updatedAt,
        tur: 'Teklif (Kabul)',
        aciklama: offer.baslik,
        borc: 0,
        alacak: offer.genelToplam,
      });
    });

  // Ödemeler
  job.payments.forEach((payment: any) => {
    transactions.push({
      id: `payment-${payment.id}`,
      tarih: payment.tarih,
      tur: payment.tip === 'Tahsilat' ? 'Tahsilat' : 'Gider',
      aciklama: payment.aciklama || payment.taraf,
      borc: payment.tip === 'Gider' ? payment.tutar : 0,
      alacak: payment.tip === 'Tahsilat' ? -payment.tutar : 0,
    });
  });

  // Tarihe göre sırala
  transactions.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

  // Bakiye hesapla
  let bakiye = 0;
  transactions.forEach((t) => {
    bakiye += t.alacak - t.borc;
    t.bakiye = bakiye;
  });

  return (
    <div className="space-y-6">
      {/* Özet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Toplam Alacak</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {formatCurrency(financials.totalOfferAmount)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Toplam Tahsilat</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(financials.totalIncome)}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Kalan Bakiye</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {formatCurrency(financials.remainingReceivable)}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Ekstre */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Ekstre</h3>
            <Button size="sm" variant="secondary">
              CSV İndir
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Henüz hareket yok</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Tarih</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Tür</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Açıklama</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Borç</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Alacak</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Bakiye</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(t.tarih)}</td>
                      <td className="px-4 py-3 text-sm">{t.tur}</td>
                      <td className="px-4 py-3 text-sm">{t.aciklama}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {t.borc > 0 ? formatCurrency(t.borc) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {t.alacak > 0 ? formatCurrency(t.alacak) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(t.bakiye)}
                      </td>
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
