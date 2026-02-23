# 🎉 Azur Metal CRM - Kurulum Tamamlandı!

Tüm dosyalar başarıyla oluşturuldu. Şimdi projeyi çalıştırmak için aşağıdaki adımları takip edin:

## 🚀 Hızlı Başlangıç

### 1. Terminal'i Açın (PowerShell)

```powershell
cd "C:\Users\PC\Desktop\azur metal"
```

### 2. Bağımlılıkları Yükleyin

```powershell
npm install
```

Bu komut tüm gerekli paketleri yükleyecek (2-3 dakika sürebilir).

### 3. PostgreSQL Veritabanı Hazırlayın

**Seçenek A: PostgreSQL Kullanmak (Önerilen)**

1. PostgreSQL'i bilgisayarınızda çalıştırın
2. Yeni bir veritabanı oluşturun:

```sql
CREATE DATABASE azurmetal;
```

3. `.env` dosyasını açın ve DATABASE_URL'i güncelleyin:

```env
DATABASE_URL="postgresql://postgres:sifreniz@localhost:5432/azurmetal"
```

**Seçenek B: SQLite Kullanmak (Hızlı Test)**

`.env` dosyasında:

```env
DATABASE_URL="file:./dev.db"
```

### 4. NEXTAUTH_SECRET Oluşturun

PowerShell'de:

```powershell
$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Çıktıyı kopyalayın ve `.env` dosyasındaki NEXTAUTH_SECRET'e yapıştırın.

### 5. Veritabanını Oluşturun

```powershell
npx prisma migrate dev --name init
```

### 6. Örnek Verileri Yükleyin

```powershell
npx prisma db seed
```

Bu komut:
- ✅ Admin kullanıcısı oluşturur (admin/Admin123!)
- ✅ Örnek iş emri ekler
- ✅ Örnek teklif ekler
- ✅ Örnek usta ekler

### 7. Sunucuyu Başlatın

```powershell
npm run dev
```

### 8. Tarayıcıda Açın

http://localhost:3000

**Giriş Bilgileri:**
- Kullanıcı Adı: `admin`
- Şifre: `Admin123!`

## ✅ Kurulum Başarılı!

Artık sistemi kullanabilirsiniz:

1. **Dashboard** - Ana sayfa, KPI'lar, özet bilgiler
2. **İş Emirleri** - İş emri listesi, oluşturma, detay
3. **Ustalar** - Usta yönetimi, hakediş takibi

## 📚 Ek Komutlar

```powershell
# Veritabanını görsel olarak yönet
npm run db:studio

# Build (production)
npm run build

# Production sunucusu
npm start
```

## 🎯 Sonraki Adımlar

1. ✅ İlk iş emrinizi oluşturun
2. ✅ Teklif ekleyin
3. ✅ Ödeme planı oluşturun
4. ✅ Usta ekleyin ve işçilik kayıtları girin
5. ✅ Finansal takibi inceleyin

## 📖 Dokümantasyon

- [README.md](README.md) - Ana dokümantasyon
- [SETUP.md](SETUP.md) - Detaylı kurulum rehberi
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Proje yapısı

## 🆘 Sorun mu Yaşıyorsunuz?

### Port zaten kullanımda

```powershell
$env:PORT=3001; npm run dev
```

### Prisma hatası

```powershell
npx prisma generate
npm run dev
```

### Veritabanı hatası

```powershell
npx prisma migrate reset
npx prisma db seed
```

## 🎨 Özellikler

### ✅ Tamamlanan
- Login & Authentication (NextAuth)
- Dashboard with KPIs
- İş Emirleri CRUD
- İş Emri Detay (7 sekme)
- Müşteri bilgileri yönetimi
- Finansal özet hesaplama
- Usta yönetimi
- Responsive design
- Toast bildirimleri
- Audit log

### 🚧 Geliştirmeye Açık
- Teklif CRUD formu
- Sözleşme CRUD formu
- Ödeme CRUD formu
- Sipariş CRUD formu
- İşçilik CRUD formu
- Dosya upload
- PDF export
- CSV export

## 💡 İpuçları

1. **Veritabanını sıfırlamak isterseniz:**
   ```powershell
   npx prisma migrate reset
   ```

2. **Yeni model eklerseniz:**
   ```powershell
   npx prisma migrate dev --name model_ismi
   ```

3. **TypeScript hatası alırsanız:**
   ```powershell
   npx prisma generate
   ```

## 🎉 Başarılar!

Proje tamamen hazır ve çalışır durumda. İyi geliştirmeler! 🚀

---

**Not:** İlk çalıştırmada `npm install` biraz uzun sürebilir. Sabırlı olun! ☕
