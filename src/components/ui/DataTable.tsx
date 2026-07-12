'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortAccessor?: (item: T) => string | number;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  pageSize?: number;
  mobileCardTitle?: (item: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'Kayıt bulunamadı',
  isLoading = false,
  pageSize,
  mobileCardTitle,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;
    const accessor = col.sortAccessor || ((item: T) => (item as any)[col.key]);
    const sorted = [...data].sort((a, b) => {
      const av = accessor(a);
      const bv = accessor(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return av > bv ? 1 : -1;
    });
    return sortDir === 'asc' ? sorted : sorted.reverse();
  }, [data, sortKey, sortDir, columns]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const pagedData = useMemo(() => {
    if (!pageSize) return sortedData;
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pageSize, page]);

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100 border-b" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b bg-gray-50 odd:bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <EmptyState title={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.className || ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagedData.map((item) => (
              <tr key={keyExtractor(item)} onClick={() => onRowClick?.(item)} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}>
                {columns.map((col) => (
                  <td key={col.key} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${col.className || ''}`}>
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-gray-200">
        {pagedData.map((item) => {
          const visibleCols = columns.filter((c) => !c.hideOnMobile);
          return (
            <div key={keyExtractor(item)} onClick={() => onRowClick?.(item)} className={`p-4 space-y-1.5 ${onRowClick ? 'active:bg-gray-50' : ''}`}>
              {mobileCardTitle && <div className="font-semibold text-gray-900 mb-1">{mobileCardTitle(item)}</div>}
              {visibleCols.map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-500 shrink-0">{col.header}</span>
                  <span className="text-gray-900 text-right truncate">{col.render ? col.render(item) : (item as any)[col.key]}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {pageSize && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">
            Sayfa {page} / {totalPages} • {sortedData.length} kayıt
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Önceki
            </Button>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Sonraki
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
