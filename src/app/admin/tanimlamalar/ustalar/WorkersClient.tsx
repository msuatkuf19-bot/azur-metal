'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { Input, TextArea } from '@/components/ui/Input';
import { WorkerBalanceCard } from '@/components/ui/WorkerBalanceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  WORKER_ROLE_LABELS,
  WORKER_ROLE_COLORS,
  ACTIVE_STATUS_COLORS,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_COLORS,
  ATTENDANCE_TYPE_OPTIONS,
  workerBalanceStatus,
  type AttendanceType,
} from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  createWorker,
  updateWorker,
  deleteWorker,
  activateWorker
} from '@/app/actions/workers';
import { createBulkAttendance } from '@/app/actions/attendance';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { exportToPdf, PdfSection } from '@/lib/pdf-export';

interface Worker {
  id: string;
  fullName: string;
  phone: string | null;
  roleType: string;
  hourlyRateDefault: number;
  dailyRate?: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { workEntries: number; attendances?: number };
  balance?: number;
  totalEarned?: number;
  totalPaid?: number;
  monthDays?: number;
  todayType?: string | null;
}

interface WorkersClientProps {
  initialData: Worker[];
  stats?: {
    totalWorkers: number;
    todayCount: number;
    thisMonthEarned: number;
    openDebt: number;
    advanceCount: number;
  };
  activeJobs?: { id: string; label: string }[];
}

