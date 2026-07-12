'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from './Badge';

export interface LedgerRow {
  id: string;
  kind: string;
  date: string;
  label: string;
  description: string;
  jobId?: string | null;
  jobName?: string | null;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerTableProps {
  rows: LedgerRow[];
  debitLabel?: string;
  creditLabel?: string;
  extraColumnLabel?: string;
  extraColumnValue?: (row: LedgerRow) => ReactNode;
  kindBadgeClass?: (kind: string) => string;
  emptyMessage?: string;
}

const DEFAULT_KIND_COLOR = (kind: string) => {
  if (kind === 'PAYMENT') return 'bg-orange-100 text-orange-800';
  if (kind === 'SETTLEMENT') return 'bg-amber-100 text-amber-800';
  if (kind === 'PURCHASE') return 'bg-indigo-100 text-indigo-800';
  return 'bg-emerald-100 text-emerald-800';
};

export function LedgerTable({
  rows,
  debitLabel = 'Borç',
  creditLabel = 'Ödeme',
  extraColumnLabel = 'Proje',
  extraColumnValue,
  kindBadgeClass = DEFAULT_KIND_COLOR,
  emptyMessage = 'Hareket bulunamadı',
}: LedgerTableProps) {
  if (rows.length === 0) return <p className="text-center text-slate-500 py-10">{emptyMessage}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">İşlem</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">Açıklama</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase">{extraColumnLabel}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">{debitLabel}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">{creditLabel}</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-slate-500 uppercase">Bakiye</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((l) => (
            <tr key={l.id} className={`hover:bg-slate-50 ${l.kind === 'SETTLEMENT' ? 'bg-amber-50/60' : ''}`}>
              <td className="px-4 py-2.5 whitespace-nowrap">{formatDate(l.date)}</td>
              <td className="px-4 py-2.5">
                <Badge className={kindBadgeClass(l.kind)}>{l.label}</Badge>
              </td>
              <td className="px-4 py-2.5 text-slate-600 max-w-[320px] truncate" title={l.description}>
                {l.description}
              </td>
              <td className="px-4 py-2.5 text-slate-500">
                {extraColumnValue ? (
                  extraColumnValue(l)
                ) : l.jobId ? (
                  <Link href={`/admin/projeler/${l.jobId}`} className="text-blue-600 hover:underline">
                    {l.jobName}
                  </Link>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-emerald-600 font-medium">{l.debit ? formatCurrency(l.debit) : '-'}</td>
              <td className="px-4 py-2.5 text-right text-orange-600 font-medium">{l.credit ? formatCurrency(l.credit) : '-'}</td>
              <td className={`px-4 py-2.5 text-right font-semibold ${l.balance > 0 ? 'text-rose-600' : l.balance < 0 ? 'text-blue-600' : 'text-slate-600'}`}>
                {formatCurrency(l.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
