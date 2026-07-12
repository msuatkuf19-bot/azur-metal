'use client';

import { formatCurrency, formatPhone, formatDate } from '@/lib/utils';
import { Badge } from './Badge';
import { supplierBalanceStatus } from '@/lib/constants';

interface SupplierBalanceCardProps {
  supplier: { id: string; name: string; contactName?: string | null; phone?: string | null };
  thisMonthTotal: number;
  totalPurchases: number;
  openBalance: number;
  lastPurchaseDate?: string | null;
  isActive?: boolean;
  onClick?: () => void;
}

export function SupplierBalanceCard({ supplier, thisMonthTotal, totalPurchases, openBalance, lastPurchaseDate, isActive = true, onClick }: SupplierBalanceCardProps) {
  const status = supplierBalanceStatus(openBalance);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''
      } ${!isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <span className="text-indigo-700 font-bold text-sm">{supplier.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate">{supplier.name}</p>
          <p className="text-xs text-slate-500 truncate">{supplier.contactName || (supplier.phone ? formatPhone(supplier.phone) : '—')}</p>
        </div>
        <Badge className={`${status.bg} ${status.color}`}>{status.label}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
        <div>
          <p className="text-[11px] text-slate-400">Bu Ay</p>
          <p className="text-sm font-semibold text-slate-800">{formatCurrency(thisMonthTotal)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Toplam</p>
          <p className="text-sm font-semibold text-slate-800">{formatCurrency(totalPurchases)}</p>
        </div>
        <div>
          <p className="text-[11px] text-slate-400">Açık Bakiye</p>
          <p className={`text-sm font-bold ${status.color}`}>{formatCurrency(openBalance)}</p>
        </div>
      </div>
      {lastPurchaseDate && <p className="text-[11px] text-slate-400 mt-2">Son alım: {formatDate(lastPurchaseDate)}</p>}
    </div>
  );
}
