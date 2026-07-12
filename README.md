# Azur Metal CRM

Metal sektörüne özel **iş emri, proje, finans ve operasyon yönetim sistemi**. Teklif aşamasından tahsilata, işçilik yevmiyesinden malzeme alımına kadar bir metal atölyesinin tüm iş akışını tek panelden yönetir.

Varsayılan giriş: `admin` / `Admin123!`

---

## Modüller

### 📊 Dashboard (`/admin`)
- KPI kartları: toplam iş emri, aktif işler, tahsilat, bekleyen alacak
- Geciken ve yaklaşan ödeme planları
- Son aktiviteler (audit log akışı)

### 📋 İş Emirleri (`/admin/is-emirleri`)
- Müşteri/firma bilgileri, **serbest metin iş tipi** (Korkuluk, Merdiven, Kaynak vb. elle yazılır), durum ve öncelik yönetimi
- Durumlar: Yeni → Teklif Hazırlanıyor → Teklif Gönderildi → Onaylandı → Sözleşme → Uygulama → Tamamlandı / İptal
- Detay sekmeleri: Genel, Teklifler, Sözleşmeler, Ödemeler, İşçilik, Malzeme Alımları, Siparişler, Ekstre (Ledger), Audit
- Kalemli teklif oluşturma (KDV hesaplı), sözleşme imza takibi
- Liste ve detay için **PDF rapor** çıktısı

### 🏗️ Projeler (`/admin/projeler`)
- İş emirlerinin proje odaklı görünümü: ilerleme çubuğu, kârlılık rozeti, çalışan avatarları
- Detay sekmeleri: Genel, Çalışanlar, Malzemeler, Giderler, Tahsilatlar, Kâr Analizi, Dosyalar, Aktivite
- Sağ panelden hızlı kayıt: İşçilik, Malzeme Alımı, Gider, Tahsilat
- **Gider kaydı serbest metin**: yakıt, yemek, nakliye vb. açıklamaya yazılır (hazır kategori listesi yok)
- Otomatik maliyet toplama: işçilik + malzeme + diğer giderler → net kâr
- Proje listesi ve proje detayı için **PDF rapor** (işçilik/malzeme/gider/tahsilat dökümleriyle)

### 👷 Personel — Usta & İşçi (`/admin/tanimlamalar/ustalar`)
- Usta / İşçi rolleri, telefon, **yevmiye ücreti** tanımı
- **Gün bazlı işçilik**: kayıtlar Yarım Gün / Tam Gün / 1,5 Gün / 2 Gün olarak girilir; tutar = gün × yevmiye (çalışan seçilince yevmiye otomatik dolar)
- **Yoklama (puantaj) sistemi**: aylık takvim üzerinde tam/yarım gün işaretleme, gece mesaisi/ekstra ücret, ay bazlı filtreleme
- **Personel ödemeleri & bakiye**: hakediş − ödenen = bakiye (Borçlu / Kapandı / Avans Aldı); tek tıkla kalan bakiye kadar **Hızlı Ödeme**
- Personel raporu: aylık yoklama + ödemeler + bakiye **PDF çıktısı**

### 🏪 Toptancılar (`/admin/tanimlamalar/toptancilar`)
- Firma, yetkili, vergi no, iletişim bilgileri
- Detayda alım geçmişi; proje, müşteri ve tarih aralığına göre filtreleme
- Proje ve müşteri bazlı harcama kırılımı, aylık toplam
- Liste ve detay için **PDF rapor**

### 📦 Malzemeler (`/admin/tanimlamalar/malzemeler`)
- Malzeme kataloğu: birim (adet, kg, mt, m², litre...) ve varsayılan KDV oranı
- Katalogdan seçerek veya serbest adla malzeme alımı kaydı
- Liste için **PDF rapor**

### 🖨️ Raporlama
Her ana sayfada sağ üstte **"Rapor Al"** butonu bulunur. Şirket başlıklı, tarihli, tablolu A4 rapor tarayıcının yazdırma penceresinde açılır — yazıcıya gönderilebilir veya PDF olarak kaydedilebilir.

