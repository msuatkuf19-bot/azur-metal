'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { createWorkEntry } from '@/app/actions/work-entries';
import toast from 'react-hot-toast';

interface AddWorkEntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  workers: any[];
}

export default function AddWorkEntryDrawer({
  isOpen,
  onClose,
  projectId,
  workers,
}: AddWorkEntryDrawerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    hourlyRate: '',
    description: '',
  });

  const handleWorkerChange = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    setFormData({
      ...formData,
      workerId,
      hourlyRate: worker?.hourlyRateDefault?.toString() || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.workerId || !formData.hours || !formData.hourlyRate) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    setIsLoading(true);

    const result = await createWorkEntry({
      jobId: projectId,
      workerId: formData.workerId,
      date: formData.date,
      hours: parseFloat(formData.hours),
      hourlyRate: parseFloat(formData.hourlyRate),
      description: formData.description || undefined,
    });

    if (result.success) {
      toast.success('İşçilik kaydı eklendi');
      setFormData({
        workerId: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        hourlyRate: '',
        description: '',
      });
      onClose();
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }

    setIsLoading(false);
  };

  const totalAmount = formData.hours && formData.hourlyRate
    ? (parseFloat(formData.hours) * parseFloat(formData.hourlyRate)).toFixed(2)
    : '0.00';

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="İşçilik Kaydı Ekle" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Worker Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Çalışan <span className="text-red-500">*</span>
          </label>
          <Select
            options={[
              { value: '', label: 'Çalışan Seçin' },
              ...workers.map((w) => ({
                value: w.id,
                label: `${w.fullName} (${w.roleType === 'USTA' ? 'Usta' : 'İşçi'})`,
              })),
            ]}
            value={formData.workerId}
            onChange={(e) => handleWorkerChange(e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarih <span className="text-red-500">*</span>
          </label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        {/* Hours and Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saat <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              placeholder="8"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saatlik Ücret (₺) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="100"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
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
            placeholder="Yapılan iş hakkında not..."
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Total Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Toplam Tutar</span>
            <span className="text-2xl font-bold text-emerald-600">₺{totalAmount}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.hours || '0'} saat × ₺{formData.hourlyRate || '0'} = ₺{totalAmount}
          </p>
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
