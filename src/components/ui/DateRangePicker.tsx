'use client';

import { Input } from './Input';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  startLabel?: string;
  endLabel?: string;
  className?: string;
}

export function DateRangePicker({ startDate, endDate, onChange, startLabel = 'Başlangıç', endLabel = 'Bitiş', className = '' }: DateRangePickerProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <Input label={startLabel} type="date" value={startDate} onChange={(e) => onChange({ startDate: e.target.value, endDate })} />
      <Input label={endLabel} type="date" value={endDate} onChange={(e) => onChange({ startDate, endDate: e.target.value })} />
    </div>
  );
}
