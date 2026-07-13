'use client';

import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  finalWarning?: string;
  confirmLabel?: string;
  finalConfirmLabel?: string;
}

// İki aşamalı silme onayı: önce genel onay, ardından "geri alınamaz" uyarısıyla son onay
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  finalWarning,
  confirmLabel = 'Sil',
  finalConfirmLabel = 'Evet, Kalıcı Olarak Sil',
}: DeleteConfirmDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    setIsLoading(true);
    try {
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={step === 1 ? title : 'Son Onay'} size="sm">
      <div className="space-y-4">
        {step === 1 ? (
          description && <p className="text-sm text-slate-600">{description}</p>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-1">
            <p className="text-sm font-semibold text-red-700">Bu işlem geri alınamaz!</p>
            <p className="text-sm text-red-600">
              {finalWarning || 'Silinen kayıtlar kalıcı olarak kaybolur. Devam etmek istediğinize emin misiniz?'}
            </p>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
            Vazgeç
          </Button>
          <Button type="button" variant="danger" className="flex-1" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Siliniyor...' : step === 1 ? confirmLabel : finalConfirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Modal kullanılamayan yerler (drawer içi vb.) için iki aşamalı native confirm
export function confirmDouble(
  message: string,
  finalMessage = 'Bu işlem geri alınamaz! Silmek istediğinize emin misiniz?'
): boolean {
  return confirm(message) && confirm(finalMessage);
}
