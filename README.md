# Azur Metal CRM

Modern, profesyonel iş emri ve işletme kurma süreçleri yönetim sistemi.

## 🚀 Özellikler

### 📋 İş Emri Yönetimi
- Kart ve tablo görünümü ile iş emirleri listeleme
- Gelişmiş filtreleme ve arama
- Durum ve öncelik yönetimi
- Müşteri bilgileri takibi
- Etiket sistemi

### 💰 Finansal Yönetim
- Teklif oluşturma ve kalemli teklif sistemi
- Sözleşme yönetimi ve imza takibi
- Ödeme planı ve takip
- Tahsilat ve gider kayıtları
- Detaylı ekstre görünümü
- Kar/zarar analizi
- **Otomatik maliyet hesaplama** (işçilik + malzeme)

### 👷 İşçilik Takibi (Yeni!)
- Çalışan tanımları (Usta/İşçi ayrımı)
- Saat bazlı ücret yönetimi
- İş başına işçilik kayıtları
- Tarih ve saat filtreleme
- Çalışan bazlı raporlama
- Otomatik işçilik maliyeti hesaplama

### 🛒 Malzeme & Tedarik Yönetimi (Yeni!)
- Toptancı/Tedarikçi tanımları
- Malzeme kataloğu (birim ve KDV oranları)
- İş başına malzeme alım kayıtları
- Fatura no takibi
- Toptancı bazlı harcama analizi
- Otomatik malzeme maliyeti hesaplama

### 📊 Tanımlamalar Modülü (Yeni!)
- **Çalışanlar:** Usta ve işçi kayıtları, saatlik ücret tanımları
- **Toptancılar:** Tedarikçi firma bilgileri, iletişim ve vergi bilgileri
- **Malzemeler:** Malzeme kataloğu, birim ve varsayılan KDV oranları

### 🛠️ Operasyonel Takip
- Sipariş yönetimi
- Usta ve işçilik kayıtları
- Saat bazlı ücret hesaplama
- Usta hakediş ve borç takibi
- Dosya yönetimi

### 📊 Dashboard ve Raporlama
- KPI kartları (aktif işler, tahsilat, gider, kar)
- Geciken ödemeler uyarıları
- Yaklaşan ödemeler listesi
- Son aktiviteler
- Audit log sistemi
- **5 kartlı finansal özet** (toplam maliyet, işçilik, malzeme, tahsilat, sözleşme)

## 🛠️ Teknoloji Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL (Prisma ORM)
- **Authentication:** NextAuth.js
- **UI Components:** Custom React Components
- **Forms:** Zod validation

## 📦 Kurulum

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd azur-metal
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Environment Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve düzenleyin:

```bash
cp .env.example .env
```

`.env` dosyasında şunları ayarlayın:

```env
# PostgreSQL Bağlantısı
DATABASE_URL="postgresql://user:password@localhost:5432/azurmetal"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin Seed
ADMIN_SEED_USERNAME="admin"
ADMIN_SEED_PASSWORD="Admin123!"
```

### 4. Veritabanını Hazırlayın

```bash
# Prisma migration çalıştır
npm run db:migrate

# Seed verilerini yükle (demo admin + örnek iş emri)
npm run db:seed
```

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### 6. Giriş Yapın

Varsayılan giriş bilgileri:
- **Kullanıcı Adı:** admin
- **Şifre:** Admin123!

## 📁 Proje Yapısı

```
azur-metal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data
├── src/
│   ├── app/
│   │   ├── admin/             # Admin paneli sayfaları
│   │   │   ├── is-emirleri/   # İş emirleri modülü
│   │   │   │   └── [id]/tabs/ # İş detay sekmeleri
│   │   │   ├── tanimlamalar/  # Tanımlamalar modülü (YENİ)
│   │   │   │   ├── ustalar/   # Çalışan yönetimi
│   │   │   │   ├── toptancilar/ # Toptancı yönetimi
│   │   │   │   └── malzemeler/  # Malzeme kataloğu
│   │   │   └── ustalar/       # Eski usta yönetimi
│   │   ├── actions/           # Server actions
│   │   │   ├── workers.ts     # Çalışan işlemleri
│   │   │   ├── suppliers.ts   # Toptancı işlemleri
│   │   │   ├── materials.ts   # Malzeme işlemleri
│   │   │   ├── work-entries.ts # İşçilik kayıtları
│   │   │   └── material-purchases.ts # Malzeme alımları
│   │   ├── api/               # API routes
│   │   └── login/             # Login sayfası
│   ├── components/
│   │   ├── ui/                # UI bileşenleri
│   │   │   ├── Drawer.tsx     # Yan panel bileşeni
│   │   │   ├── DataTable.tsx  # Tablo bileşeni
│   │   │   ├── FilterBar.tsx  # Filtre bileşenleri
│   │   │   └── SummaryCards.tsx # Özet kart bileşenleri
│   │   ├── forms/             # Form bileşenleri
│   │   └── layout/            # Layout bileşenleri
│   └── lib/
│       ├── auth.ts            # NextAuth config
│       ├── prisma.ts          # Prisma client
│       ├── validations.ts     # Zod schemas
│       ├── constants.ts       # Sabitler ve labels
│       └── utils.ts           # Yardımcı fonksiyonlar
└── package.json
```

