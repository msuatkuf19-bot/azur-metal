'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Input } from '@/components/ui/Input';
import { UNIT_LABELS, UNIT_OPTIONS, VAT_RATE_OPTIONS, ACTIVE_STATUS_COLORS } from '@/lib/constants';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  activateMaterial,
  hardDeleteMaterial
} from '@/app/actions/materials';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';

interface Material {
  id: string;
  name: string;
  unit: string;
  defaultVatRate: number;
  isActive: boolean;
  createdAt: string;
  _count: { purchases: number };
}

interface MaterialsClientProps {
  initialData: Material[];
}

export default function MaterialsClient({ initialData }: MaterialsClientProps) {
  const router = useRouter();
  // router.refresh() sonrası güncel veri görünmesi için doğrudan prop kullanılır
  const materials = initialData;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    unit: 'adet',
    defaultVatRate: 20,
    isActive: true,
  });

  const filteredMaterials = materials.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (activeFilter === 'true' && !m.isActive) {
      return false;
    }
    if (activeFilter === 'false' && m.isActive) {
      return false;
    }
    return true;
  });

  const openCreateDrawer = () => {
    setEditingMaterial(null);
    setFormData({
      name: '',
      unit: 'adet',
      defaultVatRate: 20,
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      unit: material.unit,
      defaultVatRate: material.defaultVatRate,
      isActive: material.isActive,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingMaterial) {
        const result = await updateMaterial(editingMaterial.id, formData);
        if (result.success) {
          toast.success('Malzeme güncellendi');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await createMaterial(formData);
        if (result.success) {
          toast.success('Malzeme oluşturuldu');
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

  const handleDelete = async (material: Material) => {
    if (!confirm(`"${material.name}" pasife alınacak. Devam edilsin mi?`)) {
      return;
    }

    const result = await deleteMaterial(material.id);
    if (result.success) {
      toast.success('Malzeme pasife alındı');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleHardDelete = async () => {
    if (!deleteTarget) return;

    const result = await hardDeleteMaterial(deleteTarget.id);
    if (result.success) {
      toast.success('Malzeme kalıcı olarak silindi');
      setDeleteTarget(null);
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleActivate = async (material: Material) => {
    const result = await activateMaterial(material.id);
    if (result.success) {
      toast.success('Malzeme aktifleştirildi');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Malzeme Adı',
      render: (m: Material) => <span className="font-medium">{m.name}</span>,
    },
    {
      key: 'unit',
      header: 'Birim',
      render: (m: Material) => UNIT_LABELS[m.unit as keyof typeof UNIT_LABELS] || m.unit,
    },
    {
      key: 'defaultVatRate',
      header: 'Varsayılan KDV',
      render: (m: Material) => `%${m.defaultVatRate}`,
    },
    {
      key: 'purchaseCount',
      header: 'Alım Sayısı',
      render: (m: Material) => `${m._count.purchases} alım`,
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: (m: Material) => (
        <Badge className={m.isActive ? ACTIVE_STATUS_COLORS.true : ACTIVE_STATUS_COLORS.false}>
          {m.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (m: Material) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(m)}>
            Düzenle
          </Button>
          {m.isActive ? (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>
              Pasife Al
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => handleActivate(m)}>
              Aktifleştir
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTarget(m)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  const handleExportPdf = () => {
    const sections: PdfSection[] = [
      {
        title: `Malzeme Listesi (${filteredMaterials.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Malzeme Adı', key: 'ad', bold: true },
            { header: 'Birim', key: 'birim' },
            { header: 'Varsayılan KDV', key: 'kdv', align: 'right' as const },
            { header: 'Alım Sayısı', key: 'alim', align: 'right' as const },
            { header: 'Durum', key: 'durum' },
          ],
          rows: filteredMaterials.map((m) => ({
            ad: m.name,
            birim: UNIT_LABELS[m.unit as keyof typeof UNIT_LABELS] || m.unit,
            kdv: `%${m.defaultVatRate}`,
            alim: m._count.purchases.toString(),
            durum: m.isActive ? 'Aktif' : 'Pasif',
          })),
        },
      },
    ];

    exportToPdf({
      title: 'Malzeme Raporu',
      subtitle: `${filteredMaterials.length} malzeme`,
      sections,
    });
  };

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Toplam {filteredMaterials.length} malzeme
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleExportPdf}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Rapor Al
          </Button>
          <Button onClick={openCreateDrawer}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Malzeme
          </Button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="Malzeme adı ara...">
        <SelectFilter
          label="Durum"
          value={activeFilter}
          onChange={setActiveFilter}
          options={[
            { value: 'true', label: 'Aktif' },
            { value: 'false', label: 'Pasif' },
          ]}
        />
      </FilterBar>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredMaterials}
        keyExtractor={(m) => m.id}
        emptyMessage="Henüz malzeme eklenmemiş"
      />

      {/* Drawer Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingMaterial ? 'Malzeme Düzenle' : 'Yeni Malzeme'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Malzeme Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="örn: Paslanmaz Çelik Levha"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birim <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {UNIT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Varsayılan KDV Oranı
            </label>
            <select
              value={formData.defaultVatRate}
              onChange={(e) => setFormData({ ...formData, defaultVatRate: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {VAT_RATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {editingMaterial && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Aktif
              </label>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : editingMaterial ? 'Güncelle' : 'Oluştur'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Kalıcı Silme Onayı */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleHardDelete}
        title="Malzeme Silinecek"
        description={deleteTarget ? `"${deleteTarget.name}" malzemesi kalıcı olarak silinecek. ${deleteTarget._count.purchases > 0 ? `${deleteTarget._count.purchases} alım kaydındaki malzeme bağlantısı kaldırılır (alım kayıtları silinmez).` : 'Bu malzemeye bağlı alım kaydı yok.'}` : ''}
        finalWarning={deleteTarget ? `"${deleteTarget.name}" kalıcı olarak silinecek ve geri getirilemeyecek.` : ''}
      />
    </div>
  );
}
