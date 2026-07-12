import { prisma } from './prisma';

// ========================================
// TOPTANCI CARİ HESAP MOTORU
// Açık bakiye = toplam alım - toplam ödeme
// ========================================

export interface SupplierLedgerEntry {
  id: string;
  sourceId: string;
  kind: 'PURCHASE' | 'PAYMENT';
  date: string;
  label: string;
  description: string;
  jobId: string | null;
  jobName: string | null;
  customerName: string | null;
  debit: number;   // Alım (borcu artırır)
  credit: number;  // Ödeme (borcu azaltır)
  balance: number;
}

function jobDisplayName(job: { firmaAdi: string | null; musteriAdi: string; musteriSoyadi?: string | null } | null | undefined): string | null {
  if (!job) return null;
  return job.firmaAdi || `${job.musteriAdi} ${job.musteriSoyadi || ''}`.trim();
}

export async function getSupplierAccount(supplierId: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return null;

  const jobSelect = { select: { id: true, referansKodu: true, firmaAdi: true, musteriAdi: true, musteriSoyadi: true, isTipi: true } };

  const [purchases, supplierPayments] = await Promise.all([
    prisma.materialPurchase.findMany({
      where: { supplierId },
      include: { job: jobSelect, material: { select: { id: true, name: true } } },
      orderBy: { purchaseDate: 'asc' },
    }),
    prisma.supplierPayment.findMany({
      where: { supplierId },
      include: { job: jobSelect },
      orderBy: { paymentDate: 'asc' },
    }),
  ]);

  // --- Ekstre ---
  type RawEvent = Omit<SupplierLedgerEntry, 'balance'> & { sortDate: number; sortOrder: number };
  const events: RawEvent[] = [];

  for (const p of purchases) {
    const materialName = p.material?.name || p.materialName || 'Malzeme';
    events.push({
      id: `pur-${p.id}`,
      sourceId: p.id,
      kind: 'PURCHASE',
      date: p.purchaseDate.toISOString(),
      label: 'Malzeme Alımı',
      description: `${materialName} — ${p.quantity} ${p.unit} × ${p.unitPrice.toLocaleString('tr-TR')} ₺${p.invoiceNo ? ' • Fatura: ' + p.invoiceNo : ''}`,
      jobId: p.jobId,
      jobName: jobDisplayName(p.job),
      customerName: p.job ? (p.job.firmaAdi || p.job.musteriAdi) : null,
      debit: p.totalAmount,
      credit: 0,
      sortDate: p.purchaseDate.getTime(),
      sortOrder: 0,
    });
  }

  for (const pay of supplierPayments) {
    events.push({
      id: `spay-${pay.id}`,
      sourceId: pay.id,
      kind: 'PAYMENT',
      date: pay.paymentDate.toISOString(),
      label: 'Ödeme',
      description: pay.description || 'Toptancı ödemesi',
      jobId: pay.jobId,
      jobName: jobDisplayName(pay.job),
      customerName: pay.job ? (pay.job.firmaAdi || pay.job.musteriAdi) : null,
      debit: 0,
      credit: pay.amount,
      sortDate: pay.paymentDate.getTime(),
      sortOrder: 1,
    });
  }

  events.sort((x, y) => x.sortDate - y.sortDate || x.sortOrder - y.sortOrder);

  let running = 0;
  const ledger: SupplierLedgerEntry[] = events.map((e) => {
    running += e.debit - e.credit;
    const { sortDate, sortOrder, ...rest } = e;
    return { ...rest, balance: running };
  });

  // --- Toplamlar ---
  const totalPurchases = purchases.reduce((s, p) => s + p.totalAmount, 0);
  const totalPaid = supplierPayments.reduce((s, p) => s + p.amount, 0);
  const openBalance = totalPurchases - totalPaid;
  const totalVat = purchases.reduce((s, p) => {
    if (!p.vatRate) return s;
    return s + (p.totalAmount - p.totalAmount / (1 + p.vatRate / 100));
  }, 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTotal = purchases.filter((p) => p.purchaseDate >= startOfMonth).reduce((s, p) => s + p.totalAmount, 0);

  // --- Müşteri kırılımı ---
  const customerMap = new Map<string, { name: string; total: number; vat: number; purchaseCount: number; jobIds: Set<string>; lastDate: Date | null }>();
  for (const p of purchases) {
    const name = p.job ? (p.job.firmaAdi || p.job.musteriAdi) : 'Bilinmeyen';
    if (!customerMap.has(name)) customerMap.set(name, { name, total: 0, vat: 0, purchaseCount: 0, jobIds: new Set(), lastDate: null });
    const c = customerMap.get(name)!;
    c.total += p.totalAmount;
    if (p.vatRate) c.vat += p.totalAmount - p.totalAmount / (1 + p.vatRate / 100);
    c.purchaseCount += 1;
    c.jobIds.add(p.jobId);
    if (!c.lastDate || p.purchaseDate > c.lastDate) c.lastDate = p.purchaseDate;
  }
  const customerBreakdown = Array.from(customerMap.values())
    .map((c) => ({ name: c.name, total: c.total, vat: c.vat, purchaseCount: c.purchaseCount, projectCount: c.jobIds.size, lastDate: c.lastDate?.toISOString() || null }))
    .sort((a, b) => b.total - a.total);

  // --- Proje kırılımı ---
  const projectMap = new Map<string, { jobId: string; name: string; customer: string; refKodu: string; total: number; vat: number; quantity: number; purchaseCount: number; firstDate: Date; lastDate: Date }>();
  for (const p of purchases) {
    if (!p.job) continue;
    if (!projectMap.has(p.jobId)) {
      projectMap.set(p.jobId, {
        jobId: p.jobId,
        name: jobDisplayName(p.job) || '-',
        customer: p.job.firmaAdi || p.job.musteriAdi,
        refKodu: p.job.referansKodu,
        total: 0, vat: 0, quantity: 0, purchaseCount: 0,
        firstDate: p.purchaseDate, lastDate: p.purchaseDate,
      });
    }
    const pr = projectMap.get(p.jobId)!;
    pr.total += p.totalAmount;
    if (p.vatRate) pr.vat += p.totalAmount - p.totalAmount / (1 + p.vatRate / 100);
    pr.quantity += p.quantity;
    pr.purchaseCount += 1;
    if (p.purchaseDate < pr.firstDate) pr.firstDate = p.purchaseDate;
    if (p.purchaseDate > pr.lastDate) pr.lastDate = p.purchaseDate;
  }
  const projectBreakdown = Array.from(projectMap.values())
    .map((p) => ({ ...p, firstDate: p.firstDate.toISOString(), lastDate: p.lastDate.toISOString() }))
    .sort((a, b) => b.total - a.total);

  // --- Malzeme kırılımı ---
  const materialMap = new Map<string, { name: string; total: number; quantity: number; unit: string; purchaseCount: number }>();
  for (const p of purchases) {
    const name = p.material?.name || p.materialName || 'Diğer';
    if (!materialMap.has(name)) materialMap.set(name, { name, total: 0, quantity: 0, unit: p.unit, purchaseCount: 0 });
    const m = materialMap.get(name)!;
    m.total += p.totalAmount;
    m.quantity += p.quantity;
    m.purchaseCount += 1;
  }
  const materialBreakdown = Array.from(materialMap.values()).sort((a, b) => b.total - a.total);

  return {
    supplier,
    purchases,
    supplierPayments,
    ledger,
    customerBreakdown,
    projectBreakdown,
    materialBreakdown,
    summary: {
      totalPurchases,
      totalPaid,
      openBalance,
      totalVat,
      thisMonthTotal,
      purchaseCount: purchases.length,
      paymentCount: supplierPayments.length,
      topCustomer: customerBreakdown[0]?.name || null,
      topProject: projectBreakdown[0]?.name || null,
    },
  };
}

export type SupplierAccount = NonNullable<Awaited<ReturnType<typeof getSupplierAccount>>>;
