# 🚀 Vercel + Turso Deployment Rehberi

Bu rehber, Azur Metal CRM'i Vercel'e deploy etmek için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

- GitHub hesabı
- Vercel hesabı (ücretsiz)
- Turso hesabı (ücretsiz)

---

## 1️⃣ Turso Veritabanı Oluşturma

### 1.1 Turso CLI Kurulumu

**Windows (PowerShell):**
```powershell
irm get.turso.tech/install.ps1 | iex
```

**Mac/Linux:**
```bash
curl -sSfL https://get.turso.tech/install.sh | bash
```

### 1.2 Turso'ya Giriş
```bash
turso auth login
```
Tarayıcı açılacak, GitHub ile giriş yapın.

### 1.3 Veritabanı Oluşturma
```bash
turso db create azurmetal
```

### 1.4 Bağlantı Bilgilerini Alma
```bash
# Database URL
turso db show azurmetal --url

# Auth Token
turso db tokens create azurmetal
```

Bu değerleri not alın, Vercel'de kullanacaksınız.

---

## 2️⃣ GitHub'a Push

Projeyi GitHub'a yükleyin (henüz yapmadıysanız):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/azur-metal-crm.git
git push -u origin main
```

---

## 3️⃣ Vercel Deployment

### 3.1 Vercel'e Giriş
1. [vercel.com](https://vercel.com) adresine gidin
2. "Continue with GitHub" ile giriş yapın

### 3.2 Proje Import
1. "Add New Project" butonuna tıklayın
2. GitHub repo'nuzu seçin
3. "Import" tıklayın

### 3.3 Environment Variables
"Environment Variables" bölümünde şunları ekleyin:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `file:./dev.db` |
| `TURSO_DATABASE_URL` | `libsql://azurmetal-xxx.turso.io` (Turso'dan aldığınız URL) |
| `TURSO_AUTH_TOKEN` | `eyJhbG...` (Turso'dan aldığınız token) |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` (Deploy sonrası güncellenecek) |
| `NEXTAUTH_SECRET` | Güçlü rastgele bir string (aşağıdaki komutu kullanın) |

**NEXTAUTH_SECRET oluşturmak için:**
```bash
openssl rand -base64 32
```
veya [generate-secret.vercel.app](https://generate-secret.vercel.app/32) adresini kullanın.

### 3.4 Deploy
"Deploy" butonuna tıklayın ve bekleyin.

---

## 4️⃣ Veritabanı Migration

Deploy tamamlandıktan sonra, veritabanı tablolarını oluşturmanız gerekiyor.

### Yerel Makineden Turso'ya Migration

```bash
# Prisma client'ı güncelle
npx prisma generate

# Migration SQL dosyasını Turso'ya gönder
turso db shell azurmetal < prisma/migrations/20260112132235_init/migration.sql
turso db shell azurmetal < prisma/migrations/20260130093150_add_workers_suppliers_materials/migration.sql
```

### Admin Kullanıcı Oluşturma

Turso Shell'de çalıştırın:
```bash
turso db shell azurmetal
```

Sonra SQL:
```sql
INSERT INTO AdminUser (id, kullaniciAdi, sifre, adSoyad, aktif, createdAt, updatedAt)
VALUES (
  'admin-001',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin User',
  1,
  datetime('now'),
  datetime('now')
);
```

> ⚠️ Şifre: `password` (bcrypt hash). İlk girişten sonra değiştirin!

---

## 5️⃣ NEXTAUTH_URL Güncelleme

Deploy tamamlandığında Vercel size bir URL verecek (örn: `azur-metal-crm.vercel.app`).

1. Vercel Dashboard > Project > Settings > Environment Variables
2. `NEXTAUTH_URL` değerini `https://your-project.vercel.app` olarak güncelleyin
3. "Redeploy" yapın

---

## 🔧 Özel Domain (Opsiyonel)

1. Vercel Dashboard > Project > Settings > Domains
2. Domain ekleyin (örn: `crm.azurmetal.com`)
3. DNS ayarlarını yapın:
   - CNAME: `cname.vercel-dns.com`
   - veya A: `76.76.19.19`

---

## ✅ Kontrol Listesi

- [ ] Turso veritabanı oluşturuldu
- [ ] GitHub'a push yapıldı
- [ ] Vercel'e deploy edildi
- [ ] Environment variables ayarlandı
- [ ] Migration'lar çalıştırıldı
- [ ] Admin kullanıcı oluşturuldu
- [ ] Login test edildi

---

## 🆘 Sorun Giderme

### "Database connection failed"
- `TURSO_DATABASE_URL` ve `TURSO_AUTH_TOKEN` değerlerini kontrol edin
- Token'ın süresinin dolmadığından emin olun

### "NEXTAUTH_URL mismatch"
- `NEXTAUTH_URL` değerini deploy URL'i ile güncelleyin
- Redeploy yapın

### Migration hatası
- Turso shell'de tabloların var olup olmadığını kontrol edin:
  ```sql
  .tables
  ```

---

## 📞 Destek

Sorun yaşarsanız:
- [Vercel Docs](https://vercel.com/docs)
- [Turso Docs](https://docs.turso.tech)
- [Prisma + Turso Guide](https://www.prisma.io/docs/orm/overview/databases/turso)
