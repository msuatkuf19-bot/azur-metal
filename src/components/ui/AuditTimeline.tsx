import { formatDateTime } from '@/lib/utils';
import { Badge } from './Badge';

interface AuditTimelineEntry {
  id: string;
  action: string;
  entity?: string | null;
  entityType?: string | null;
  details?: string | null;
  createdAt: string;
  user: { adSoyad: string };
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: 'Oluşturma', color: 'bg-emerald-100 text-emerald-800' },
  UPDATE: { label: 'Güncelleme', color: 'bg-blue-100 text-blue-800' },
  DELETE: { label: 'Silme', color: 'bg-rose-100 text-rose-800' },
  HARD_DELETE: { label: 'Kalıcı Silme', color: 'bg-rose-200 text-rose-900' },
  UPDATE_STATUS: { label: 'Durum Değişikliği', color: 'bg-purple-100 text-purple-800' },
  ACTIVATE: { label: 'Aktifleştirme', color: 'bg-emerald-100 text-emerald-800' },
  CLOSE_PERIOD: { label: 'Dönem Kapatma', color: 'bg-amber-100 text-amber-800' },
  REOPEN_PERIOD: { label: 'Dönem Yeniden Açma', color: 'bg-amber-100 text-amber-800' },
};

const ENTITY_LABELS: Record<string, string> = {
  BusinessJob: 'İş Emri',
  Offer: 'Teklif',
  Contract: 'Sözleşme',
  Payment: 'Ödeme',
  Order: 'Sipariş',
  Worker: 'Çalışan',
  Supplier: 'Toptancı',
  Material: 'Malzeme',
  WorkEntry: 'İşçilik Kaydı',
  MaterialPurchase: 'Malzeme Alımı',
  WorkLog: 'Usta Kaydı',
  Attendance: 'Yoklama',
  WorkerPayment: 'Personel Ödemesi',
  WorkerSettlementPeriod: 'Dönem Kapatma',
  SupplierPayment: 'Toptancı Ödemesi',
};

export function AuditTimeline({ entries, emptyMessage = 'Henüz aktivite kaydı yok' }: { entries: AuditTimelineEntry[]; emptyMessage?: string }) {
  if (entries.length === 0) {
    return <p className="text-center text-slate-500 py-10">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {entries.map((log) => {
        const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800' };
        const key = log.entity || log.entityType || '';
        const entityLabel = ENTITY_LABELS[key] || key;
        return (
          <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Badge className={actionInfo.color}>{actionInfo.label}</Badge>
              <div className="min-w-0">
                {entityLabel && <span className="text-sm font-medium text-slate-600">{entityLabel}</span>}
                {log.details && <p className="text-sm text-slate-800 mt-1">{log.details}</p>}
                <p className="text-xs text-slate-500 mt-1">{log.user.adSoyad} tarafından</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
