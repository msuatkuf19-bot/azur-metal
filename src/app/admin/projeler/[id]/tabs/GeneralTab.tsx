'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatPhone } from '@/lib/utils';

interface GeneralTabProps {
  project: any;
  metrics: any;
}

export default function GeneralTab({ project, metrics }: GeneralTabProps) {
  // Parse etiketler
  const etiketler = typeof project.etiketler === 'string'
    ? JSON.parse(project.etiketler || '[]')
    : (project.etiketler || []);

  return (
    <div className="space-y-6">
      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Proje Bilgileri</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Referans Kodu</p>
                <p className="font-medium">{project.referansKodu}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Oluşturma Tarihi</p>
                <p className="font-medium">{formatDate(project.olusturmaTarihi)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Son Güncelleme</p>
                <p className="font-medium">{formatDate(project.guncellemeTarihi)}</p>
              </div>
              {project.kapanisTarihi && (
                <div>
                  <p className="text-sm text-gray-500">Kapanış Tarihi</p>
                  <p className="font-medium">{formatDate(project.kapanisTarihi)}</p>
                </div>
              )}
            </div>
            {etiketler.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Etiketler</p>
                <div className="flex flex-wrap gap-2">
                  {etiketler.map((tag: string) => (
                    <Badge key={tag} variant="info">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            {project.notlar && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notlar</p>
                <p className="text-gray-700 whitespace-pre-wrap">{project.notlar}</p>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Müşteri Bilgileri</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Ad Soyad</p>
                <p className="font-medium">{project.musteriAdi} {project.musteriSoyadi || ''}</p>
              </div>
              {project.firmaAdi && (
                <div>
                  <p className="text-sm text-gray-500">Firma</p>
                  <p className="font-medium">{project.firmaAdi}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Telefon</p>
                <p className="font-medium">{formatPhone(project.telefon)}</p>
              </div>
              {project.email && (
                <div>
                  <p className="text-sm text-gray-500">E-posta</p>
                  <p className="font-medium">{project.email}</p>
                </div>
              )}
              {project.tcKimlikNo && (
                <div>
                  <p className="text-sm text-gray-500">TC Kimlik No</p>
                  <p className="font-medium">{project.tcKimlikNo}</p>
                </div>
              )}
              {project.vergiNo && (
                <div>
                  <p className="text-sm text-gray-500">Vergi No</p>
                  <p className="font-medium">{project.vergiNo}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Address Info */}
      {(project.il || project.adres) && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Adres Bilgileri</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(project.il || project.ilce) && (
                <div>
                  <p className="text-sm text-gray-500">İl / İlçe</p>
                  <p className="font-medium">{project.il} {project.ilce ? `/ ${project.ilce}` : ''}</p>
                </div>
              )}
              {project.adres && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Adres</p>
                  <p className="font-medium">{project.adres}</p>
                </div>
              )}
              {project.teslimatAdresi && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Teslimat Adresi</p>
                  <p className="font-medium">{project.teslimatAdresi}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Workers on Project */}
      {metrics.uniqueWorkers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Projede Çalışan Ustalar</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              {metrics.uniqueWorkers.map((worker: any) => (
                <div
                  key={worker.id}
                  className="flex items-center space-x-3 bg-gray-50 rounded-lg px-4 py-2"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{worker.fullName}</p>
                    <p className="text-sm text-gray-500">{worker.roleType === 'USTA' ? 'Usta' : 'İşçi'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Timeline placeholder */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Zaman Çizelgesi</h3>
        </CardHeader>
        <CardBody>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-6 ml-10">
              <div className="relative">
                <div className="absolute -left-8 w-4 h-4 bg-primary-500 rounded-full border-2 border-white" />
                <div>
                  <p className="text-sm text-gray-500">{formatDate(project.olusturmaTarihi)}</p>
                  <p className="font-medium">Proje oluşturuldu</p>
                </div>
              </div>
              {project.contracts?.filter((c: any) => c.durum === 'Imzalandi').map((contract: any) => (
                <div key={contract.id} className="relative">
                  <div className="absolute -left-8 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                  <div>
                    <p className="text-sm text-gray-500">{formatDate(contract.imzaTarihi || contract.createdAt)}</p>
                    <p className="font-medium">Sözleşme imzalandı: {contract.baslik}</p>
                  </div>
                </div>
              ))}
              {project.durum === 'Tamamlandi' && project.kapanisTarihi && (
                <div className="relative">
                  <div className="absolute -left-8 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                  <div>
                    <p className="text-sm text-gray-500">{formatDate(project.kapanisTarihi)}</p>
                    <p className="font-medium">Proje tamamlandı</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
