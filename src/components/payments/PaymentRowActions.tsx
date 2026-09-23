'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { PAYMENT_METHOD_LABELS, PAYMENT_PARTY_LABELS } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { deletePayment, updatePayment } from '@/app/actions/business-jobs';

interface PaymentRecord {
  id: string;
  tip: string;
  taraf: string;
  tutar: number;
  tarih: string | Date;
  odemeYontemi: string;
  aciklama?: string | null;
}

function toDateInput(value: string | Date) {
  const d = new Date(value);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
}

// Tahsilat / gider satırı için Düzenle + Sil butonları
export function PaymentRowActions({ payment }: { payment: PaymentRecord }) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    taraf: payment.taraf,
    tutar: String(payment.tutar),
    tarih: toDateInput(payment.tarih),
    odemeYontemi: payment.odemeYontemi,
    aciklama: payment.aciklama || '',
  });

  const isExpense = payment.tip === 'Gider';

  const openEdit = () => {
    setForm({
      taraf: payment.taraf,
      tutar: String(payment.tutar),
      tarih: toDateInput(payment.tarih),
      odemeYontemi: payment.odemeYontemi,
      aciklama: payment.aciklama || '',
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tutar = parseFloat(form.tutar);
    if (!Number.isFinite(tutar) || tutar <= 0) {
      toast.error('Geçerli bir tutar girin');
      return;
    }
    if (isExpense && !form.aciklama.trim()) {
      toast.error('Lütfen açıklama girin');
      return;
    }

    setIsSaving(true);
    const result = await updatePayment(payment.id, {
      taraf: form.taraf,
      tutar,
      tarih: new Date(form.tarih),
      odemeYontemi: form.odemeYontemi,
      aciklama: form.aciklama.trim() || null,
    });
    setIsSaving(false);

    if (result.success) {
      toast.success(`${payment.tip} güncellendi`);
      setIsEditOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    const result = await deletePayment(payment.id);
    if (result.success) {
      toast.success(`${payment.tip} silindi`);
      setIsDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={openEdit}
          className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
        >
          Düzenle
        </button>
        <button
          type="button"
          onClick={() => setIsDeleteOpen(true)}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Sil
        </button>
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`${payment.tip} Düzenle`} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Tutar (₺)"
            type="number"
            step="0.01"
            min="0"
            value={form.tutar}
            onChange={(e) => setForm({ ...form, tutar: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tarih"
              type="date"
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
            />
            <Select
              label="Ödeme Yöntemi"
              options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label }))}
              value={form.odemeYontemi}
              onChange={(e) => setForm({ ...form, odemeYontemi: e.target.value })}
            />
          </div>
          {isExpense && (
            <Select
              label="Taraf"
              options={Object.entries(PAYMENT_PARTY_LABELS).map(([value, label]) => ({ value, label }))}
              value={form.taraf}
              onChange={(e) => setForm({ ...form, taraf: e.target.value })}
            />
          )}
          <TextArea
            label={isExpense ? 'Açıklama *' : 'Açıklama'}
            rows={3}
            value={form.aciklama}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, aciklama: e.target.value })}
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsEditOpen(false)}>
              Vazgeç
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`${payment.tip} Kaydını Sil`}
        description={`${formatDate(payment.tarih)} tarihli ${formatCurrency(payment.tutar)} tutarındaki ${payment.tip.toLowerCase()} kaydı silinecek.${payment.aciklama ? ` (${payment.aciklama})` : ''}`}
      />
    </>
  );
}
