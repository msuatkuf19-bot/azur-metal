# Azur Metal CRM

Metal sektörüne özel iş emri, finansal takip ve operasyon yönetim sistemi.

## Özellikler

- **İş Emirleri** — Oluşturma, durum/öncelik yönetimi, filtreleme, etiketleme
- **Teklif & Sözleşme** — Kalemli teklif, sözleşme imza takibi
- **Finansal Takip** — Ödeme planı, tahsilat/gider, ekstre, kar/zarar analizi
- **İşçilik** — Usta/İşçi tanımları, saat bazlı ücret, otomatik maliyet hesaplama
- **Malzeme & Tedarik** — Toptancı, malzeme kataloğu, alım kayıtları, fatura takibi
- **Dashboard** — KPI kartları, geciken ödemeler, son aktiviteler, audit log

## Teknoloji

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Dil | TypeScript |
| Veritabanı | SQLite / Turso (Prisma ORM) |
| Kimlik Doğrulama | NextAuth.js |
| Stil | Tailwind CSS |
| Validasyon | Zod |

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET değerlerini ayarla

# Veritabanını hazırla ve seed verisi yükle
npm run db:migrate
npm run db:seed

# Geliştirme sunucusunu başlat
npm run dev
```

Varsayılan giriş: `admin` / `Admin123!`

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm start` | Production sunucusu |
| `npm run db:migrate` | Veritabanı migration |
| `npm run db:seed` | Seed verisi yükleme |
| `npm run db:studio` | Prisma Studio (DB GUI) |

## Proje Yapısı

```
src/
├── app/
│   ├── actions/          # Server actions (CRUD işlemleri)
│   ├── admin/            # Admin panel sayfaları
│   │   ├── is-emirleri/  # İş emirleri modülü
│   │   ├── projeler/     # Projeler modülü
│   │   ├── tanimlamalar/ # Tanımlamalar (usta, toptancı, malzeme)
│   │   └── ustalar/      # Usta detay
│   ├── api/              # API routes
│   └── login/            # Giriş sayfası
├── components/           # UI ve form bileşenleri
├── lib/                  # Auth, Prisma, utils, validasyon
└── types/                # TypeScript tip tanımları
prisma/
├── schema.prisma         # Veritabanı şeması
├── seed.ts               # Demo veri
└── migrations/           # Migration dosyaları
```

## Lisans

Bu proje özel kullanım içindir. © Azur Metal CRM — 2026
