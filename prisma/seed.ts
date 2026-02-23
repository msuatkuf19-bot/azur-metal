import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...');

  // Admin kullanıcı oluştur
  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_SEED_PASSWORD || 'Admin123!',
    10
  );

  const admin = await prisma.adminUser.upsert({
    where: { kullaniciAdi: 'admin' },
    update: {},
    create: {
      kullaniciAdi: 'admin',
      sifre: hashedPassword,
      adSoyad: 'Sistem Yöneticisi',
      email: 'admin@azurmetal.com',
    },
  });

  console.log('✅ Admin kullanıcı oluşturuldu:', admin.kullaniciAdi);

  // Demo iş emri oluştur
  const job1 = await prisma.businessJob.create({
    data: {
      referansKodu: 'JOB-2026-0001',
      musteriAdi: 'Mustafa',
      musteriSoyadi: 'Yılmaz',
      firmaAdi: 'Mustafa Eczanesi',
      durum: 'TeklifHazirlaniyor',
      oncelik: 'Yuksek',
      etiketler: JSON.stringify(['Yeni Müşteri', 'İstanbul']),
      notlar: 'Şişli bölgesinde yeni açılacak eczane. Tam teçhizat kurulum.',
      telefon: '0532 123 45 67',
      email: 'mustafa@eczane.com',
      il: 'İstanbul',
      ilce: 'Şişli',
      adres: 'Halaskargazi Cad. No: 123/A',
      faturaUnvani: 'Mustafa Eczanesi Ltd. Şti.',
    },
  });

  console.log('✅ Demo iş emri oluşturuldu:', job1.referansKodu);

  // Demo teklif oluştur
  const offer1 = await prisma.offer.create({
    data: {
      jobId: job1.id,
      teklifNo: 'TEK-2026-0001',
      baslik: 'Eczane Kurulum Teklifi',
      paraBirimi: 'TRY',
      durum: 'Gonderildi',
      araToplam: 100000,
      kdvToplam: 20000,
      genelToplam: 120000,
      gecerlilikTarihi: new Date('2026-02-15'),
      notlar: 'Tüm fiyatlar KDV hariçtir. Teslimat süresi 30 gündür.',
      items: {
        create: [
          {
            urunAdi: 'Soğuk Hava Deposu',
            aciklama: '2+8 derece, 10m³ hacim',
            miktar: 1,
            birim: 'Adet',
            birimFiyat: 50000,
            kdvOrani: 20,
            tutar: 50000,
          },
          {
            urunAdi: 'Eczane Rafları',
            aciklama: 'Ahşap, 5 adet modüler raf sistemi',
            miktar: 5,
            birim: 'Takım',
            birimFiyat: 10000,
            kdvOrani: 20,
            tutar: 50000,
          },
        ],
      },
    },
  });

  console.log('✅ Demo teklif oluşturuldu:', offer1.teklifNo);

  // Demo usta oluştur
  const master1 = await prisma.master.create({
    data: {
      adSoyad: 'Ahmet Kaya',
      telefon: '0535 444 55 66',
      uzmanlik: 'Soğutma Sistemleri',
      saatlikUcret: 250,
      aktif: true,
    },
  });

  const master2 = await prisma.master.create({
    data: {
      adSoyad: 'Mehmet Demir',
      telefon: '0536 777 88 99',
      uzmanlik: 'Raf & Mobilya Montajı',
      saatlikUcret: 200,
      aktif: true,
    },
  });

  console.log('✅ Demo ustalar oluşturuldu');

  // Demo çalışma kaydı
  const workLog1 = await prisma.workLog.create({
    data: {
      jobId: job1.id,
      masterId: master1.id,
      tarih: new Date('2026-01-10'),
      toplamSaat: 8,
      aciklama: 'Keşif ve ölçüm çalışması yapıldı',
    },
  });

  console.log('✅ Demo çalışma kayıtları oluşturuldu');

  // Yeni Çalışan (Worker) modeli
  const worker1 = await prisma.worker.create({
    data: {
      fullName: 'Ahmet Kaya',
      phone: '0535 444 55 66',
      roleType: 'USTA',
      hourlyRateDefault: 350,
      isActive: true,
    },
  });

  const worker2 = await prisma.worker.create({
    data: {
      fullName: 'Mehmet Demir',
      phone: '0536 777 88 99',
      roleType: 'USTA',
      hourlyRateDefault: 300,
      isActive: true,
    },
  });

  const worker3 = await prisma.worker.create({
    data: {
      fullName: 'Veli Yılmaz',
      phone: '0537 111 22 33',
      roleType: 'ISCI',
      hourlyRateDefault: 150,
      isActive: true,
    },
  });

  console.log('✅ Demo çalışanlar oluşturuldu (3 kişi)');

  // Toptancı (Supplier) modeli
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Soğutma Market AŞ',
      contactName: 'Fatma Öztürk',
      phone: '0212 555 66 77',
      email: 'satis@sogutmamarket.com',
      address: 'İkitelli Organize Sanayi Bölgesi, İstanbul',
      taxNo: '1234567890',
      isActive: true,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Endüstriyel Parça Ltd.',
      contactName: 'Hakan Arslan',
      phone: '0216 888 99 00',
      email: 'info@endparça.com',
      address: 'Dudullu OSB, İstanbul',
      isActive: true,
    },
  });

  console.log('✅ Demo toptancılar oluşturuldu (2 firma)');

  // Malzeme (Material) modeli
  const material1 = await prisma.material.create({
    data: {
      name: 'Bakır Boru 1/2"',
      unit: 'METRE',
      defaultVatRate: 20,
      isActive: true,
    },
  });

  const material2 = await prisma.material.create({
    data: {
      name: 'Bakır Boru 3/4"',
      unit: 'METRE',
      defaultVatRate: 20,
      isActive: true,
    },
  });

  const material3 = await prisma.material.create({
    data: {
      name: 'Freon R410A',
      unit: 'KG',
      defaultVatRate: 20,
      isActive: true,
    },
  });

  const material4 = await prisma.material.create({
    data: {
      name: 'Kompresör (5 HP)',
      unit: 'ADET',
      defaultVatRate: 20,
      isActive: true,
    },
  });

  const material5 = await prisma.material.create({
    data: {
      name: 'Elektrik Kablosu 2.5mm²',
      unit: 'METRE',
      defaultVatRate: 20,
      isActive: true,
    },
  });

  console.log('✅ Demo malzemeler oluşturuldu (5 kalem)');

  // İşçilik kayıtları (WorkEntry)
  await prisma.workEntry.create({
    data: {
      jobId: job1.id,
      workerId: worker1.id,
      date: new Date('2026-01-10'),
      hours: 8,
      hourlyRate: 350,
      totalAmount: 2800,
      description: 'Keşif ve ölçüm çalışması',
    },
  });

  await prisma.workEntry.create({
    data: {
      jobId: job1.id,
      workerId: worker2.id,
      date: new Date('2026-01-11'),
      hours: 10,
      hourlyRate: 300,
      totalAmount: 3000,
      description: 'Soğutma ünitesi montajı',
    },
  });

  await prisma.workEntry.create({
    data: {
      jobId: job1.id,
      workerId: worker3.id,
      date: new Date('2026-01-11'),
      hours: 10,
      hourlyRate: 150,
      totalAmount: 1500,
      description: 'Montaj yardımcı işler',
    },
  });

  console.log('✅ Demo işçilik kayıtları oluşturuldu (3 kayıt)');

  // Malzeme alımları (MaterialPurchase)
  await prisma.materialPurchase.create({
    data: {
      jobId: job1.id,
      supplierId: supplier1.id,
      materialId: material1.id,
      materialName: 'Bakır Boru 1/2"',
      quantity: 25,
      unit: 'METRE',
      unitPrice: 180,
      vatRate: 20,
      totalAmount: 5400,
      note: 'FAT-2026-00125 - Soğutma hattı için',
    },
  });

  await prisma.materialPurchase.create({
    data: {
      jobId: job1.id,
      supplierId: supplier1.id,
      materialId: material3.id,
      materialName: 'Freon R410A',
      quantity: 5,
      unit: 'KG',
      unitPrice: 1200,
      vatRate: 20,
      totalAmount: 7200,
      note: 'FAT-2026-00126',
    },
  });

  await prisma.materialPurchase.create({
    data: {
      jobId: job1.id,
      supplierId: supplier2.id,
      materialId: material4.id,
      materialName: 'Kompresör (5 HP)',
      quantity: 1,
      unit: 'ADET',
      unitPrice: 28000,
      vatRate: 20,
      totalAmount: 33600,
      note: 'END-2026-0058 - Scroll tipi, R410A uyumlu',
    },
  });

  console.log('✅ Demo malzeme alımları oluşturuldu (3 kayıt)');

  // İş emri maliyet toplamlarını güncelle
  await prisma.businessJob.update({
    where: { id: job1.id },
    data: {
      laborCostTotal: 7300, // 2800 + 3000 + 1500
      materialCostTotal: 46200, // 5400 + 7200 + 33600
    },
  });

  console.log('✅ İş emri maliyet toplamları güncellendi');

  // Daha fazla iş emri (liste gösterimi için)
  const job2 = await prisma.businessJob.create({
    data: {
      referansKodu: 'JOB-2026-0002',
      musteriAdi: 'Ayşe',
      musteriSoyadi: 'Kara',
      firmaAdi: 'Elit Restoran',
      durum: 'Yeni',
      oncelik: 'Normal',
      telefon: '0533 999 88 77',
      email: 'ayse@elitrestoran.com',
      il: 'İstanbul',
      ilce: 'Kadıköy',
      notlar: 'Restoran için endüstriyel mutfak soğutma çözümleri',
    },
  });

  const job3 = await prisma.businessJob.create({
    data: {
      referansKodu: 'JOB-2026-0003',
      musteriAdi: 'Ali',
      musteriSoyadi: 'Yıldız',
      firmaAdi: 'Yıldız Gıda AŞ',
      durum: 'Uygulama',
      oncelik: 'Acil',
      telefon: '0532 111 22 33',
      il: 'Ankara',
      ilce: 'Çankaya',
      notlar: 'Soğuk hava deposu genişletme projesi',
    },
  });

  console.log('✅ Toplam 3 demo iş emri oluşturuldu');
  console.log('🎉 Seed işlemi tamamlandı!');
  console.log('');
  console.log('📋 Giriş Bilgileri:');
  console.log('   Kullanıcı Adı: admin');
  console.log('   Şifre: Admin123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed hatası:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
