'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { formatPhone, formatDate } from '@/lib/utils';

export default function GeneralTab({ job }: any) {
  return (
    <div className="space-y-6">
      {/* Müşteri Bilgileri */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Müşteri Bilgileri</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {job.yetkiliAdSoyad && (
              <div>
                <label className="text-sm font-medium text-gray-600">Yetkili</label>
                <p className="mt-1 text-gray-900">{job.yetkiliAdSoyad}</p>
              </div>
            )}
            {job.telefon && (
              <div>
                <label className="text-sm font-medium text-gray-600">Telefon</label>
                <p className="mt-1 text-gray-900">{formatPhone(job.telefon)}</p>
              </div>
            )}
            {job.email && (
              <div>
                <label className="text-sm font-medium text-gray-600">E-posta</label>
                <p className="mt-1 text-gray-900">{job.email}</p>
              </div>
            )}
            {job.tc && (
              <div>
                <label className="text-sm font-medium text-gray-600">TC Kimlik No</label>
                <p className="mt-1 text-gray-900">{job.tc}</p>
              </div>
            )}
            {job.vergiNo && (
              <div>
                <label className="text-sm font-medium text-gray-600">Vergi No</label>
                <p className="mt-1 text-gray-900">{job.vergiNo}</p>
              </div>
            )}
            {job.vergiDairesi && (
              <div>
                <label className="text-sm font-medium text-gray-600">Vergi Dairesi</label>
                <p className="mt-1 text-gray-900">{job.vergiDairesi}</p>
              </div>
            )}
            {job.il && (
              <div>
                <label className="text-sm font-medium text-gray-600">İl / İlçe</label>
                <p className="mt-1 text-gray-900">
                  {job.il} {job.ilce && `/ ${job.ilce}`}
                </p>
              </div>
            )}
            {job.faturaUnvani && (
              <div>
                <label className="text-sm font-medium text-gray-600">Fatura Ünvanı</label>
                <p className="mt-1 text-gray-900">{job.faturaUnvani}</p>
              </div>
            )}
          </div>

          {job.adres && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Adres</label>
              <p className="mt-1 text-gray-900 whitespace-pre-line">{job.adres}</p>
            </div>
          )}

          {job.teslimatAdresi && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Teslimat Adresi</label>
              <p className="mt-1 text-gray-900 whitespace-pre-line">{job.teslimatAdresi}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* İş Emri Bilgileri */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">İş Emri Bilgileri</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Sektör</label>
              <p className="mt-1 text-gray-900">{job.sektor}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Oluşturma Tarihi</label>
              <p className="mt-1 text-gray-900">{formatDate(job.olusturmaTarihi)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Güncelleme Tarihi</label>
              <p className="mt-1 text-gray-900">{formatDate(job.guncellemeTarihi)}</p>
            </div>
            {job.kapanisTarihi && (
              <div>
                <label className="text-sm font-medium text-gray-600">Kapanış Tarihi</label>
                <p className="mt-1 text-gray-900">{formatDate(job.kapanisTarihi)}</p>
              </div>
            )}
          </div>

          {job.notlar && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600">Notlar</label>
              <p className="mt-1 text-gray-900 whitespace-pre-line">{job.notlar}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Dosyalar */}
      {job.files && job.files.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Dosyalar ({job.files.length})</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {job.files.map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">{file.dosyaAdi}</p>
                      <p className="text-sm text-gray-500">
                        {file.kategori} • {formatDate(file.createdAt)}
                      </p>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    İndir
                  </a>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
