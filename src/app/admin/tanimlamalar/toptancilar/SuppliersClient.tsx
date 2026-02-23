'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Input, TextArea } from '@/components/ui/Input';
import { ACTIVE_STATUS_COLORS } from '@/lib/constants';
import { 
  createSupplier, 
  updateSupplier, 
  deleteSupplier, 
  activateSupplier 
} from '@/app/actions/suppliers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { materialPurchases: number };
}

interface SuppliersClientProps {
  initialData: Supplier[];
}

export default function SuppliersClient({ initialData }: SuppliersClientProps) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    taxNo: '',
    notes: '',
    isActive: true,
  });

  const filteredSuppliers = suppliers.filter((s) => {
    if (search) {
      const searchLower = search.toLowerCase();
      if (!s.name.toLowerCase().includes(searchLower) && 
          !(s.contactName?.toLowerCase().includes(searchLower)) &&
          !(s.phone?.includes(search))) {
        return false;
      }
    }
    if (activeFilter === 'true' && !s.isActive) {
      return false;
    }
    if (activeFilter === 'false' && s.isActive) {
      return false;
    }
    return true;
  });

  const openCreateDrawer = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxNo: '',
      notes: '',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxNo: supplier.taxNo || '',
      notes: supplier.notes || '',
      isActive: supplier.isActive,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingSupplier) {
        const result = await updateSupplier(editingSupplier.id, formData);
        if (result.success) {
          toast.success('Toptancı güncellendi');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await createSupplier(formData);
        if (result.success) {
          toast.success('Toptancı oluşturuldu');
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

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`"${supplier.name}" pasife alınacak. Devam edilsin mi?`)) {
      return;
    }

    const result = await deleteSupplier(supplier.id);
    if (result.success) {
      toast.success('Toptancı pasife alındı');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleActivate = async (supplier: Supplier) => {
    const result = await activateSupplier(supplier.id);
    if (result.success) {
      toast.success('Toptancı aktifleştirildi');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Firma Adı',
      render: (s: Supplier) => (
        <div>
          <p className="font-medium">{s.name}</p>
          {s.contactName && <p className="text-sm text-gray-500">{s.contactName}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'İletişim',
      render: (s: Supplier) => (
        <div className="text-sm">
          {s.phone && <p>{s.phone}</p>}
          {s.email && <p className="text-gray-500">{s.email}</p>}
        </div>
      ),
    },
    {
      key: 'taxNo',
      header: 'Vergi No',
      render: (s: Supplier) => s.taxNo || '-',
    },
    {
      key: 'purchaseCount',
      header: 'Alım Sayısı',
      render: (s: Supplier) => `${s._count.materialPurchases} alım`,
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: (s: Supplier) => (
        <Badge className={s.isActive ? ACTIVE_STATUS_COLORS.true : ACTIVE_STATUS_COLORS.false}>
          {s.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (s: Supplier) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(s)}>
            Düzenle
          </Button>
          {s.isActive ? (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(s)}>
              Pasife Al
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => handleActivate(s)}>
              Aktifleştir
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Toplam {filteredSuppliers.length} toptancı
          </p>
        </div>
        <Button onClick={openCreateDrawer}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Toptancı
        </Button>
      </div>

      {/* Filters */}
      <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="Firma, yetkili veya telefon ara...">
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
        data={filteredSuppliers}
        keyExtractor={(s) => s.id}
        emptyMessage="Henüz toptancı eklenmemiş"
      />

      {/* Drawer Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingSupplier ? 'Toptancı Düzenle' : 'Yeni Toptancı'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Firma Adı"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Yetkili Adı"
            value={formData.contactName}
            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Telefon"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0532 123 45 67"
            />
            <Input
              label="E-posta"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Vergi No"
            value={formData.taxNo}
            onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
          />

          <TextArea
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <TextArea
            label="Notlar"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          {editingSupplier && (
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
              {isLoading ? 'Kaydediliyor...' : editingSupplier ? 'Güncelle' : 'Oluştur'}
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
