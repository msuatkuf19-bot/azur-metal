'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { PAYMENT_PARTY_LABELS, PAYMENT_METHOD_LABELS, EXPENSE_CATEGORY_LABELS } from '@/lib/constants';
import { createPayment } from '@/app/actions/business-jobs';
import toast from 'react-hot-toast';

interface AddExpenseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export default function AddExpenseDrawer({
  isOpen,
  onClose,
  projectId,
}: AddExpenseDrawerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    taraf: 'Diger',
    tutar: '',
    tarih: new Date().toISOString().split('T')[0],
    odemeYontemi: 'Nakit',
    aciklama: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tutar) {
      toast.error('Lütfen tutar girin');
      return;
    }

    setIsLoading(true);

    const result = await createPayment({
      jobId: projectId,
      tip: 'Gider',
      taraf: formData.taraf,
      tutar: parseFloat(formData.tutar),
      tarih: new Date(formData.tarih),
      odemeYontemi: formData.odemeYontemi,
      aciklama: formData.aciklama || undefined,
    });

    if (result.success) {
      toast.success('Gider kaydı eklendi');
      setFormData({
        taraf: 'Diger',
        tutar: '',
        tarih: new Date().toISOString().split('T')[0],
        odemeYontemi: 'Nakit',
        aciklama: '',
      });
      onClose();
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }

    setIsLoading(false);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Gider Ekle" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category / Party */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gider Türü <span className="text-red-500">*</span>
          </label>
          <Select
            options={Object.entries(PAYMENT_PARTY_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
            value={formData.taraf}
            onChange={(e) => setFormData({ ...formData, taraf: e.target.value })}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tutar (₺) <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="1500.00"
            value={formData.tutar}
            onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
          />
        </div>

        {/* Date and Payment Method */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarih
            </label>
            <Input
              type="date"
              value={formData.tarih}
              onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ödeme Yöntemi
            </label>
            <Select
              options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              value={formData.odemeYontemi}
              onChange={(e) => setFormData({ ...formData, odemeYontemi: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <TextArea
            rows={3}
            placeholder="Gider detayı..."
            value={formData.aciklama}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, aciklama: e.target.value })}
          />
        </div>

        {/* Total Preview */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-red-600">Gider Tutarı</span>
            <span className="text-2xl font-bold text-red-600">
              ₺{formData.tutar ? parseFloat(formData.tutar).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Kaydet'
            )}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