---

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router, Server Actions) |
| Dil | TypeScript |
| Veritabanı | SQLite (lokal) / **Turso — libSQL** (uzak), Prisma ORM |
| Kimlik Doğrulama | NextAuth.js (kullanıcı adı + şifre, bcrypt) |
| Stil | Tailwind CSS |
| Validasyon | Zod |
| Bildirimler | react-hot-toast |

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını hazırla
# DATABASE_URL="file:./dev.db"          → lokal SQLite
# TURSO_DATABASE_URL + TURSO_AUTH_TOKEN → tanımlıysa uzak Turso veritabanı kullanılır
# NEXTAUTH_URL="http://localhost:3000"
# NEXTAUTH_SECRET="..."

# Veritabanını hazırla ve demo veriyi yükle
npm run db:migrate
npm run db:seed

# Geliştirme sunucusunu başlat
npm run dev
```

> **Not:** `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` tanımlıysa uygulama lokal dosya yerine Turso'ya bağlanır ([src/lib/prisma.ts](src/lib/prisma.ts)). Prisma migration'ları Turso'ya otomatik uygulanmaz — şema değişikliklerini `npx tsx --env-file=.env scripts/turso-migrate.ts` ile aktarın.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Production sunucusu |
| `npm run db:migrate` | Lokal veritabanı migration |
| `npm run db:seed` | Demo veri yükleme |
| `npm run db:studio` | Prisma Studio (DB arayüzü) |
| `npx tsx --env-file=.env scripts/turso-migrate.ts` | Turso şema senkronizasyonu |

## Veritabanı Modelleri

| Model | Açıklama |
|-------|----------|
| `AdminUser` | Panel kullanıcıları |
| `BusinessJob` | İş emri / proje (müşteri, iş tipi, durum, maliyet toplamları) |
| `Offer` / `OfferItem` | Teklifler ve kalemleri (KDV hesaplı) |
| `Contract` | Sözleşmeler ve imza durumu |
| `Payment` | Tahsilat ve gider kayıtları (gider türü açıklamada serbest metin) |
| `PaymentPlan` | Vadeli ödeme planı (Bekliyor / Ödendi / Gecikti) |
| `Order` / `OrderItem` | Tedarikçi siparişleri |
| `Worker` | Usta/İşçi (rol, **yevmiye ücreti**) |
| `WorkEntry` | İşçilik kaydı — **gün bazlı** (`hours` alanı gün, `hourlyRate` alanı yevmiye tutar) |
| `Attendance` | Yoklama/puantaj (tam gün / yarım gün + ekstra ücret) |
| `WorkerPayment` | Personel ödemeleri (bakiye takibi) |
| `Supplier` | Toptancılar |
| `Material` | Malzeme kataloğu |
| `MaterialPurchase` | Malzeme alımları (katalog veya serbest ad) |
| `FileAsset` | İş emrine bağlı dosyalar |
| `AuditLog` | Tüm işlemlerin denetim kaydı |
| `Master` / `WorkLog` | Eski usta/işçilik modelleri (geriye uyumluluk) |

## Proje Yapısı

```
src/
├── app/
│   ├── actions/            # Server actions (CRUD + iş mantığı)
│   │   ├── business-jobs.ts, work-entries.ts, workers.ts
│   │   ├── attendance.ts, worker-payments.ts
│   │   └── suppliers.ts, materials.ts, material-purchases.ts
│   ├── admin/
│   │   ├── page.tsx        # Dashboard
│   │   ├── is-emirleri/    # İş emirleri (liste, detay sekmeleri, düzenleme)
│   │   ├── projeler/       # Projeler (liste, detay sekmeleri, drawer formları)
│   │   ├── tanimlamalar/   # Ustalar (+yoklama), Toptancılar, Malzemeler
│   │   └── ustalar/        # Usta hakediş detayı
│   └── login/              # Giriş sayfası
├── components/             # UI bileşenleri (DataTable, Drawer, FilterBar...)
├── lib/
│   ├── prisma.ts           # Prisma client (Turso adaptörlü)
│   ├── auth.ts             # NextAuth yapılandırması
│   ├── pdf-export.ts       # PDF rapor motoru (tüm "Rapor Al" butonları)
│   ├── validations.ts      # Zod şemaları
│   └── constants.ts        # Durum/etiket sabitleri
prisma/
├── schema.prisma           # Veritabanı şeması
├── seed.ts                 # Demo veri
└── migrations/             # Migration dosyaları
scripts/
└── turso-migrate.ts        # Turso şema senkronizasyon script'i
```

## Lisans

Bu proje özel kullanım içindir. © Azur Metal — 2026
