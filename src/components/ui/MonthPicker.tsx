'use client';

export const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

interface MonthPickerProps {
  month: number; // 0-11
  year: number;
  onChange: (month: number, year: number) => void;
  className?: string;
}

export function MonthPicker({ month, year, onChange, className = '' }: MonthPickerProps) {
  const prev = () => (month === 0 ? onChange(11, year - 1) : onChange(month - 1, year));
  const next = () => (month === 11 ? onChange(0, year + 1) : onChange(month + 1, year));

  return (
    <div className={`flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-2 ${className}`}>
      <button onClick={prev} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Önceki ay" type="button">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="font-semibold text-slate-900">
        {MONTHS[month]} {year}
      </span>
      <button onClick={next} className="p-2 hover:bg-slate-100 rounded-lg" aria-label="Sonraki ay" type="button">
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
