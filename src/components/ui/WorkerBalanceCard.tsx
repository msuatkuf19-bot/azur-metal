'use client';

import { formatCurrency } from '@/lib/utils';
import { Badge } from './Badge';
import { workerBalanceStatus, WORKER_ROLE_LABELS } from '@/lib/constants';

interface WorkerBalanceCardProps {
  worker: { id: string; fullName: string; roleType: string; dailyRate: number };
  monthWorkedDays?: number;
  earned: number;
  paid: number;
  balance: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function WorkerBalanceCard({ worker, monthWorkedDays, earned, paid, balance, isActive = true, onClick }: WorkerBalanceCardProps) {
  const status = workerBalanceStatus(balance);
  const initials = worker.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''
      } ${!isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <span className="text-blue-700 font-bold text-sm">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{worker.fullName}</p>
          <p className="text-xs text-slate-500">
            {WORKER_ROLE_LABELS[worker.roleType as keyof typeof WORKER_ROLE_LABELS] || worker.roleType} • {formatCurrency(worker.dailyRate)}/gün
          </p>
        </div>
        <Badge className={`${status.bg} ${status.color}`}>{status.label}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
        <div>
          <p className="text-[11px] text-slate-400">Hakediş</p>
          <p className="text-sm font-semibold text-slate-800">{formatCurrency(earned)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Ödenen</p>
          <p className="text-sm font-semibold text-slate-800">{formatCurrency(paid)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Bakiye</p>
          <p className={`text-sm font-bold ${status.color}`}>{formatCurrency(balance)}</p>
        </div>
      </div>
      {monthWorkedDays !== undefined && <p className="text-[11px] text-slate-400 mt-2">Bu ay {monthWorkedDays.toLocaleString('tr-TR')} gün çalıştı</p>}
    </div>
  );
}
