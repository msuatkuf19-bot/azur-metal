// Durum Çevirileri
export const JOB_STATUS_LABELS = {
  Yeni: 'Yeni',
  TeklifHazirlaniyor: 'Teklif Hazırlanıyor',
  TeklifGonderildi: 'Teklif Gönderildi',
  Onaylandi: 'Onaylandı',
  Sozlesme: 'Sözleşme',
  Uygulama: 'Uygulama',
  Tamamlandi: 'Tamamlandı',
  Iptal: 'İptal',
} as const;

export const JOB_PRIORITY_LABELS = {
  Dusuk: 'Düşük',
  Normal: 'Normal',
  Yuksek: 'Yüksek',
  Acil: 'Acil',
} as const;

export const OFFER_STATUS_LABELS = {
  Taslak: 'Taslak',
  Gonderildi: 'Gönderildi',
  Kabul: 'Kabul',
  Red: 'Red',
  RevizeIstendi: 'Revize İstendi',
  SuresiDoldu: 'Süresi Doldu',
} as const;

export const CONTRACT_STATUS_LABELS = {
  Taslak: 'Taslak',
  ImzayaGonderildi: 'İmzaya Gönderildi',
  Imzalandi: 'İmzalandı',
  Iptal: 'İptal',
} as const;

export const PAYMENT_TYPE_LABELS = {
  Tahsilat: 'Tahsilat',
  Gider: 'Gider',
} as const;

export const PAYMENT_PARTY_LABELS = {
  Musteri: 'Müşteri',
  Usta: 'Usta',
  Tedarikci: 'Tedarikçi',
  Diger: 'Diğer',
} as const;

export const PAYMENT_METHOD_LABELS = {
  Nakit: 'Nakit',
  HavaleEFT: 'Havale/EFT',
  KrediKarti: 'Kredi Kartı',
  Cek: 'Çek',
  Diger: 'Diğer',
} as const;

export const PAYMENT_PLAN_STATUS_LABELS = {
  Bekliyor: 'Bekliyor',
  Odendi: 'Ödendi',
  Gecikti: 'Gecikti',
} as const;

export const ORDER_STATUS_LABELS = {
  Taslak: 'Taslak',
  SiparisVerildi: 'Sipariş Verildi',
  Kargoda: 'Kargoda',
  Teslim: 'Teslim',
  Iptal: 'İptal',
} as const;

export const FILE_CATEGORY_LABELS = {
  KimlikVergi: 'Kimlik/Vergi',
  Teklif: 'Teklif',
  Sozlesme: 'Sözleşme',
  Dekont: 'Dekont',
  Fatura: 'Fatura',
  Diger: 'Diğer',
} as const;

export const CURRENCY_LABELS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
} as const;

// Renk Paletleri
export const JOB_STATUS_COLORS = {
  Yeni: 'bg-blue-100 text-blue-800',
  TeklifHazirlaniyor: 'bg-yellow-100 text-yellow-800',
  TeklifGonderildi: 'bg-purple-100 text-purple-800',
  Onaylandi: 'bg-green-100 text-green-800',
  Sozlesme: 'bg-indigo-100 text-indigo-800',
  Uygulama: 'bg-orange-100 text-orange-800',
  Tamamlandi: 'bg-emerald-100 text-emerald-800',
  Iptal: 'bg-red-100 text-red-800',
} as const;

export const JOB_PRIORITY_COLORS = {
  Dusuk: 'bg-gray-100 text-gray-800',
  Normal: 'bg-blue-100 text-blue-800',
  Yuksek: 'bg-orange-100 text-orange-800',
  Acil: 'bg-red-100 text-red-800',
} as const;

// ========================================
// ÇALIŞAN (WORKER) SABİTLERİ
// ========================================
export const WORKER_ROLE_LABELS = {
  USTA: 'Usta',
  ISCI: 'İşçi',
} as const;

