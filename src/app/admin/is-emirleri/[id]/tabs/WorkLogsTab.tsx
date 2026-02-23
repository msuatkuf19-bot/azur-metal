'use client';

import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function WorkLogsTab({ job }: any) {
  // Usta bazında gruplama
  const workLogsByMaster = job.workLogs.reduce((acc: any, log: any) => {
    const masterId = log.master.id;
    if (!acc[masterId]) {
      acc[masterId] = {
        master: log.master,
        logs: [],
        totalHours: 0,
        totalAmount: 0,
      };
    }
    acc[masterId].logs.push(log);
    acc[masterId].totalHours += log.toplamSaat;
    acc[masterId].totalAmount += log.toplamTutar;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.keys(workLogsByMaster).length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Henüz işçilik kaydı yok</h3>
            <Button>Yeni İşçilik Kaydı</Button>
          </CardBody>
        </Card>
      ) : (
        Object.values(workLogsByMaster).map((data: any) => (
          <Card key={data.master.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{data.master.adSoyad}</h3>
                  <p className="text-sm text-gray-600">{data.master.uzmanlik}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{formatCurrency(data.totalAmount)}</p>
                  <p className="text-sm text-gray-600">{data.totalHours} saat</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-2">
                {data.logs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{formatDate(log.tarih)}</p>
                      {log.aciklama && <p className="text-sm text-gray-600">{log.aciklama}</p>}
                      <p className="text-sm text-gray-500">
                        {log.toplamSaat} saat × {formatCurrency(log.birimUcret)}/saat
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(log.toplamTutar)}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
