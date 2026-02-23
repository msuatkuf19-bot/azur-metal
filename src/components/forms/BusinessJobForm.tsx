'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';
import { createBusinessJob, updateBusinessJob } from '@/app/actions/business-jobs';
import { JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from '@/lib/constants';
import { parseEtiketler } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BusinessJobFormProps {
  initialData?: any;
  jobId?: string;
}

export default function BusinessJobForm({ initialData, jobId }: BusinessJobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firmaAdi: initialData?.firmaAdi || '',
    musteriAdi: initialData?.musteriAdi || '',
    musteriSoyadi: initialData?.musteriSoyadi || '',
    durum: initialData?.durum || 'Yeni',
    oncelik: initialData?.oncelik || 'Normal',
    etiketler: parseEtiketler(initialData?.etiketler),
    notlar: initialData?.notlar || '',
    telefon: initialData?.telefon || '',
    email: initialData?.email || '',
    tcKimlikNo: initialData?.tcKimlikNo || '',
    vergiNo: initialData?.vergiNo || '',
    il: initialData?.il || '',
    ilce: initialData?.ilce || '',
    adres: initialData?.adres || '',
    faturaUnvani: initialData?.faturaUnvani || '',
    teslimatAdresi: initialData?.teslimatAdresi || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // etiketler array'ini JSON string'e çevir
      const submitData = {
        ...formData,
        etiketler: JSON.stringify(formData.etiketler),
      };

      const result = jobId
        ? await updateBusinessJob(jobId, submitData)
        : await createBusinessJob(submitData);

      if (result.success) {
        toast.success(jobId ? 'İş emri güncellendi' : 'İş emri oluşturuldu');
        router.push('/admin/is-emirleri');
        router.refresh();
      } else {
        toast.error(result.error || 'Bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {jobId ? 'İş Emrini Düzenle' : 'Yeni İş Emri'}
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Genel Bilgiler */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Genel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Firma Adı"
                  name="firmaAdi"
                  value={formData.firmaAdi}
                  onChange={handleChange}
                  placeholder="İşletme/Firma adı"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Müşteri Adı *"
                    name="musteriAdi"
                    value={formData.musteriAdi}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Müşteri Soyadı"
                    name="musteriSoyadi"
                    value={formData.musteriSoyadi}
                    onChange={handleChange}
                  />
                </div>
                <Select
                  label="Durum"
                  options={Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={formData.durum}
                  onChange={(e) => setFormData({ ...formData, durum: e.target.value })}
                  required
                />
                <Select
                  label="Öncelik"
                  options={Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                  value={formData.oncelik}
                  onChange={(e) => setFormData({ ...formData, oncelik: e.target.value })}
                  required
                />
              </div>

              <TextArea
                label="Notlar"
                name="notlar"
                value={formData.notlar || ''}
                onChange={handleChange}
                placeholder="İş emri hakkında notlar..."
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Etiketler
                </label>
                <Input
                  placeholder="Virgülle ayırarak etiket ekleyin (ör: Yeni Müşteri, İstanbul)"
                  value={formData.etiketler.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      etiketler: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                />
              </div>
            </div>

            {/* Müşteri Bilgileri */}
            <div>
              <h3 className="text-lg font-semibold mb-4">İletişim Bilgileri</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Telefon *"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  placeholder="05XX XXX XX XX"
                  required
                />
                <Input
                  label="E-posta"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input
                  label="TC Kimlik No"
                  name="tcKimlikNo"
                  value={formData.tcKimlikNo}
                  onChange={handleChange}
                  maxLength={11}
                />
                <Input
                  label="Vergi No"
                  name="vergiNo"
                  value={formData.vergiNo}
                  onChange={handleChange}
                />
                <Input
                  label="İl"
                  name="il"
                  value={formData.il}
                  onChange={handleChange}
                />
                <Input
                  label="İlçe"
                  name="ilce"
                  value={formData.ilce}
                  onChange={handleChange}
                />
              </div>

              <TextArea
                label="Adres"
                name="adres"
                value={formData.adres}
                onChange={handleChange}
              />

              <Input
                label="Fatura Ünvanı"
                name="faturaUnvani"
                value={formData.faturaUnvani}
                onChange={handleChange}
              />

              <TextArea
                label="Teslimat Adresi"
                name="teslimatAdresi"
                value={formData.teslimatAdresi}
                onChange={handleChange}
                placeholder="Eğer fatura adresinden farklıysa..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                İptal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor...' : (jobId ? 'Güncelle' : 'Oluştur')}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