## 🔧 Komutlar

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build

# Production sunucusu
npm start

# Prisma Studio (veritabanı GUI)
npm run db:studio

# Database migration
npm run db:migrate

# Seed data
npm run db:seed
```

## 📱 Kullanım

### İş Emri Oluşturma

1. Dashboard'dan "Yeni İş Emri" butonuna tıklayın
2. İşletme ve müşteri bilgilerini doldurun
3. Durum ve öncelik seçin
4. "Oluştur" butonuna tıklayın

### Teklif Hazırlama

1. İş emri detay sayfasında "Teklifler" sekmesine gidin
2. "Yeni Teklif" butonuna tıklayın
3. Teklif kalemlerini ekleyin
4. Toplamlar otomatik hesaplanır
5. Teklifi kaydedin ve durumunu güncelleyin

### Ödeme Takibi

1. İş emri detayında "Ödemeler" sekmesi
2. Ödeme planı ekleyin (taksitler)
3. Tahsilat kayıtlarını girin
4. Gider kayıtlarını girin
5. Otomatik bakiye hesaplama

### Usta İşçilik Takibi

1. "Ustalar" menüsünden usta ekleyin
2. İş emrinde "Usta/İşçilik" sekmesinden kayıt girin
3. Saat ve ücret bilgilerini girin
4. Hakediş otomatik hesaplanır
5. Usta ödemelerini "Ödemeler" bölümünden yapın

## 🔐 Güvenlik

- ✅ Session-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Protected API routes
- ✅ Middleware authorization
- ✅ SQL injection koruması (Prisma)
- ✅ XSS koruması
- ✅ CSRF koruması (Next.js built-in)

## 🎨 UI/UX Özellikleri

- ✅ Responsive tasarım (mobile-first)
- ✅ Dark mode hazır altyapı
- ✅ Toast bildirimleri
- ✅ Loading states
- ✅ Error handling
- ✅ Empty states
- ✅ Skeleton loaders hazır
- ✅ Modal ve drawer componentleri

## 📊 Veritabanı Modelleri

- **AdminUser:** Sistem yöneticileri
- **BusinessJob:** İş emirleri / İşletmeler
- **Offer / OfferItem:** Teklifler ve kalemleri
- **Contract:** Sözleşmeler
- **Payment:** Ödemeler (tahsilat/gider)
- **PaymentPlan:** Ödeme planları
- **Order / OrderItem:** Siparişler
- **Master:** Ustalar
- **WorkLog:** İşçilik kayıtları
- **FileAsset:** Dosya yönetimi
- **AuditLog:** Aktivite kayıtları

## 🚀 Production Deployment

### Vercel Deployment

```bash
# Vercel CLI ile deploy
npm i -g vercel
vercel

# Environment variables'ı Vercel dashboard'dan ayarlayın
```

### Database

Production için PostgreSQL önerilir:
- Supabase
- Railway
- Neon
- AWS RDS

## 🔄 Gelecek Geliştirmeler

- [ ] PDF export (teklifler, sözleşmeler)
- [ ] E-posta bildirimleri
- [ ] Dosya upload (S3/R2)
- [ ] Excel/CSV export
- [ ] Gelişmiş raporlama
- [ ] Multi-currency support
- [ ] SMS bildirimleri
- [ ] Mobil uygulama
- [ ] API documentation

## 📝 Lisans

Bu proje özel kullanım içindir.

## 👨‍💻 Geliştirici

Azur Metal CRM - 2026

## 🆘 Destek

Sorularınız için:
- Issue açın
- Dokümantasyonu inceleyin
- Admin panelinde tooltips'leri kontrol edin

---

**Not:** İlk kurulumda mutlaka `.env` dosyasını düzenleyin ve güvenli bir `NEXTAUTH_SECRET` oluşturun:

```bash
openssl rand -base64 32
```
