import { formatCurrency } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: number;
  currency?: 'TRY' | 'USD' | 'EUR';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorBySign?: boolean;
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;
  className?: string;
}

const SIZES = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl font-bold',
  xl: 'text-2xl font-bold',
};

export function MoneyDisplay({
  amount,
  currency = 'TRY',
  size = 'md',
  colorBySign = false,
  positiveColor = 'text-emerald-600',
  negativeColor = 'text-rose-600',
  neutralColor = 'text-slate-700',
  className = '',
}: MoneyDisplayProps) {
  const colorClass = colorBySign
    ? amount > 0.005
      ? positiveColor
      : amount < -0.005
      ? negativeColor
      : neutralColor
    : '';
  return <span className={`${SIZES[size]} ${colorClass} ${className}`}>{formatCurrency(amount, currency)}</span>;
}