export default function WorkersClient({ initialData, stats, activeJobs = [] }: WorkersClientProps) {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>(initialData);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [view, setView] = useState<'table' | 'card'>('card');

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    roleType: 'USTA',
    hourlyRateDefault: 0,
    dailyRate: 0,
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
      dailyRate: 0,
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
      dailyRate: (worker as any).dailyRate || 0,
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
      key: 'dailyRate',
      header: 'Yevmiye',
      render: (w: Worker) => formatCurrency(w.dailyRate || 0),
    },
    {
      key: 'todayType',
      header: 'Bugün',
      render: (w: Worker) => w.todayType
        ? <Badge className={ATTENDANCE_TYPE_COLORS[w.todayType as AttendanceType] || 'bg-gray-100 text-gray-600'}>{ATTENDANCE_TYPE_LABELS[w.todayType as AttendanceType] || w.todayType}</Badge>
        : <span className="text-gray-400 text-sm">—</span>,
    },
    {
      key: 'monthDays',
      header: 'Bu Ay',
      render: (w: Worker) => `${(w.monthDays || 0).toLocaleString('tr-TR')} gün`,
    },
    {
      key: 'balance',
      header: 'Bakiye',
      render: (w: Worker) => {
        const st = workerBalanceStatus(w.balance || 0);
        return (
          <div>
            <p className={`font-semibold ${st.color}`}>{formatCurrency(w.balance || 0)}</p>
            <p className="text-xs text-gray-400">{st.label}</p>
          </div>
        );
      },
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

  const handleExportPdf = () => {
    const sections: PdfSection[] = [
      {
        title: `Çalışan Listesi (${filteredWorkers.length})`,
        type: 'table',
        data: {
          columns: [
            { header: 'Ad Soyad', key: 'ad', bold: true },
            { header: 'Rol', key: 'rol' },
            { header: 'Telefon', key: 'telefon' },
            { header: 'Yevmiye', key: 'yevmiye', align: 'right' as const },
            { header: 'İş Kaydı', key: 'kayit', align: 'right' as const },
            { header: 'Durum', key: 'durum' },
          ],
          rows: filteredWorkers.map((w) => ({
            ad: w.fullName,
            rol: WORKER_ROLE_LABELS[w.roleType as keyof typeof WORKER_ROLE_LABELS] || w.roleType,
            telefon: w.phone || '-',
            yevmiye: formatCurrency((w as any).dailyRate || 0),
            kayit: w._count.workEntries.toString(),
            durum: w.isActive ? 'Aktif' : 'Pasif',
          })),
        },
      },
    ];

    exportToPdf({
      title: 'Çalışan Raporu',
      subtitle: `${filteredWorkers.length} çalışan`,
      sections,
    });
  };

  return (
    <div className="space-y-6">
      {/* Özet kartları */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Toplam Personel', value: stats.totalWorkers.toString() },
            { label: 'Bugün Gelenler', value: stats.todayCount.toString(), accent: 'text-emerald-600' },
            { label: 'Bu Ayki Hakediş', value: formatCurrency(stats.thisMonthEarned) },
            { label: 'Açık Personel Borcu', value: formatCurrency(stats.openDebt), accent: stats.openDebt > 0 ? 'text-rose-600' : undefined },
            { label: 'Avanslı Personel', value: stats.advanceCount.toString(), accent: 'text-blue-600' },
          ].map((c) => (
            <Card key={c.label}>
              <CardBody className="py-3">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className={`text-lg font-bold mt-0.5 ${c.accent || 'text-gray-900'}`}>{c.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Toplam {filteredWorkers.length} çalışan
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              type="button"
              onClick={() => setView('card')}
              className={`px-3 py-2 text-sm ${view === 'card' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Kart
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              Tablo
            </button>
          </div>
          <Button variant="secondary" onClick={() => setIsBulkDrawerOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Toplu Yoklama
          </Button>
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
            Yeni Çalışan
          </Button>
        </div>
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

      {view === 'card' ? (
        filteredWorkers.length === 0 ? (
          <EmptyState title="Henüz çalışan eklenmemiş" actionLabel="Yeni Çalışan" onAction={openCreateDrawer} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkers.map((w) => (
              <WorkerBalanceCard
                key={w.id}
                worker={{ id: w.id, fullName: w.fullName, roleType: w.roleType, dailyRate: w.dailyRate || 0 }}
                monthWorkedDays={w.monthDays}
                earned={w.totalEarned || 0}
                paid={w.totalPaid || 0}
                balance={w.balance || 0}
                isActive={w.isActive}
                onClick={() => router.push(`/admin/tanimlamalar/ustalar/${w.id}`)}
              />
            ))}
          </div>
        )
      ) : (
        <DataTable
          columns={columns}
          data={filteredWorkers}
          keyExtractor={(w) => w.id}
          onRowClick={(w) => router.push(`/admin/tanimlamalar/ustalar/${w.id}`)}
          emptyMessage="Henüz çalışan eklenmemiş"
        />
      )}

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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Saat Ücreti (₺)"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourlyRateDefault}
              onChange={(e) => setFormData({ ...formData, hourlyRateDefault: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Yevmiye (₺)"
              type="number"
              min="0"
              step="0.01"
              value={formData.dailyRate}
              onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
            />
          </div>

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

      {/* Toplu Yoklama Drawer */}
      <BulkAttendanceDrawer
        isOpen={isBulkDrawerOpen}
        onClose={() => setIsBulkDrawerOpen(false)}
        workers={workers.filter((w) => w.isActive)}
        activeJobs={activeJobs}
        onSaved={() => { setIsBulkDrawerOpen(false); router.refresh(); }}
      />
    </div>
  );
}

// ============================================================
// TOPLU YOKLAMA DRAWER
// ============================================================
function BulkAttendanceDrawer({ isOpen, onClose, workers, activeJobs, onSaved }: {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  activeJobs: { id: string; label: string }[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('FULL_DAY');
  const [jobId, setJobId] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === workers.length) setSelected(new Set());
    else setSelected(new Set(workers.map((w) => w.id)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (selected.size === 0) { toast.error('En az bir personel seçin'); return; }

    setIsLoading(true);
    const result = await createBulkAttendance({
      workerIds: Array.from(selected),
      date,
      type: type as any,
      jobId: jobId || null,
      extraAmount: 0,
      note: note || undefined,
    });
    setIsLoading(false);

    if (result.success) {
      toast.success((result as any).message || 'Toplu yoklama kaydedildi');
      setSelected(new Set());
      setNote('');
      onSaved();
    } else {
      toast.error(result.error || 'Hata oluştu');
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Toplu Yoklama" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">Seçilen personellerin tümü için aynı güne yoklama kaydı oluşturulur. Yevmiye, her personelin tanımlı ücreti üzerinden hesaplanır.</p>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Tarih" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Çalışma Türü</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ATTENDANCE_TYPE_OPTIONS.filter((o) => o.value !== 'NONE').map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">İş Emri / Proje</label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Proje seçilmedi</option>
            {activeJobs.map((j) => <option key={j.id} value={j.id}>{j.label}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">Personeller ({selected.size} seçili)</label>
            <button type="button" className="text-xs text-blue-600 hover:underline" onClick={toggleAll}>
              {selected.size === workers.length ? 'Tümünü kaldır' : 'Tümünü seç'}
            </button>
          </div>
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {workers.map((w) => (
              <label key={w.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} className="rounded border-gray-300" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{w.fullName}</p>
                  <p className="text-xs text-gray-400">{WORKER_ROLE_LABELS[w.roleType as keyof typeof WORKER_ROLE_LABELS]} • {formatCurrency(w.dailyRate || 0)}/gün</p>
                </div>
                {w.todayType && (
                  <Badge className={ATTENDANCE_TYPE_COLORS[w.todayType as AttendanceType] || 'bg-gray-100 text-gray-600'}>
                    Bugün: {ATTENDANCE_TYPE_LABELS[w.todayType as AttendanceType] || w.todayType}
                  </Badge>
                )}
              </label>
            ))}
          </div>
        </div>

        <Input label="Not" value={note} onChange={(e) => setNote(e.target.value)} placeholder="İsteğe bağlı ortak not..." />

        <div className="flex space-x-3 pt-4 border-t">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Vazgeç</Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : `${selected.size} Personel İçin Kaydet`}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
