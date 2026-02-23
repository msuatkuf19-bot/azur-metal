import { z } from 'zod';

// İş Emri Validasyon
export const businessJobSchema = z.object({
  musteriAdi: z.string().min(1, 'Müşteri adı gerekli'),
  musteriSoyadi: z.string().optional(),
  firmaAdi: z.string().optional(),
  tcKimlikNo: z.string().length(11, 'TC 11 haneli olmalı').optional().or(z.literal('')),
  vergiNo: z.string().optional(),
  telefon: z.string().min(1, 'Telefon gerekli'),
  email: z.string().email('Geçerli email adresi giriniz').optional().or(z.literal('')),
  durum: z.string().default('Yeni'),
  oncelik: z.string().default('Normal'),
  etiketler: z.string().optional(), // JSON string
  notlar: z.string().optional(),
  il: z.string().optional(),
  ilce: z.string().optional(),
  adres: z.string().optional(),
  faturaUnvani: z.string().optional(),
  teslimatAdresi: z.string().optional(),
});

// Teklif Validasyon
export const offerSchema = z.object({
  jobId: z.string(),
  baslik: z.string().min(1, 'Başlık gerekli'),
  paraBirimi: z.enum(['TRY', 'USD', 'EUR']),
  durum: z.enum(['Taslak', 'Gonderildi', 'Kabul', 'Red', 'RevizeIstendi', 'SuresiDoldu']),
  gecerlilikTarihi: z.string().optional(),
  notlar: z.string().optional(),
});

export const offerItemSchema = z.object({
  urunAdi: z.string().min(1, 'Ürün adı gerekli'),
  aciklama: z.string().optional(),
  miktar: z.number().positive('Miktar pozitif olmalı'),
  birim: z.string().min(1, 'Birim gerekli'),
  birimFiyat: z.number().min(0, 'Fiyat 0 veya pozitif olmalı'),
  kdvOrani: z.number().min(0).max(100, 'KDV oranı 0-100 arası olmalı'),
});

// Sözleşme Validasyon
export const contractSchema = z.object({
  jobId: z.string(),
  baslik: z.string().min(1, 'Başlık gerekli'),
  aciklama: z.string().optional(),
  baslangicTarihi: z.string(),
  bitisTarihi: z.string().optional(),
  imzaDurumu: z.enum(['Taslak', 'ImzayaGonderildi', 'Imzalandi', 'Iptal']),
});

// Ödeme Validasyon
export const paymentSchema = z.object({
  jobId: z.string(),
  tip: z.enum(['Tahsilat', 'Gider']),
  taraf: z.enum(['Musteri', 'Usta', 'Tedarikci', 'Diger']),
  tarih: z.string(),
  tutar: z.number().positive('Tutar pozitif olmalı'),
  paraBirimi: z.enum(['TRY', 'USD', 'EUR']),
  odemeYontemi: z.enum(['Nakit', 'HavaleEFT', 'KrediKarti', 'Cek', 'Diger']),
  aciklama: z.string().optional(),
  masterId: z.string().optional(),
});

// Ödeme Planı Validasyon
export const paymentPlanSchema = z.object({
  jobId: z.string(),
  vadeTarihi: z.string(),
  tutar: z.number().positive('Tutar pozitif olmalı'),
  paraBirimi: z.enum(['TRY', 'USD', 'EUR']),
  durum: z.enum(['Bekliyor', 'Odendi', 'Gecikti']),
  aciklama: z.string().optional(),
});

// Sipariş Validasyon
export const orderSchema = z.object({
  jobId: z.string(),
  tedarikciAdi: z.string().min(1, 'Tedarikçi adı gerekli'),
  durum: z.enum(['Taslak', 'SiparisVerildi', 'Kargoda', 'Teslim', 'Iptal']),
  teslimTarihi: z.string().optional(),
  notlar: z.string().optional(),
});

