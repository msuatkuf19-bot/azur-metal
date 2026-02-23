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
