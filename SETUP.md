# Azur Metal CRM - Hızlı Kurulum Rehberi

## 📋 Ön Gereksinimler

- Node.js 18+ ve npm
- PostgreSQL 14+ veritabanı

## 🚀 Adım Adım Kurulum

### 1. Bağımlılıkları Yükle

Terminalde proje klasöründe:

```powershell
npm install
```

### 2. PostgreSQL Veritabanı Oluştur

PostgreSQL'e bağlanın ve veritabanı oluşturun:

```sql
CREATE DATABASE azurmetal;
```

### 3. Environment Dosyasını Düzenle

`.env` dosyasını açın ve DATABASE_URL'i kendi bilgilerinizle güncelleyin:

```env
DATABASE_URL="postgresql://kullanici:sifre@localhost:5432/azurmetal?schema=public"
```

**NEXTAUTH_SECRET için güvenli bir değer oluşturun:**

```powershell
# PowerShell'de:
$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Bu çıktıyı `.env` dosyasındaki NEXTAUTH_SECRET'e yazın.

### 4. Prisma Migration ve Seed

```powershell
# Veritabanı tablolarını oluştur
npx prisma migrate dev --name init

# Örnek verileri yükle (admin kullanıcısı + demo iş emri)
npx prisma db seed
```

### 5. Geliştirme Sunucusunu Başlat

```powershell
npm run dev
```

Tarayıcınızda: http://localhost:3000

### 6. Giriş Yap

- **Kullanıcı Adı:** admin
- **Şifre:** Admin123!

## 🎉 Tamamlandı!

Artık sistemi kullanmaya başlayabilirsiniz!

## 📊 Prisma Studio (Opsiyonel)

Veritabanını görsel olarak yönetmek için:

```powershell
npm run db:studio
```

http://localhost:5555 adresinden erişebilirsiniz.

## ⚠️ Önemli Notlar

1. **Production'da mutlaka:**
   - Güçlü bir NEXTAUTH_SECRET kullanın
   - Admin şifresini değiştirin
   - DATABASE_URL'i production sunucusuna göre ayarlayın

2. **SQLite ile Test (Alternatif):**
   
   Eğer PostgreSQL kurmak istemiyorsanız, geliştirme için SQLite kullanabilirsiniz:
   
   `.env` dosyasında:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
   
   Sonra:
   ```powershell
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

## 🔧 Sorun Giderme

### Prisma Hatası

```powershell
npx prisma generate
npm run dev
```

### Port Zaten Kullanımda

Farklı port kullanmak için:

```powershell
$env:PORT=3001; npm run dev
```

### Migration Hatası

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma db seed
```

## 📝 Sonraki Adımlar

1. Dashboard'u keşfedin
2. Yeni iş emri oluşturun
3. Teklif hazırlayın
4. Ödeme planı ekleyin
5. Usta ekleyin ve işçilik kayıtları girin

Başarılar! 🚀
