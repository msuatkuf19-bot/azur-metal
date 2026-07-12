'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  sub?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  href?: string;
  onClick?: () => void;
  className?: string;
}

const ACCENT_BORDER = {
  default: 'border-l-slate-300',
  success: 'border-l-success-500',
  warning: 'border-l-warning-500',
  danger: 'border-l-danger-500',
  info: 'border-l-info-500',
};

const ACCENT_ICON_BG = {
  default: 'bg-slate-100 text-slate-600',
  success: 'bg-success-100 text-success-600',
  warning: 'bg-warning-100 text-warning-600',
  danger: 'bg-danger-100 text-danger-600',
  info: 'bg-info-100 text-info-600',
};

export function StatCard({ title, value, sub, icon, trend, accent = 'default', href, onClick, className = '' }: StatCardProps) {
  const clickable = !!(href || onClick);
  const content = (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm border-l-4 ${ACCENT_BORDER[accent]} p-4 transition-all ${
        clickable ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5 truncate">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value > 0 ? 'text-success-600' : trend.value < 0 ? 'text-danger-600' : 'text-slate-400'}`}>
              {trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '–'} %{Math.abs(trend.value).toLocaleString('tr-TR')} {trend.label || ''}
            </p>
          )}
        </div>
        {icon && <div className={`p-2.5 rounded-xl shrink-0 ${ACCENT_ICON_BG[accent]}`}>{icon}</div>}
      </div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
