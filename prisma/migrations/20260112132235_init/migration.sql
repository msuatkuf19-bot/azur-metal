-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kullaniciAdi" TEXT NOT NULL,
    "sifre" TEXT NOT NULL,
    "adSoyad" TEXT NOT NULL,
    "email" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BusinessJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referansKodu" TEXT NOT NULL,
    "musteriAdi" TEXT NOT NULL,
    "musteriSoyadi" TEXT,
    "firmaAdi" TEXT,
    "tcKimlikNo" TEXT,
    "vergiNo" TEXT,
    "telefon" TEXT NOT NULL,
    "email" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Yeni',
    "oncelik" TEXT NOT NULL DEFAULT 'Normal',
    "etiketler" TEXT,
    "notlar" TEXT,
    "il" TEXT,
    "ilce" TEXT,
    "adres" TEXT,
    "faturaUnvani" TEXT,
    "teslimatAdresi" TEXT,
    "olusturmaTarihi" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncellemeTarihi" DATETIME NOT NULL,
    "kapanisTarihi" DATETIME
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "teklifNo" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "paraBirimi" TEXT NOT NULL DEFAULT 'TRY',
    "durum" TEXT NOT NULL DEFAULT 'Taslak',
    "araToplam" REAL NOT NULL DEFAULT 0,
    "kdvToplam" REAL NOT NULL DEFAULT 0,
    "genelToplam" REAL NOT NULL DEFAULT 0,
    "gecerlilikTarihi" DATETIME,
    "notlar" TEXT,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offer_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT NOT NULL,
    "urunAdi" TEXT NOT NULL,
    "aciklama" TEXT,
    "miktar" REAL NOT NULL DEFAULT 1,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "birimFiyat" REAL NOT NULL DEFAULT 0,
    "kdvOrani" REAL NOT NULL DEFAULT 20,
    "tutar" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OfferItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "sozlesmeNo" TEXT NOT NULL,
    "baslik" TEXT NOT NULL,
    "aciklama" TEXT,
    "durum" TEXT NOT NULL DEFAULT 'Taslak',
    "toplamTutar" REAL NOT NULL DEFAULT 0,
    "baslangicTarihi" DATETIME,
    "bitisTarihi" DATETIME,
    "imzaTarihi" DATETIME,
    "pdfUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "taraf" TEXT NOT NULL,
    "tutar" REAL NOT NULL,
    "tarih" DATETIME NOT NULL,
    "odemeYontemi" TEXT NOT NULL,
    "aciklama" TEXT,
    "masterId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "vadeTarihi" DATETIME NOT NULL,
    "tutar" REAL NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'Bekliyor',
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentPlan_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "siparisNo" TEXT NOT NULL,
    "tedarikci" TEXT NOT NULL,
    "durum" TEXT NOT NULL DEFAULT 'Taslak',
    "araToplam" REAL NOT NULL DEFAULT 0,
    "kdvToplam" REAL NOT NULL DEFAULT 0,
    "genelToplam" REAL NOT NULL DEFAULT 0,
    "siparisTarihi" DATETIME,
    "teslimTarihi" DATETIME,
    "notlar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "urunAdi" TEXT NOT NULL,
    "miktar" REAL NOT NULL DEFAULT 1,
    "birim" TEXT NOT NULL DEFAULT 'adet',
    "birimFiyat" REAL NOT NULL DEFAULT 0,
    "tutar" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Master" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adSoyad" TEXT NOT NULL,
    "telefon" TEXT NOT NULL,
    "uzmanlik" TEXT,
    "saatlikUcret" REAL NOT NULL DEFAULT 0,
    "notlar" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "masterId" TEXT NOT NULL,
    "tarih" DATETIME NOT NULL,
    "toplamSaat" REAL NOT NULL,
    "aciklama" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkLog_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "Master" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "dosyaAdi" TEXT NOT NULL,
    "dosyaYolu" TEXT NOT NULL,
    "dosyaBoyutu" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAsset_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "BusinessJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_kullaniciAdi_key" ON "AdminUser"("kullaniciAdi");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessJob_referansKodu_key" ON "BusinessJob"("referansKodu");

-- CreateIndex
CREATE INDEX "BusinessJob_durum_idx" ON "BusinessJob"("durum");

-- CreateIndex
CREATE INDEX "BusinessJob_oncelik_idx" ON "BusinessJob"("oncelik");

-- CreateIndex
CREATE INDEX "BusinessJob_olusturmaTarihi_idx" ON "BusinessJob"("olusturmaTarihi");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_teklifNo_key" ON "Offer"("teklifNo");

-- CreateIndex
CREATE INDEX "Offer_jobId_idx" ON "Offer"("jobId");

-- CreateIndex
CREATE INDEX "Offer_durum_idx" ON "Offer"("durum");

-- CreateIndex
CREATE INDEX "OfferItem_offerId_idx" ON "OfferItem"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_sozlesmeNo_key" ON "Contract"("sozlesmeNo");

-- CreateIndex
CREATE INDEX "Contract_jobId_idx" ON "Contract"("jobId");

-- CreateIndex
CREATE INDEX "Contract_durum_idx" ON "Contract"("durum");

-- CreateIndex
CREATE INDEX "Payment_jobId_idx" ON "Payment"("jobId");

-- CreateIndex
CREATE INDEX "Payment_tip_idx" ON "Payment"("tip");

-- CreateIndex
CREATE INDEX "Payment_tarih_idx" ON "Payment"("tarih");

-- CreateIndex
CREATE INDEX "PaymentPlan_jobId_idx" ON "PaymentPlan"("jobId");

-- CreateIndex
CREATE INDEX "PaymentPlan_vadeTarihi_idx" ON "PaymentPlan"("vadeTarihi");

-- CreateIndex
CREATE INDEX "PaymentPlan_durum_idx" ON "PaymentPlan"("durum");

-- CreateIndex
CREATE UNIQUE INDEX "Order_siparisNo_key" ON "Order"("siparisNo");

-- CreateIndex
CREATE INDEX "Order_jobId_idx" ON "Order"("jobId");

-- CreateIndex
CREATE INDEX "Order_durum_idx" ON "Order"("durum");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "Master_aktif_idx" ON "Master"("aktif");

-- CreateIndex
CREATE INDEX "WorkLog_jobId_idx" ON "WorkLog"("jobId");

-- CreateIndex
CREATE INDEX "WorkLog_masterId_idx" ON "WorkLog"("masterId");

-- CreateIndex
CREATE INDEX "WorkLog_tarih_idx" ON "WorkLog"("tarih");

-- CreateIndex
CREATE INDEX "FileAsset_jobId_idx" ON "FileAsset"("jobId");

-- CreateIndex
CREATE INDEX "FileAsset_kategori_idx" ON "FileAsset"("kategori");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_jobId_idx" ON "AuditLog"("jobId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
