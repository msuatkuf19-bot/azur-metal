'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  deleteBusinessJob,
  duplicateBusinessJob,
  getJobDeleteImpact,
  setJobArchived,
} from '@/app/actions/business-jobs';

export interface JobActionTarget {
  id: string;
  referansKodu: string;
  name: string;
  arsivlendi?: boolean;
}

const IMPACT_LABELS: Record<string, string> = {
  workEntries: 'İşçilik kaydı',
  materialPurchases: 'Malzeme alımı',
  payments: 'Tahsilat / gider',
  workLogs: 'Eski usta işçilik kaydı',
  offers: 'Teklif',
  contracts: 'Sözleşme',
  orders: 'Sipariş',
  paymentPlans: 'Ödeme planı',
  files: 'Dosya',
};

// Silinmeyip iş emri bağlantısı kaldırılan kayıtlar
const UNLINK_LABELS: Record<string, string> = {
  attendances: 'Yoklama kaydı',
  workerPayments: 'Personel ödemesi',
  supplierPayments: 'Toptancı ödemesi',
};

export async function duplicateJob(job: JobActionTarget, basePath: string, router: ReturnType<typeof useRouter>) {
  if (!confirm(`"${job.name}" kopyalansın mı?\nMüşteri ve iş bilgileri yeni kayda aktarılır; ödeme, işçilik ve malzeme kayıtları kopyalanmaz.`)) {
    return;
  }
  const result = await duplicateBusinessJob(job.id);
  if (result.success && result.data) {
    toast.success(`Kopya oluşturuldu: ${result.data.referansKodu}`);
    router.push(`${basePath}/${result.data.id}`);
  } else {
    toast.error(result.error || 'Kopyalanamadı');
  }
}

export async function toggleJobArchive(job: JobActionTarget, router: ReturnType<typeof useRouter>) {
  const archive = !job.arsivlendi;
  const message = archive
    ? `"${job.name}" arşivlensin mi?\nKayıtlar silinmez, sadece listelerden gizlenir. Arşiv filtresinden geri alabilirsiniz.`
    : `"${job.name}" arşivden çıkarılsın mı?`;
  if (!confirm(message)) return;

  const result = await setJobArchived(job.id, archive);
  if (result.success) {
    toast.success(archive ? 'Arşivlendi' : 'Arşivden çıkarıldı');
    router.refresh();
  } else {
    toast.error(result.error || 'Bir hata oluştu');
  }
}

interface JobDeleteDialogProps {
  job: JobActionTarget;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onArchived: () => void;
}

// Kalıcı silme: bağlı kayıtları gösterir, mali kayıt varsa arşivlemeyi önerir
// ve silme için referans kodunun yazılmasını ister
export function JobDeleteDialog({ job, isOpen, onClose, onDeleted, onArchived }: JobDeleteDialogProps) {
  const [impact, setImpact] = useState<Record<string, number> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [typedCode, setTypedCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setImpact(null);
    setError(null);
    setStep(1);
    setTypedCode('');
    getJobDeleteImpact(job.id).then((result) => {
      if (result.success) setImpact(result.data);
      else setError(result.error || 'Bağlı kayıtlar okunamadı');
    });
  }, [isOpen, job.id]);

  const financialCount = impact?.financialCount ?? 0;
  const hasFinancial = financialCount > 0;
  const deleteRows = impact ? Object.keys(IMPACT_LABELS).filter((k) => impact[k] > 0) : [];
  const unlinkRows = impact ? Object.keys(UNLINK_LABELS).filter((k) => impact[k] > 0) : [];
  const codeMatches = typedCode.trim().toUpperCase() === job.referansKodu.toUpperCase();

  const handleArchive = async () => {
    setIsBusy(true);
    const result = await setJobArchived(job.id, true);
    setIsBusy(false);
    if (result.success) {
      toast.success('Arşivlendi, hiçbir kayıt silinmedi');
      onArchived();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (!hasFinancial && step === 1) {
      setStep(2);
      return;
    }
    setIsBusy(true);
    const result = await deleteBusinessJob(job.id, { force: hasFinancial });
    setIsBusy(false);
    if (result.success) {
      toast.success('Kalıcı olarak silindi');
      onDeleted();
    } else {
      toast.error(result.error || 'Bir hata oluştu');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kaydı Sil" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{job.name}</span>{' '}
          <span className="text-slate-500">({job.referansKodu})</span>
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {!impact && !error && <p className="text-sm text-slate-500">Bağlı kayıtlar kontrol ediliyor...</p>}

        {impact && (
          <>
            {deleteRows.length > 0 ? (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Birlikte silinecek kayıtlar</p>
                <ul className="space-y-1 text-sm">
                  {deleteRows.map((k) => (
                    <li key={k} className="flex justify-between">
                      <span>{IMPACT_LABELS[k]}</span>
                      <span className="font-semibold">{impact[k]}</span>
                    </li>
                  ))}
                </ul>
                {unlinkRows.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    {unlinkRows.map((k) => `${impact[k]} ${UNLINK_LABELS[k].toLowerCase()}`).join(', ')} silinmez, sadece iş bağlantısı kaldırılır.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Bu kayda bağlı işçilik, malzeme veya ödeme kaydı yok.</p>
            )}

            {hasFinancial && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-2">
                <p className="font-semibold">Önerilen: Arşivle</p>
                <p>
                  Kalıcı silme, bu işe ait işçilik ve malzeme kayıtlarını da siler. Personel hakedişleri ve
                  toptancı borçları buna göre azalır. Arşivlemede hiçbir veri silinmez.
                </p>
                {!job.arsivlendi && (
                  <Button type="button" className="w-full" onClick={handleArchive} disabled={isBusy}>
                    Arşivle (veri korunur)
                  </Button>
                )}
              </div>
            )}

            {hasFinancial ? (
              <div className="space-y-2">
                <label className="block text-sm text-slate-700">
                  Yine de kalıcı silmek için referans kodunu yazın:{' '}
                  <span className="font-mono font-semibold">{job.referansKodu}</span>
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-red-500 focus:outline-none"
                  value={typedCode}
                  onChange={(e) => setTypedCode(e.target.value)}
                  placeholder={job.referansKodu}
                  autoComplete="off"
                />
              </div>
            ) : (
              step === 2 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <p className="font-semibold">Bu işlem geri alınamaz!</p>
                  <p>Kayıt kalıcı olarak silinecek. Emin misiniz?</p>
                </div>
              )
            )}
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isBusy}>
            Vazgeç
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={handleDelete}
            disabled={isBusy || !impact || (hasFinancial && !codeMatches)}
          >
            {isBusy ? 'İşleniyor...' : !hasFinancial && step === 1 ? 'Sil' : 'Kalıcı Olarak Sil'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface JobActionButtonsProps {
  job: JobActionTarget;
  basePath: '/admin/projeler' | '/admin/is-emirleri';
}

// Detay sayfası başlığındaki Kopyala / Arşivle / Sil butonları
export function JobActionButtons({ job, basePath }: JobActionButtonsProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => duplicateJob(job, basePath, router)} title="Kopyala">
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Kopyala
      </Button>
      <Button variant="secondary" onClick={() => toggleJobArchive(job, router)}>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        {job.arsivlendi ? 'Arşivden Çıkar' : 'Arşivle'}
      </Button>
      <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Sil
      </Button>
      <JobDeleteDialog
        job={job}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => {
          setIsDeleteOpen(false);
          router.push(basePath);
          router.refresh();
        }}
        onArchived={() => {
          setIsDeleteOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