export const WORKER_ROLE_COLORS = {
  USTA: 'bg-blue-100 text-blue-800',
  ISCI: 'bg-gray-100 text-gray-800',
} as const;

// ========================================
// BİRİM SABİTLERİ
// ========================================
export const UNIT_LABELS = {
  adet: 'Adet',
  kg: 'Kilogram',
  gr: 'Gram',
  mt: 'Metre',
  m2: 'Metrekare',
  m3: 'Metreküp',
  litre: 'Litre',
  paket: 'Paket',
  kutu: 'Kutu',
  takim: 'Takım',
} as const;

export const UNIT_OPTIONS = Object.entries(UNIT_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ========================================
// KDV ORANLARI
// ========================================
export const VAT_RATE_OPTIONS = [
  { value: 0, label: '%0 (KDV Yok)' },
  { value: 1, label: '%1' },
  { value: 10, label: '%10' },
  { value: 20, label: '%20' },
] as const;

// ========================================
// AKTİFLİK DURUMU
// ========================================
export const ACTIVE_STATUS_LABELS = {
  true: 'Aktif',
  false: 'Pasif',
} as const;

export const ACTIVE_STATUS_COLORS = {
  true: 'bg-green-100 text-green-800',
  false: 'bg-gray-100 text-gray-800',
} as const;

// ========================================
// PROJE DURUMU SABİTLERİ
// ========================================
export const PROJECT_STATUS_LABELS = {
  Aktif: 'Aktif',
  Beklemede: 'Beklemede',
  Tamamlandi: 'Tamamlandı',
  Iptal: 'İptal',
  Arsivlendi: 'Arşivlendi',
} as const;

export const PROJECT_STATUS_COLORS = {
  Aktif: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Beklemede: 'bg-amber-100 text-amber-800 border-amber-200',
  Tamamlandi: 'bg-blue-100 text-blue-800 border-blue-200',
  Iptal: 'bg-red-100 text-red-800 border-red-200',
  Arsivlendi: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

// ========================================
// KARLILIK SABİTLERİ
// ========================================
export const PROFITABILITY_LABELS = {
  positive: 'Kârlı',
  negative: 'Zararlı',
  neutral: 'Nötr',
} as const;

export const PROFITABILITY_COLORS = {
  positive: 'text-emerald-600',
  negative: 'text-red-600',
  neutral: 'text-gray-600',
} as const;

// ========================================
// GİDER KATEGORİLERİ
// ========================================
export const EXPENSE_CATEGORY_LABELS = {
  Yakit: 'Yakıt',
  Nakliye: 'Nakliye',
  Yemek: 'Yemek',
  Konaklama: 'Konaklama',
  Arac: 'Araç Gideri',
  Diger: 'Diğer',
} as const;

export const EXPENSE_CATEGORY_OPTIONS = Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ========================================
// YOKLAMA SABİTLERİ
// ========================================
export const ATTENDANCE_TYPE_LABELS = {
  NONE: 'Gelmedi',
  HALF_DAY: 'Yarım Gün',
  FULL_DAY: 'Tam Gün',
  DAY_1_5: '1,5 Gün',
  DAY_2: '2 Gün',
} as const;

export type AttendanceType = keyof typeof ATTENDANCE_TYPE_LABELS;

export const ATTENDANCE_TYPE_MULTIPLIERS: Record<AttendanceType, number> = {
  NONE: 0,
  HALF_DAY: 0.5,
  FULL_DAY: 1,
  DAY_1_5: 1.5,
  DAY_2: 2,
};

export const ATTENDANCE_TYPE_COLORS = {
  NONE: 'bg-gray-100 text-gray-600',
  HALF_DAY: 'bg-amber-100 text-amber-800',
  FULL_DAY: 'bg-emerald-100 text-emerald-800',
  DAY_1_5: 'bg-blue-100 text-blue-800',
  DAY_2: 'bg-purple-100 text-purple-800',
} as const;

// Takvim hücresi renkleri
export const ATTENDANCE_CALENDAR_COLORS = {
  NONE: 'bg-gray-200 text-gray-500 border-gray-300',
  HALF_DAY: 'bg-amber-400 text-amber-950 border-amber-500',
  FULL_DAY: 'bg-emerald-500 text-white border-emerald-600',
  DAY_1_5: 'bg-blue-500 text-white border-blue-600',
  DAY_2: 'bg-purple-500 text-white border-purple-600',
} as const;

export const ATTENDANCE_TYPE_OPTIONS = (Object.keys(ATTENDANCE_TYPE_LABELS) as AttendanceType[]).map((value) => ({
  value,
  label: ATTENDANCE_TYPE_LABELS[value],
  multiplier: ATTENDANCE_TYPE_MULTIPLIERS[value],
}));

// ========================================
// PERSONEL ÖDEME SABİTLERİ
// ========================================
export const WORKER_PAYMENT_TYPE_LABELS = {
  HAKEDIS: 'Hakediş Ödemesi',
  AVANS: 'Avans',
  EKSTRA_MESAI: 'Ekstra Mesai Ödemesi',
  DUZELTME: 'Düzeltme',
  DIGER: 'Diğer',
} as const;

export const WORKER_PAYMENT_TYPE_COLORS = {
  HAKEDIS: 'bg-emerald-100 text-emerald-800',
  AVANS: 'bg-blue-100 text-blue-800',
  EKSTRA_MESAI: 'bg-purple-100 text-purple-800',
  DUZELTME: 'bg-amber-100 text-amber-800',
  DIGER: 'bg-gray-100 text-gray-800',
} as const;

// ========================================
// DÖNEM (SETTLEMENT) SABİTLERİ
// ========================================
export const SETTLEMENT_STATUS_LABELS = {
  OPEN: 'Açık',
  CLOSED: 'Kapandı',
  PARTIALLY_PAID: 'Kısmi Ödendi',
} as const;

export const SETTLEMENT_STATUS_COLORS = {
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-emerald-100 text-emerald-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
} as const;

// ========================================
// ALIM ÖDEME DURUMU
// ========================================
export const PURCHASE_PAYMENT_STATUS_LABELS = {
  Acik: 'Açık',
  Odendi: 'Ödendi',
} as const;

export const PURCHASE_PAYMENT_STATUS_COLORS = {
  Acik: 'bg-amber-100 text-amber-800',
  Odendi: 'bg-emerald-100 text-emerald-800',
} as const;

// ========================================
// PERSONEL BORÇ DURUMU SABİTLERİ
// ========================================
export const WORKER_BALANCE_STATUS = {
  DEBT: { label: 'Personel Alacaklı', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-500' },
  CLEAR: { label: 'Hesap Kapandı', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-500' },
  ADVANCE: { label: 'Avans Aldı', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-500' },
} as const;

export function workerBalanceStatus(balance: number) {
  if (balance > 0.005) return WORKER_BALANCE_STATUS.DEBT;
  if (balance < -0.005) return WORKER_BALANCE_STATUS.ADVANCE;
  return WORKER_BALANCE_STATUS.CLEAR;
}

// ========================================
// TOPTANCI BORÇ DURUMU SABİTLERİ
// ========================================
export const SUPPLIER_BALANCE_STATUS = {
  DEBT: { label: 'Açık Borç', color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-500' },
  CLEAR: { label: 'Hesap Kapalı', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-500' },
  CREDIT: { label: 'Fazla Ödeme', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-500' },
} as const;

export function supplierBalanceStatus(balance: number) {
  if (balance > 0.005) return SUPPLIER_BALANCE_STATUS.DEBT;
  if (balance < -0.005) return SUPPLIER_BALANCE_STATUS.CREDIT;
  return SUPPLIER_BALANCE_STATUS.CLEAR;
}
