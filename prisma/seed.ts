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
      dailyRate: 1000,
      isActive: true,
    },
  });

  const worker2 = await prisma.worker.create({
    data: {
      fullName: 'Mehmet Demir',
      phone: '0536 777 88 99',
      roleType: 'USTA',
      hourlyRateDefault: 300,
      dailyRate: 900,
      isActive: true,
    },
  });

  const worker3 = await prisma.worker.create({
    data: {
      fullName: 'Veli Yılmaz',
      phone: '0537 111 22 33',
      roleType: 'ISCI',
      hourlyRateDefault: 150,
      dailyRate: 700,
      isActive: true,
    },
  });

  const worker4 = await prisma.worker.create({
    data: {
      fullName: 'Hasan Çelik',
      phone: '0538 222 33 44',
      roleType: 'USTA',
      hourlyRateDefault: 400,
      dailyRate: 1300,
      isActive: true,
    },
  });

  const worker5 = await prisma.worker.create({
    data: {
      fullName: 'İbrahim Şahin',
      phone: '0539 555 66 77',
      roleType: 'ISCI',
      hourlyRateDefault: 180,
      dailyRate: 850,
      isActive: true,
    },
  });

  const worker6 = await prisma.worker.create({
    data: {
      fullName: 'Kemal Öztürk',
      phone: '0530 888 99 00',
      roleType: 'ISCI',
      hourlyRateDefault: 160,
      dailyRate: 800,
      isActive: true,
    },
  });

  console.log('✅ Demo çalışanlar oluşturuldu (6 kişi)');

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

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Metal Sanayi Ticaret A.Ş.',
      contactName: 'Selim Koç',
      phone: '0212 444 22 11',
      email: 'satis@metalsanayi.com',
      address: 'Hadımköy, İstanbul',
      taxNo: '9876543210',
      isActive: true,
    },
  });

  const supplier4 = await prisma.supplier.create({
    data: {
      name: 'Doğu Vida ve Bağlantı Elemanları',
      contactName: 'Ramazan Demirtaş',
      phone: '0224 333 22 11',
      email: 'info@doguvida.com',
      address: 'Nilüfer OSB, Bursa',
      isActive: true,
    },
  });

  console.log('✅ Demo toptancılar oluşturuldu (4 firma)');

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

  // ========================================
  // EK MALZEME ALIMLARI (toptancı çeşitliliği için)
  // ========================================
  await prisma.materialPurchase.create({
    data: {
      jobId: job2.id, supplierId: supplier1.id, materialId: material2.id, materialName: 'Bakır Boru 3/4"',
      quantity: 15, unit: 'METRE', unitPrice: 210, vatRate: 20, totalAmount: 3780,
      note: 'FAT-2026-00201', paymentStatus: 'Acik',
    },
  });
  await prisma.materialPurchase.create({
    data: {
      jobId: job3.id, supplierId: supplier1.id, materialId: material3.id, materialName: 'Freon R410A',
      quantity: 3, unit: 'KG', unitPrice: 1250, vatRate: 20, totalAmount: 4500,
      note: 'FAT-2026-00215', paymentStatus: 'Odendi', invoiceNo: 'FAT-2026-00215',
    },
  });
  await prisma.materialPurchase.create({
    data: {
      jobId: job3.id, supplierId: supplier2.id, materialName: 'Elektrik Panosu',
      quantity: 1, unit: 'ADET', unitPrice: 8500, vatRate: 20, totalAmount: 10200,
      note: 'END-2026-0071', paymentStatus: 'Acik',
    },
  });
  await prisma.materialPurchase.create({
    data: {
      jobId: job1.id, supplierId: supplier3.id, materialId: material1.id, materialName: 'Bakır Boru 1/2"',
      quantity: 10, unit: 'METRE', unitPrice: 175, vatRate: 20, totalAmount: 2100,
      invoiceNo: 'MS-2026-0031', paymentStatus: 'Odendi',
    },
  });
  await prisma.materialPurchase.create({
    data: {
      jobId: job2.id, supplierId: supplier3.id, materialId: material5.id, materialName: 'Elektrik Kablosu 2.5mm²',
      quantity: 100, unit: 'METRE', unitPrice: 18, vatRate: 20, totalAmount: 2160,
      invoiceNo: 'MS-2026-0042', paymentStatus: 'Acik',
    },
  });
  await prisma.materialPurchase.create({
    data: {
      jobId: job3.id, supplierId: supplier4.id, materialName: 'M10 Cıvata Seti',
      quantity: 50, unit: 'ADET', unitPrice: 45, vatRate: 20, totalAmount: 2700,
      invoiceNo: 'DV-2026-0112', paymentStatus: 'Acik',
    },
  });

  await prisma.businessJob.update({ where: { id: job1.id }, data: { materialCostTotal: 48300 } }); // 46200 + 2100
  await prisma.businessJob.update({ where: { id: job2.id }, data: { materialCostTotal: 5940 } }); // 3780 + 2160
  await prisma.businessJob.update({ where: { id: job3.id }, data: { materialCostTotal: 17400 } }); // 4500 + 10200 + 2700

  console.log('✅ Ek malzeme alımları oluşturuldu (toptancı çeşitliliği)');

  // ========================================
  // TOPTANCI ÖDEMELERİ
  // ========================================
  await prisma.supplierPayment.create({
    data: { supplierId: supplier1.id, jobId: job1.id, amount: 10000, paymentDate: new Date('2026-07-05'), paymentMethod: 'HavaleEFT', description: 'Kısmi ödeme', createdById: admin.id },
  });
  await prisma.supplierPayment.create({
    data: { supplierId: supplier2.id, jobId: job1.id, amount: 43800, paymentDate: new Date('2026-07-08'), paymentMethod: 'Nakit', description: 'Tüm bakiye kapatıldı', createdById: admin.id },
  });
  await prisma.supplierPayment.create({
    data: { supplierId: supplier3.id, jobId: job1.id, amount: 2100, paymentDate: new Date('2026-07-02'), paymentMethod: 'Nakit', description: 'Kısmi ödeme', createdById: admin.id },
  });

  console.log('✅ Toptancı ödemeleri oluşturuldu (açık ve kapalı bakiye örnekleri)');

  // ========================================
  // PERSONEL YOKLAMA (ATTENDANCE)
  // ========================================
  type AttRow = { workerId: string; jobId: string | null; date: string; type: string; mult: number; rate: number; extraAmount?: number; extraDescription?: string };
  const attendanceRows: AttRow[] = [];

  // Ahmet Kaya — Haziran'da 12 tam gün (dönem kapatılacak), Temmuz'da 10 tam gün (açık dönem)
  for (const d of ['2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09', '2026-06-10', '2026-06-11', '2026-06-12', '2026-06-15', '2026-06-16', '2026-06-17']) {
    attendanceRows.push({ workerId: worker1.id, jobId: job1.id, date: d, type: 'FULL_DAY', mult: 1, rate: 1000 });
  }
  for (const d of ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10', '2026-07-13']) {
    attendanceRows.push({ workerId: worker1.id, jobId: job1.id, date: d, type: 'FULL_DAY', mult: 1, rate: 1000 });
  }

  // Mehmet Demir — karışık gün türleri + ekstra mesai (avans senaryosu)
  attendanceRows.push(
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-01', type: 'FULL_DAY', mult: 1, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-02', type: 'FULL_DAY', mult: 1, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-03', type: 'DAY_2', mult: 2, rate: 900, extraAmount: 300, extraDescription: "Gece 22.00'ye kadar çalıştı - acil montaj" },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-06', type: 'HALF_DAY', mult: 0.5, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-07', type: 'FULL_DAY', mult: 1, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-08', type: 'NONE', mult: 0, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-09', type: 'FULL_DAY', mult: 1, rate: 900 },
    { workerId: worker2.id, jobId: job1.id, date: '2026-07-10', type: 'DAY_1_5', mult: 1.5, rate: 900 },
  );

  // Veli Yılmaz — hafif yoklama, ödeme yok (alacaklı)
  attendanceRows.push(
    { workerId: worker3.id, jobId: job2.id, date: '2026-06-05', type: 'FULL_DAY', mult: 1, rate: 700 },
    { workerId: worker3.id, jobId: job2.id, date: '2026-06-12', type: 'HALF_DAY', mult: 0.5, rate: 700 },
    { workerId: worker3.id, jobId: job2.id, date: '2026-06-19', type: 'FULL_DAY', mult: 1, rate: 700 },
    { workerId: worker3.id, jobId: job2.id, date: '2026-06-26', type: 'FULL_DAY', mult: 1, rate: 700 },
    { workerId: worker3.id, jobId: job2.id, date: '2026-07-03', type: 'FULL_DAY', mult: 1, rate: 700 },
    { workerId: worker3.id, jobId: job2.id, date: '2026-07-10', type: 'HALF_DAY', mult: 0.5, rate: 700 },
  );

  // Hasan Çelik — yoğun 1,5 / 2 gün + ekstralar, ödeme yok (yüksek bakiye)
  attendanceRows.push(
    { workerId: worker4.id, jobId: job3.id, date: '2026-06-08', type: 'DAY_2', mult: 2, rate: 1300, extraAmount: 500, extraDescription: 'Şehir dışı görev - Ankara' },
    { workerId: worker4.id, jobId: job3.id, date: '2026-06-15', type: 'DAY_1_5', mult: 1.5, rate: 1300 },
    { workerId: worker4.id, jobId: job3.id, date: '2026-06-22', type: 'DAY_2', mult: 2, rate: 1300 },
    { workerId: worker4.id, jobId: job3.id, date: '2026-06-29', type: 'FULL_DAY', mult: 1, rate: 1300 },
    { workerId: worker4.id, jobId: job3.id, date: '2026-07-06', type: 'DAY_1_5', mult: 1.5, rate: 1300, extraAmount: 400, extraDescription: 'Kaynak işi uzadı' },
    { workerId: worker4.id, jobId: job3.id, date: '2026-07-13', type: 'FULL_DAY', mult: 1, rate: 1300 },
  );

  // İbrahim Şahin — tam ödenmiş, bakiye sıfır (hesap kapandı senaryosu)
  attendanceRows.push(
    { workerId: worker5.id, jobId: job1.id, date: '2026-06-10', type: 'FULL_DAY', mult: 1, rate: 850 },
    { workerId: worker5.id, jobId: job1.id, date: '2026-06-17', type: 'FULL_DAY', mult: 1, rate: 850 },
    { workerId: worker5.id, jobId: job1.id, date: '2026-06-24', type: 'FULL_DAY', mult: 1, rate: 850 },
    { workerId: worker5.id, jobId: job1.id, date: '2026-07-01', type: 'FULL_DAY', mult: 1, rate: 850 },
  );

  // Kemal Öztürk — yeni başlayan personel, çok az kayıt
  attendanceRows.push(
    { workerId: worker6.id, jobId: job2.id, date: '2026-07-10', type: 'FULL_DAY', mult: 1, rate: 800 },
    { workerId: worker6.id, jobId: job2.id, date: '2026-07-13', type: 'HALF_DAY', mult: 0.5, rate: 800 },
  );

  for (const a of attendanceRows) {
    await prisma.attendance.create({
      data: {
        workerId: a.workerId,
        jobId: a.jobId,
        date: new Date(a.date),
        type: a.type,
        dayMultiplier: a.mult,
        dailyRateSnapshot: a.rate,
        extraAmount: a.extraAmount || 0,
        extraDescription: a.extraDescription,
        createdById: admin.id,
      },
    });
  }

  console.log(`✅ Demo yoklama kayıtları oluşturuldu (${attendanceRows.length} kayıt)`);

  // ========================================
  // PERSONEL ÖDEMELERİ
  // ========================================
  await prisma.workerPayment.create({
    data: { workerId: worker1.id, jobId: job1.id, amount: 12000, date: new Date('2026-06-30'), paymentType: 'HAKEDIS', paymentMethod: 'Nakit', description: 'Haziran dönemi hakediş ödemesi', createdById: admin.id },
  });
  await prisma.workerPayment.create({
    data: { workerId: worker1.id, jobId: job1.id, amount: 5000, date: new Date('2026-07-10'), paymentType: 'HAKEDIS', paymentMethod: 'Nakit', description: 'Temmuz ara ödeme', createdById: admin.id },
  });
  await prisma.workerPayment.create({
    data: { workerId: worker2.id, jobId: job1.id, amount: 9000, date: new Date('2026-07-11'), paymentType: 'AVANS', paymentMethod: 'HavaleEFT', description: 'Avans ödemesi', createdById: admin.id },
  });
  await prisma.workerPayment.create({
    data: { workerId: worker5.id, jobId: job1.id, amount: 3400, date: new Date('2026-07-05'), paymentType: 'HAKEDIS', paymentMethod: 'Nakit', description: 'Haziran-Temmuz hakediş ödemesi', createdById: admin.id },
  });

  console.log('✅ Demo personel ödemeleri oluşturuldu (alacaklı, avans ve kapalı bakiye örnekleri)');

  // ========================================
  // PERSONEL DÖNEM KAPATMA
  // ========================================
  await prisma.workerSettlementPeriod.create({
    data: {
      workerId: worker1.id,
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      workedDays: 12,
      earnedAmount: 12000,
      extraAmount: 0,
      paidAmount: 12000,
      balance: 0,
      status: 'CLOSED',
      notes: 'Haziran dönemi tam ödendi',
      closedAt: new Date('2026-06-30'),
      closedByUserId: admin.id,
    },
  });

  console.log('✅ Demo dönem kapatma kaydı oluşturuldu (Ahmet Kaya — Haziran dönemi)');

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
