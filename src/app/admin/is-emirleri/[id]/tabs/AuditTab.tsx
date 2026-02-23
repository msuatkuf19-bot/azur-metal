'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entity: string | null;
  entityId: string | null;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    adSoyad: string;
  };
}

interface AuditTabProps {
  auditLogs: AuditLog[];
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  CREATE: { label: 'Oluşturma', color: 'bg-green-100 text-green-800' },
  UPDATE: { label: 'Güncelleme', color: 'bg-blue-100 text-blue-800' },
  DELETE: { label: 'Silme', color: 'bg-red-100 text-red-800' },
  HARD_DELETE: { label: 'Kalıcı Silme', color: 'bg-red-200 text-red-900' },
  UPDATE_STATUS: { label: 'Durum Değişikliği', color: 'bg-purple-100 text-purple-800' },
  ACTIVATE: { label: 'Aktifleştirme', color: 'bg-emerald-100 text-emerald-800' },
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
};

export default function AuditTab({ auditLogs }: AuditTabProps) {
  if (auditLogs.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz aktivite kaydı yok</h3>
          <p className="text-gray-500">Bu iş emri üzerinde yapılan işlemler burada görünecek</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{auditLogs.length} aktivite kaydı</p>
      
      <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
        {auditLogs.map((log) => {
          const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800' };
          const entityLabel = log.entity 
            ? ENTITY_LABELS[log.entity] || log.entity
            : log.entityType 
              ? ENTITY_LABELS[log.entityType] || log.entityType
              : '';

          return (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <Badge className={actionInfo.color}>
                      {actionInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      {entityLabel && (
                        <span className="text-sm font-medium text-gray-600">
                          {entityLabel}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-sm text-gray-800 mt-1">{log.details}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {log.user.adSoyad} tarafından
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
