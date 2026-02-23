'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Input, TextArea } from '@/components/ui/Input';
import { 
  WORKER_ROLE_LABELS, 
  WORKER_ROLE_COLORS,
  ACTIVE_STATUS_COLORS 
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  createWorker, 
  updateWorker, 
  deleteWorker, 
  activateWorker 
} from '@/app/actions/workers';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  fullName: string;
  phone: string | null;
  roleType: string;
  hourlyRateDefault: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { workEntries: number };
}

interface WorkersClientProps {
  initialData: Worker[];
}

export default function WorkersClient({ initialData }: WorkersClientProps) {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>(initialData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    roleType: 'USTA',
    hourlyRateDefault: 0,
    notes: '',
    isActive: true,
  });

  const filteredWorkers = workers.filter((w) => {
    if (search && !w.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (roleFilter && w.roleType !== roleFilter) {
      return false;
    }
    if (activeFilter === 'true' && !w.isActive) {
      return false;
    }
    if (activeFilter === 'false' && w.isActive) {
      return false;
    }
    return true;
  });

  const openCreateDrawer = () => {
    setEditingWorker(null);
    setFormData({
      fullName: '',
      phone: '',
      roleType: 'USTA',
      hourlyRateDefault: 0,
      notes: '',
      isActive: true,
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      fullName: worker.fullName,
      phone: worker.phone || '',
      roleType: worker.roleType,
      hourlyRateDefault: worker.hourlyRateDefault,
      notes: worker.notes || '',
      isActive: worker.isActive,
    });
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // roleType'ı doğru tipe cast et
    const submitData = {
      ...formData,
      roleType: formData.roleType as 'USTA' | 'ISCI',
    };

    try {
      if (editingWorker) {
        const result = await updateWorker(editingWorker.id, submitData);
        if (result.success) {
          toast.success('Çalışan güncellendi');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await createWorker(submitData);
        if (result.success) {
          toast.success('Çalışan oluşturuldu');
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

  const handleDelete = async (worker: Worker) => {
    if (!confirm(`"${worker.fullName}" pasife alınacak. Devam edilsin mi?`)) {
      return;
    }

    const result = await deleteWorker(worker.id);
    if (result.success) {
      toast.success('Çalışan pasife alındı');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleActivate = async (worker: Worker) => {
    const result = await activateWorker(worker.id);
    if (result.success) {
      toast.success('Çalışan aktifleştirildi');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Ad Soyad',
      render: (w: Worker) => (
        <div>
          <p className="font-medium">{w.fullName}</p>
          {w.phone && <p className="text-sm text-gray-500">{w.phone}</p>}
        </div>
      ),
    },
    {
      key: 'roleType',
      header: 'Rol',
      render: (w: Worker) => (
        <Badge className={WORKER_ROLE_COLORS[w.roleType as keyof typeof WORKER_ROLE_COLORS]}>
          {WORKER_ROLE_LABELS[w.roleType as keyof typeof WORKER_ROLE_LABELS]}
        </Badge>
      ),
    },
    {
      key: 'hourlyRateDefault',
      header: 'Saat Ücreti',
      render: (w: Worker) => formatCurrency(w.hourlyRateDefault),
    },
    {
      key: 'workCount',
      header: 'İş Kaydı',
      render: (w: Worker) => `${w._count.workEntries} kayıt`,
    },
    {
      key: 'isActive',
      header: 'Durum',
      render: (w: Worker) => (
        <Badge className={w.isActive ? ACTIVE_STATUS_COLORS.true : ACTIVE_STATUS_COLORS.false}>
          {w.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (w: Worker) => (
        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(w)}>
            Düzenle
          </Button>
          {w.isActive ? (
            <Button variant="ghost" size="sm" onClick={() => handleDelete(w)}>
              Pasife Al
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => handleActivate(w)}>
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
            Toplam {filteredWorkers.length} çalışan
          </p>
        </div>
        <Button onClick={openCreateDrawer}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Çalışan
        </Button>
      </div>

      {/* Filters */}
      <FilterBar onSearch={setSearch} searchValue={search} searchPlaceholder="İsim veya telefon ara...">
        <SelectFilter
          label="Rol"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'USTA', label: 'Usta' },
            { value: 'ISCI', label: 'İşçi' },
          ]}
        />
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
        data={filteredWorkers}
        keyExtractor={(w) => w.id}
        onRowClick={(w) => router.push(`/admin/ustalar/${w.id}`)}
        emptyMessage="Henüz çalışan eklenmemiş"
      />

      {/* Drawer Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingWorker ? 'Çalışan Düzenle' : 'Yeni Çalışan'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Soyad"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="0532 123 45 67"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData({ ...formData, roleType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="USTA">Usta</option>
              <option value="ISCI">İşçi</option>
            </select>
          </div>

          <Input
            label="Varsayılan Saat Ücreti (₺)"
            type="number"
            min="0"
            step="0.01"
            value={formData.hourlyRateDefault}
            onChange={(e) => setFormData({ ...formData, hourlyRateDefault: parseFloat(e.target.value) || 0 })}
          />

          <TextArea
            label="Notlar"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Uzmanlık alanları, iletişim notları vb."
          />

          {editingWorker && (
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
              {isLoading ? 'Kaydediliyor...' : editingWorker ? 'Güncelle' : 'Oluştur'}
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
