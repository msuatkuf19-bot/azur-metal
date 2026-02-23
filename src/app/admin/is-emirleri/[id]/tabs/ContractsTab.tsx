'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CONTRACT_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

export default function ContractsTab({ job }: any) {
  return (
    <div className="space-y-4">
      {job.contracts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz sözleşme yok</h3>
            <Button>Yeni Sözleşme</Button>
          </CardBody>
        </Card>
      ) : (
        job.contracts.map((contract: any) => (
          <Card key={contract.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{contract.baslik}</h3>
                  <p className="text-sm text-gray-600">{contract.sozlesmeNo}</p>
                </div>
                <Badge variant={contract.imzaDurumu === 'Imzalandi' ? 'success' : 'warning'}>
                  {CONTRACT_STATUS_LABELS[contract.imzaDurumu as keyof typeof CONTRACT_STATUS_LABELS]}
                </Badge>
              </div>
            </CardHeader>
            <CardBody>
              {contract.aciklama && (
                <p className="text-gray-700 mb-4 whitespace-pre-line">{contract.aciklama}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Başlangıç</p>
                  <p className="font-medium">{formatDate(contract.baslangicTarihi)}</p>
                </div>
                {contract.bitisTarihi && (
                  <div>
                    <p className="text-sm text-gray-600">Bitiş</p>
                    <p className="font-medium">{formatDate(contract.bitisTarihi)}</p>
                  </div>
                )}
              </div>
              {contract.dosyaUrl && (
                <a href={contract.dosyaUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline mt-4 inline-block">
                  Sözleşmeyi Görüntüle
                </a>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