export const orderItemSchema = z.object({
  urunAdi: z.string().min(1, 'Ürün adı gerekli'),
  adet: z.number().positive('Adet pozitif olmalı'),
  birimFiyat: z.number().min(0, 'Fiyat 0 veya pozitif olmalı'),
  linkSku: z.string().optional(),
});

// Usta Validasyon
export const masterSchema = z.object({
  adSoyad: z.string().min(1, 'Ad soyad gerekli'),
  firmaAdi: z.string().optional(),
  telefon: z.string().min(1, 'Telefon gerekli'),
  uzmanlik: z.string().optional(),
  saatlikUcret: z.number().min(0, 'Ücret 0 veya pozitif olmalı'),
  notlar: z.string().optional(),
});

// İşçilik Kaydı Validasyon
export const workLogSchema = z.object({
  jobId: z.string(),
  masterId: z.string(),
  tarih: z.string(),
  baslangicSaati: z.string().optional(),
  bitisSaati: z.string().optional(),
  toplamSaat: z.number().positive('Toplam saat pozitif olmalı'),
  aciklama: z.string().optional(),
  birimUcret: z.number().min(0, 'Ücret 0 veya pozitif olmalı'),
});

// ========================================
// YENİ MODELLER - TANIMLAMALAR
// ========================================

// Çalışan (Worker) Validasyon
export const workerSchema = z.object({
  fullName: z.string().min(1, 'Ad soyad gerekli'),
  phone: z.string().optional(),
  roleType: z.enum(['USTA', 'ISCI']).default('USTA'),
  hourlyRateDefault: z.number().min(0, 'Saat ücreti 0 veya pozitif olmalı').default(0),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Toptancı (Supplier) Validasyon
export const supplierSchema = z.object({
  name: z.string().min(1, 'Firma adı gerekli'),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Geçerli email adresi giriniz').optional().or(z.literal('')),
  address: z.string().optional(),
  taxNo: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Malzeme Kataloğu (Material) Validasyon
export const materialSchema = z.object({
  name: z.string().min(1, 'Malzeme adı gerekli'),
  unit: z.string().min(1, 'Birim gerekli').default('adet'),
  defaultVatRate: z.number().min(0).max(100, 'KDV oranı 0-100 arası olmalı').default(20),
  isActive: z.boolean().default(true),
});

// İşçilik Kaydı (WorkEntry) Validasyon
export const workEntrySchema = z.object({
  jobId: z.string().min(1, 'İş emri seçilmeli'),
  workerId: z.string().min(1, 'Çalışan seçilmeli'),
  date: z.string().min(1, 'Tarih gerekli'),
  hours: z.number().positive('Saat pozitif olmalı').min(0.5, 'En az 0.5 saat olmalı'),
  hourlyRate: z.number().min(0, 'Saat ücreti 0 veya pozitif olmalı'),
  description: z.string().optional(),
});

// Malzeme Alımı (MaterialPurchase) Validasyon
export const materialPurchaseSchema = z.object({
  jobId: z.string().min(1, 'İş emri seçilmeli'),
  supplierId: z.string().min(1, 'Toptancı seçilmeli'),
  materialId: z.string().optional(),
  materialName: z.string().optional(),
  quantity: z.number().positive('Miktar pozitif olmalı'),
  unit: z.string().min(1, 'Birim gerekli').default('adet'),
  unitPrice: z.number().min(0, 'Birim fiyat 0 veya pozitif olmalı'),
  vatRate: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
  purchaseDate: z.string().optional(),
}).refine(
  (data) => data.materialId || data.materialName,
  { message: 'Malzeme seçin veya malzeme adı girin', path: ['materialName'] }
);

// Type exports
export type WorkerInput = z.infer<typeof workerSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type WorkEntryInput = z.infer<typeof workEntrySchema>;
export type MaterialPurchaseInput = z.infer<typeof materialPurchaseSchema>;
