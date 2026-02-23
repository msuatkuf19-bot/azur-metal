'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { UNIT_OPTIONS, VAT_RATE_OPTIONS } from '@/lib/constants';
import { createMaterialPurchase } from '@/app/actions/material-purchases';
import toast from 'react-hot-toast';

interface AddMaterialPurchaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  suppliers: any[];
  materials: any[];
}

export default function AddMaterialPurchaseDrawer({
  isOpen,
  onClose,
  projectId,
  suppliers,
  materials,
}: AddMaterialPurchaseDrawerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    materialId: '',
    materialName: '',
    quantity: '',
    unit: 'adet',
    unitPrice: '',
    vatRate: '20',
    purchaseDate: new Date().toISOString().split('T')[0],
    note: '',
  });

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    setFormData({
      ...formData,
      materialId,
      materialName: material?.name || '',
      unit: material?.unit || 'adet',
      vatRate: material?.defaultVatRate?.toString() || '20',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId || !formData.quantity || !formData.unitPrice) {
      toast.error('Lütfen zorunlu alanları doldurun');
      return;
    }

    if (!formData.materialId && !formData.materialName) {
      toast.error('Malzeme seçin veya malzeme adı girin');
      return;
    }

    setIsLoading(true);

    const result = await createMaterialPurchase({
      jobId: projectId,
      supplierId: formData.supplierId,
      materialId: formData.materialId || undefined,
      materialName: formData.materialName || undefined,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      unitPrice: parseFloat(formData.unitPrice),
      vatRate: formData.vatRate ? parseFloat(formData.vatRate) : undefined,
      purchaseDate: formData.purchaseDate,
      note: formData.note || undefined,
    });

    if (result.success) {
      toast.success('Malzeme alımı eklendi');
      setFormData({
        supplierId: '',
        materialId: '',
        materialName: '',
        quantity: '',
        unit: 'adet',
        unitPrice: '',
        vatRate: '20',
        purchaseDate: new Date().toISOString().split('T')[0],
        note: '',
      });
      onClose();
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }

    setIsLoading(false);
  };

  const subtotal = formData.quantity && formData.unitPrice
    ? parseFloat(formData.quantity) * parseFloat(formData.unitPrice)
    : 0;
  const vatAmount = subtotal * (parseFloat(formData.vatRate || '0') / 100);
  const totalAmount = subtotal + vatAmount;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Malzeme Alımı Ekle" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Supplier Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Toptancı / Tedarikçi <span className="text-red-500">*</span>
          </label>
          <Select
            options={[
              { value: '', label: 'Toptancı Seçin' },
              ...suppliers.map((s) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
          />
        </div>

        {/* Material Selection or Free Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Malzeme
          </label>
          <Select
            options={[
              { value: '', label: 'Katalogdan Seçin veya Aşağıya Yazın' },
              ...materials.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.unit})`,
              })),
            ]}
            value={formData.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Malzeme Adı (Serbest) {!formData.materialId && <span className="text-red-500">*</span>}
          </label>
          <Input
            placeholder="Örn: 40x40 Profil Demir"
            value={formData.materialName}
            onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
            disabled={!!formData.materialId}
          />
        </div>

        {/* Quantity, Unit, Price */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Miktar <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="10"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birim
            </label>
            <Select
              options={UNIT_OPTIONS}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birim Fiyat (₺) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="250"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            />
          </div>
        </div>

        {/* VAT and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              KDV Oranı
            </label>
            <Select
              options={VAT_RATE_OPTIONS.map((v) => ({ value: v.value.toString(), label: v.label }))}
              value={formData.vatRate}
              onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alım Tarihi
            </label>
            <Input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Not / Fatura No
          </label>
          <TextArea
            rows={2}
            placeholder="Fatura numarası veya not..."
            value={formData.note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        {/* Total Preview */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Ara Toplam</span>
            <span className="font-medium">₺{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">KDV (%{formData.vatRate})</span>
            <span className="font-medium">₺{vatAmount.toFixed(2)}</span>
          </div>
          <hr />
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-700">Toplam Tutar</span>
            <span className="text-2xl font-bold text-orange-600">₺{totalAmount.toFixed(2)}</span>
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
