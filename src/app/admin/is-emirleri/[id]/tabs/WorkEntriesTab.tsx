'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Drawer } from '@/components/ui/Drawer';
import { DataTable } from '@/components/ui/DataTable';
import { FilterBar, SelectFilter, DateRangeFilter } from '@/components/ui/FilterBar';
import { SummaryBar } from '@/components/ui/SummaryCards';
import { Input, TextArea } from '@/components/ui/Input';
import { WORKER_ROLE_LABELS, WORKER_ROLE_COLORS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getActiveWorkers } from '@/app/actions/workers';
import { createWorkEntry, updateWorkEntry, deleteWorkEntry } from '@/app/actions/work-entries';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface WorkEntry {
  id: string;
  workerId: string;
  worker: {
    id: string;
    fullName: string;
    roleType: string;
    hourlyRateDefault: number;
  };
  date: string;
  hours: number;
  hourlyRate: number;
  totalAmount: number;
  description: string | null;
}

interface Worker {
  id: string;
  fullName: string;
  roleType: string;
  hourlyRateDefault: number;
}

interface WorkEntriesTabProps {
  job: any;
  workEntries: WorkEntry[];
}

export default function WorkEntriesTab({ job, workEntries: initialEntries }: WorkEntriesTabProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<WorkEntry[]>(initialEntries || []);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [workerFilter, setWorkerFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 1,
    hourlyRate: 0,
    description: '',
  });

  // Load workers for dropdown
  useEffect(() => {
    const loadWorkers = async () => {
      const result = await getActiveWorkers();
      if (result.success) {
        setWorkers(result.data || []);
      }
    };
    loadWorkers();
  }, []);

  // Calculate live total
  const calculatedTotal = formData.hours * formData.hourlyRate;

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (workerFilter && e.workerId !== workerFilter) return false;
    if (roleFilter && e.worker.roleType !== roleFilter) return false;
    if (startDate && new Date(e.date) < new Date(startDate)) return false;
    if (endDate && new Date(e.date) > new Date(endDate)) return false;
    return true;
  });

  // Summary calculations
  const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.totalAmount, 0);

  const openCreateDrawer = () => {
    setEditingEntry(null);
    setFormData({
      workerId: workers[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      hours: 1,
      hourlyRate: workers[0]?.hourlyRateDefault || 0,
      description: '',
    });
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setFormData({
      workerId: entry.workerId,
      date: new Date(entry.date).toISOString().split('T')[0],
      hours: entry.hours,
      hourlyRate: entry.hourlyRate,
      description: entry.description || '',
    });
    setIsDrawerOpen(true);
  };

  const handleWorkerChange = (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId);
    setFormData({
      ...formData,
      workerId,
      hourlyRate: worker?.hourlyRateDefault || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingEntry) {
        const result = await updateWorkEntry(editingEntry.id, formData);
        if (result.success) {
          toast.success('İşçilik kaydı güncellendi');
          router.refresh();
          setIsDrawerOpen(false);
        } else {
          toast.error(result.error || 'Bir hata oluştu');
        }
      } else {
        const result = await createWorkEntry({
          ...formData,
          jobId: job.id,
        });
        if (result.success) {
          toast.success('İşçilik kaydı oluşturuldu');
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

  const handleDelete = async (entry: WorkEntry) => {
    if (!confirm('Bu işçilik kaydını silmek istediğinize emin misiniz?')) {
      return;
    }

    const result = await deleteWorkEntry(entry.id);
    if (result.success) {
      toast.success('İşçilik kaydı silindi');
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const columns = [
    {
      key: 'date',
      header: 'Tarih',
      render: (e: WorkEntry) => formatDate(e.date),
    },
    {
      key: 'worker',
      header: 'Çalışan',
      render: (e: WorkEntry) => (
        <div>
          <p className="font-medium">{e.worker.fullName}</p>
          <Badge className={WORKER_ROLE_COLORS[e.worker.roleType as keyof typeof WORKER_ROLE_COLORS]}>
            {WORKER_ROLE_LABELS[e.worker.roleType as keyof typeof WORKER_ROLE_LABELS]}
          </Badge>
        </div>
      ),
    },
    {
      key: 'hours',
      header: 'Saat',
      render: (e: WorkEntry) => `${e.hours} saat`,
    },
    {
      key: 'hourlyRate',
      header: 'Saat Ücreti',
      render: (e: WorkEntry) => formatCurrency(e.hourlyRate),
    },
    {
      key: 'totalAmount',
      header: 'Tutar',
      render: (e: WorkEntry) => (
        <span className="font-semibold text-emerald-600">
          {formatCurrency(e.totalAmount)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (e: WorkEntry) => (
        <span className="text-gray-500 text-sm truncate max-w-xs block">
          {e.description || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (e: WorkEntry) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditDrawer(e)}>
            Düzenle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(e)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  if (entries.length === 0 && !isDrawerOpen) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz işçilik kaydı yok</h3>
          <p className="text-gray-500 mb-4">Bu iş emrine işçilik kaydı ekleyerek başlayın</p>
          <Button onClick={openCreateDrawer}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni İşçilik Kaydı
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
          { label: 'Toplam Kayıt', value: `${filteredEntries.length} kayıt` },
          { label: 'Toplam Saat', value: `${totalHours.toFixed(1)} saat` },
          { label: 'Toplam Maliyet', value: totalAmount, color: 'warning' },
        ]}
      />

      {/* Actions & Filters */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{filteredEntries.length} kayıt gösteriliyor</p>
        <Button onClick={openCreateDrawer}>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni İşçilik Kaydı
        </Button>
      </div>

      <FilterBar>
        <SelectFilter
          label="Çalışan"
          value={workerFilter}
          onChange={setWorkerFilter}
          options={workers.map((w) => ({ value: w.id, label: w.fullName }))}
        />
        <SelectFilter
          label="Rol"
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'USTA', label: 'Usta' },
            { value: 'ISCI', label: 'İşçi' },
          ]}
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
        data={filteredEntries}
        keyExtractor={(e) => e.id}
        emptyMessage="Filtrelere uygun kayıt bulunamadı"
      />

      {/* Drawer Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingEntry ? 'İşçilik Kaydı Düzenle' : 'Yeni İşçilik Kaydı'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Çalışan <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.workerId}
              onChange={(e) => handleWorkerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Çalışan seçin</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName} ({WORKER_ROLE_LABELS[w.roleType as keyof typeof WORKER_ROLE_LABELS]})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Tarih"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Saat"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) || 0 })}
              required
            />
            <Input
              label="Saat Ücreti (₺)"
              type="number"
              min="0"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          {/* Live total calculation */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Toplam Tutar:</span>
              <span className="text-2xl font-bold text-emerald-600">
                {formatCurrency(calculatedTotal)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formData.hours} saat × {formatCurrency(formData.hourlyRate)}
            </p>
          </div>

          <TextArea
            label="Açıklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Yapılan iş hakkında notlar..."
          />

          <div className="flex space-x-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Kaydediliyor...' : editingEntry ? 'Güncelle' : 'Oluştur'}
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
