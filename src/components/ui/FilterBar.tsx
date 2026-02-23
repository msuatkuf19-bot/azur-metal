'use client';

import { ReactNode } from 'react';
import { Input } from './Input';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  children?: ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  searchValue?: string;
}

export function FilterBar({ 
  children, 
  onSearch, 
  searchPlaceholder = 'Ara...', 
  searchValue = '' 
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        {onSearch && (
          <div className="w-full md:w-64">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full"
            />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

interface SelectFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  includeAll?: boolean;
  allLabel?: string;
}

export function SelectFilter({ 
  label, 
  value, 
  onChange, 
  options, 
  includeAll = true,
  allLabel = 'Tümü'
}: SelectFilterProps) {
  return (
    <div className="w-full md:w-48">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {includeAll && <option value="">{allLabel}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

interface DateRangeFilterProps {
  label?: string;
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateRangeFilter({
  label = 'Tarih Aralığı',
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <span className="text-gray-400 pb-2">-</span>
      <div>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  );
}
