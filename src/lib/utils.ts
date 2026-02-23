import { format, parseISO } from 'date-fns';

// Tarih formatlama
export function formatDate(date: Date | string, formatStr: string = 'dd.MM.yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd.MM.yyyy HH:mm');
}

// Para formatlama
export function formatCurrency(amount: number, currency: 'TRY' | 'USD' | 'EUR' = 'TRY'): string {
  const symbols = { TRY: '₺', USD: '$', EUR: '€' };
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbols[currency]}`;
}

// Telefon formatlama
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

// TC Kimlik doğrulama
export function validateTC(tc: string): boolean {
  if (tc.length !== 11) return false;
  const digits = tc.split('').map(Number);
  if (digits[0] === 0) return false;
  
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7;
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = (sum1 - sum2) % 10;
  
  if (digit10 !== digits[9]) return false;
  
  const sum3 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const digit11 = sum3 % 10;
  
  return digit11 === digits[10];
}

// Referans kodu oluşturma
export function generateReferenceCode(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
}

// Dosya boyutu formatlama
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Class name birleştirici
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Yüzde hesaplama
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}
