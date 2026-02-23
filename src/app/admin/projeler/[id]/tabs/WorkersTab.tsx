'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { WORKER_ROLE_LABELS, WORKER_ROLE_COLORS } from '@/lib/constants';

interface WorkersTabProps {
  project: any;
  workerSummary: any[];
}

export default function WorkersTab({ project, workerSummary }: WorkersTabProps) {
  const workEntries = project.workEntries || [];
  const totalHours = workEntries.reduce((sum: number, e: any) => sum + e.hours, 0);
  const totalAmount = workEntries.reduce((sum: number, e: any) => sum + e.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="text-center">
            <p className="text-sm text-blue-600">Toplam Çalışan</p>
            <p className="text-3xl font-bold text-blue-800">{workerSummary.length}</p>
          </CardBody>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardBody className="text-center">
            <p className="text-sm text-purple-600">Toplam Saat</p>
            <p className="text-3xl font-bold text-purple-800">{totalHours.toFixed(1)}</p>
          </CardBody>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardBody className="text-center">
            <p className="text-sm text-emerald-600">Toplam İşçilik</p>
            <p className="text-3xl font-bold text-emerald-800">{formatCurrency(totalAmount)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Worker Summary */}
      {workerSummary.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Usta Bazlı Özet</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kayıt Sayısı</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam Saat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workerSummary.map((item: any) => (
                    <tr key={item.worker.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-600 font-semibold text-sm">
                              {item.worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{item.worker.fullName}</p>
                            {item.worker.phone && (
                              <p className="text-sm text-gray-500">{item.worker.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={WORKER_ROLE_COLORS[item.worker.roleType as keyof typeof WORKER_ROLE_COLORS]}>
                          {WORKER_ROLE_LABELS[item.worker.roleType as keyof typeof WORKER_ROLE_LABELS]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-600">{item.entryCount}</td>
                      <td className="px-6 py-4 text-right font-medium">{item.totalHours.toFixed(1)} saat</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(item.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* All Work Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">İşçilik Kayıtları</h3>
            <span className="text-sm text-gray-500">{workEntries.length} kayıt</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {workEntries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500">Henüz işçilik kaydı yok</p>
              <p className="text-sm text-gray-400 mt-1">Sağ panelden &quot;İşçilik Kaydı&quot; ekleyebilirsiniz</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çalışan</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saat</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saatlik Ücret</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Toplam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workEntries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(entry.date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-primary-600 font-semibold text-xs">
                              {entry.worker.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium">{entry.worker.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">{entry.hours} saat</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(entry.hourlyRate)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">{formatCurrency(entry.totalAmount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{entry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
