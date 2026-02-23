'use client';

import { ReactNode } from 'react';
import { Card, CardBody } from './Card';
import { formatCurrency } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function SummaryCard({ 
  title, 
  value, 
  icon, 
  trend,
  color = 'default' 
}: SummaryCardProps) {
  const colorClasses = {
    default: 'text-gray-900',
    success: 'text-emerald-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  const bgClasses = {
    default: 'bg-gray-100',
    success: 'bg-emerald-100',
    warning: 'bg-orange-100',
    danger: 'bg-red-100',
    info: 'bg-blue-100',
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${colorClasses[color]}`}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </p>
            {trend && (
              <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} %{Math.abs(trend.value)}
              </p>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-lg ${bgClasses[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

interface SummaryBarProps {
  items: {
    label: string;
    value: string | number;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  }[];
}

export function SummaryBar({ items }: SummaryBarProps) {
  const colorClasses = {
    default: 'text-gray-900',
    success: 'text-emerald-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-6 md:gap-12">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-sm text-gray-500">{item.label}</span>
            <span className={`text-xl font-bold ${colorClasses[item.color || 'default']}`}>
              {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SummaryGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
}

export function SummaryGrid({ children, columns = 4 }: SummaryGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 mb-6`}>
      {children}
    </div>
  );
}
