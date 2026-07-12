import { prisma } from '@/lib/prisma';
import SuppliersClient from './SuppliersClient';

async function getSuppliersPageData() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [suppliers, purchaseSums, monthPurchaseSums, paymentSums, lastPurchaseBySupplier] = await Promise.all([
    prisma.supplier.findMany({
      include: { _count: { select: { materialPurchases: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.materialPurchase.groupBy({ by: ['supplierId'], _sum: { totalAmount: true } }),
    prisma.materialPurchase.groupBy({ by: ['supplierId'], _sum: { totalAmount: true }, where: { purchaseDate: { gte: startOfMonth } } }),
    prisma.supplierPayment.groupBy({ by: ['supplierId'], _sum: { amount: true } }),
    prisma.materialPurchase.groupBy({ by: ['supplierId'], _max: { purchaseDate: true } }),
  ]);

  const totalMap = new Map(purchaseSums.map((s) => [s.supplierId, s._sum.totalAmount || 0]));
  const monthMap = new Map(monthPurchaseSums.map((s) => [s.supplierId, s._sum.totalAmount || 0]));
  const paidMap = new Map(paymentSums.map((s) => [s.supplierId, s._sum.amount || 0]));
  const lastDateMap = new Map(lastPurchaseBySupplier.map((s) => [s.supplierId, s._max.purchaseDate]));

  const enriched = suppliers.map((s) => {
    const totalPurchases = totalMap.get(s.id) || 0;
    const totalPaid = paidMap.get(s.id) || 0;
    return {
      id: s.id,
      name: s.name,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      taxNo: s.taxNo,
      notes: s.notes,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      _count: s._count,
      totalPurchases,
      thisMonthTotal: monthMap.get(s.id) || 0,
      totalPaid,
      openBalance: totalPurchases - totalPaid,
      lastPurchaseDate: lastDateMap.get(s.id)?.toISOString() || null,
    };
  });

  return { suppliers: enriched };
}

export default async function ToptancilarPage() {
  const { suppliers } = await getSuppliersPageData();
  return <SuppliersClient initialData={suppliers} />;
}
