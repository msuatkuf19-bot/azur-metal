'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/ui/FilterBar';
import { SummaryBar } from '@/components/ui/SummaryCards';
import { Input, TextArea } from '@/components/ui/Input';
import { UNIT_LABELS, UNIT_OPTIONS, VAT_RATE_OPTIONS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getActiveSuppliers } from '@/app/actions/suppliers';
import { getActiveMaterials } from '@/app/actions/materials';
import { createMaterialPurchase, updateMaterialPurchase, deleteMaterialPurchase } from '@/app/actions/material-purchases';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface MaterialPurchase {
  id: string;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
  };
  materialId: string | null;
  material: {
    id: string;
    name: string;
    unit: string;
  } | null;
  materialName: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number | null;
  totalAmount: number;
  note: string | null;
  purchaseDate: string;
}

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
}

interface Material {
  id: string;
  name: string;
  unit: string;
  defaultVatRate: number;
}

interface MaterialPurchasesTabProps {
  job: any;
  materialPurchases: MaterialPurchase[];
}

export default function MaterialPurchasesTab({ job, materialPurchases: initialPurchases }: MaterialPurchasesTabProps) {
  const router = useRouter();
  const [purchases, setPurchases] = useState<MaterialPurchase[]>(initialPurchases || []);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MaterialPurchase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useCustomMaterial, setUseCustomMaterial] = useState(false);
  
  // Filters
  const [supplierFilter, setSupplierFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    supplierId: '',
    materialId: '',
    materialName: '',
    quantity: 1,
    unit: 'adet',
    unitPrice: 0,
    vatRate: 20,
    note: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  // Load suppliers and materials for dropdowns
  useEffect(() => {
    const loadData = async () => {
      const [suppliersResult, materialsResult] = await Promise.all([
        getActiveSuppliers(),
        getActiveMaterials(),
      ]);
      if (suppliersResult.success) setSuppliers(suppliersResult.data || []);
      if (materialsResult.success) setMaterials(materialsResult.data || []);
    };
    loadData();
  }, []);

  // Calculate live total
  let calculatedTotal = formData.quantity * formData.unitPrice;
  if (formData.vatRate > 0) {
    calculatedTotal += calculatedTotal * (formData.vatRate / 100);
  }

  // Filter purchases
  const filteredPurchases = purchases.filter((p) => {
    if (supplierFilter && p.supplierId !== supplierFilter) return false;
    if (startDate && new Date(p.purchaseDate) < new Date(startDate)) return false;
    if (endDate && new Date(p.purchaseDate) > new Date(endDate)) return false;
    return true;
  });

  // Summary calculations
  const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  
  // Supplier breakdown
  const supplierTotals = filteredPurchases.reduce((acc: Record<string, { name: string; total: number }>, p) => {
    if (!acc[p.supplierId]) {
      acc[p.supplierId] = { name: p.supplier.name, total: 0 };
    }
    acc[p.supplierId].total += p.totalAmount;
    return acc;
  }, {});

  const openCreateDrawer = () => {
    setEditingPurchase(null);
    setUseCustomMaterial(false);
    setFormData({
      supplierId: suppliers[0]?.id || '',
      materialId: '',
      materialName: '',
      quantity: 1,
      unit: 'adet',
      unitPrice: 0,
      vatRate: 20,
      note: '',
      purchaseDate: new Date().toISOString().split('T')[0],
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (purchase: MaterialPurchase) => {
    setEditingPurchase(purchase);
    setUseCustomMaterial(!purchase.materialId);
    setFormData({
      supplierId: purchase.supplierId,
      materialId: purchase.materialId || '',
      materialName: purchase.materialName || '',
      quantity: purchase.quantity,
      unit: purchase.unit,
      unitPrice: purchase.unitPrice,
      vatRate: purchase.vatRate || 0,
      note: purchase.note || '',
      purchaseDate: new Date(purchase.purchaseDate).toISOString().split('T')[0],
    });
    setIsDrawerOpen(true);
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    setFormData({
      ...formData,
      materialId,
      unit: material?.unit || 'adet',
      vatRate: material?.defaultVatRate || 20,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const submitData = {
      ...formData,
      materialId: useCustomMaterial ? undefined : formData.materialId || undefined,
      materialName: useCustomMaterial ? formData.materialName : undefined,
      vatRate: formData.vatRate || undefined,
    };

    try {
      if (editingPurchase) {
        const result = await updateMaterialPurchase(editingPurchase.id, submitData);
        if (result.success) {
          toast.success('Malzeme alımı güncellendi');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await createMaterialPurchase({
          ...submitData,
          jobId: job.id,
        });
        if (result.success) {
          toast.success('Malzeme alımı oluşturuldu');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (purchase: MaterialPurchase) => {
    if (!confirm('Bu malzeme alımını silmek istediğinize emin misiniz?')) {
      return;
    }

    const result = await deleteMaterialPurchase(purchase.id);
    if (result.success) {
      toast.success('Malzeme alımı silindi');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const columns = [
    {
      key: 'purchaseDate',
      header: 'Tarih',
      render: (p: MaterialPurchase) => formatDate(p.purchaseDate),
    },
    {
      key: 'supplier',
      header: 'Toptancı',
      render: (p: MaterialPurchase) => (
        <span className="font-medium">{p.supplier.name}</span>
      ),
    },
    {
      key: 'material',
      header: 'Malzeme',
      render: (p: MaterialPurchase) => (
        <span>{p.material?.name || p.materialName || '-'}</span>
      ),
    },
    {
      key: 'quantity',
      header: 'Miktar',
      render: (p: MaterialPurchase) => (
        <span>
          {p.quantity} {UNIT_LABELS[p.unit as keyof typeof UNIT_LABELS] || p.unit}
        </span>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Birim Fiyat',
      render: (p: MaterialPurchase) => formatCurrency(p.unitPrice),
    },
    {
      key: 'totalAmount',
      header: 'Tutar',
      render: (p: MaterialPurchase) => (
        <div>
          <span className="font-semibold text-orange-600">
            {formatCurrency(p.totalAmount)}
          </span>
          {p.vatRate && <span className="text-xs text-gray-500 ml-1">(+%{p.vatRate} KDV)</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (p: MaterialPurchase) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(p)}>
            Düzenle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(p)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  if (purchases.length === 0 && !isDrawerOpen) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz malzeme alımı yok</h3>
          <p className="text-gray-500 mb-4">Bu iş emrine malzeme alımı ekleyerek başlayın</p>
          <Button onClick={openCreateDrawer}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Malzeme Alımı
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <SummaryBar
        items={[
          { label: 'Toplam Alım', value: `${filteredPurchases.length} kayıt` },
          { label: 'Toplam Maliyet', value: totalAmount, color: 'warning' },
        ]}
      />

      {/* Supplier breakdown */}
      {Object.keys(supplierTotals).length > 1 && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-700">Toptancı Bazlı Toplamlar</h3>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-4">
              {Object.entries(supplierTotals).map(([id, data]) => (
                <div key={id} className="bg-gray-50 px-4 py-2 rounded-lg">
                  <p className="text-sm text-gray-500">{data.name}</p>
                  <p className="font-semibold">{formatCurrency(data.total)}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Actions & Filters */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{filteredPurchases.length} kayıt gösteriliyor</p>
        <Button onClick={openCreateDrawer}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Malzeme Alımı
        </Button>
      </div>

      <FilterBar>
        <SelectFilter
          label="Toptancı"
          value={supplierFilter}
          onChange={setSupplierFilter}
          options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
        />
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </FilterBar>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        keyExtractor={(p) => p.id}
        emptyMessage="Filtrelere uygun kayıt bulunamadı"
      />

      {/* Drawer Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingPurchase ? 'Malzeme Alımı Düzenle' : 'Yeni Malzeme Alımı'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Toptancı <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Toptancı seçin</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Material selection toggle */}
          <div className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              id="useCustomMaterial"
              checked={useCustomMaterial}
              onChange={(e) => setUseCustomMaterial(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="useCustomMaterial" className="text-sm text-gray-700">
              Katalog dışı malzeme gir
            </label>
          </div>

          {useCustomMaterial ? (
            <Input
              label="Malzeme Adı"
              value={formData.materialName}
              onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
              placeholder="Malzeme adını yazın"
              required
            />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Malzeme <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Malzeme seçin</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({UNIT_LABELS[m.unit as keyof typeof UNIT_LABELS] || m.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Tarih"
            type="date"
            value={formData.purchaseDate}
            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Miktar"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birim</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Input
              label="Birim Fiyat (₺)"
              type="number"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı</label>
            <select
              value={formData.vatRate}
              onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {VAT_RATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Live total calculation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Toplam Tutar:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formData.quantity} {UNIT_LABELS[formData.unit as keyof typeof UNIT_LABELS] || formData.unit} × {formatCurrency(formData.unitPrice)}
              {formData.vatRate > 0 && ` + %${formData.vatRate} KDV`}
            </p>
          </div>

          <TextArea
            label="Not"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Alım hakkında notlar..."
          />

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : editingPurchase ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
