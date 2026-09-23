import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm veritabanının JSON yedeği (kullanıcı şifreleri hariç)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const [
    adminUsers,
    businessJobs,
    offers,
    offerItems,
    contracts,
    payments,
    paymentPlans,
    orders,
    orderItems,
    masters,
    workers,
    suppliers,
    materials,
    workEntries,
    materialPurchases,
    workLogs,
    fileAssets,
    auditLogs,
    attendances,
    workerPayments,
    workerSettlementPeriods,
    supplierPayments,
  ] = await Promise.all([
    prisma.adminUser.findMany({
      select: { id: true, kullaniciAdi: true, adSoyad: true, email: true, aktif: true, createdAt: true, updatedAt: true },
    }),
    prisma.businessJob.findMany(),
    prisma.offer.findMany(),
    prisma.offerItem.findMany(),
    prisma.contract.findMany(),
    prisma.payment.findMany(),
    prisma.paymentPlan.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.master.findMany(),
    prisma.worker.findMany(),
    prisma.supplier.findMany(),
    prisma.material.findMany(),
    prisma.workEntry.findMany(),
    prisma.materialPurchase.findMany(),
    prisma.workLog.findMany(),
    prisma.fileAsset.findMany(),
    prisma.auditLog.findMany(),
    prisma.attendance.findMany(),
    prisma.workerPayment.findMany(),
    prisma.workerSettlementPeriod.findMany(),
    prisma.supplierPayment.findMany(),
  ]);

  const data = {
    adminUsers,
    businessJobs,
    offers,
    offerItems,
    contracts,
    payments,
    paymentPlans,
    orders,
    orderItems,
    masters,
    workers,
    suppliers,
    materials,
    workEntries,
    materialPurchases,
    workLogs,
    fileAssets,
    auditLogs,
    attendances,
    workerPayments,
    workerSettlementPeriods,
    supplierPayments,
  };

  const counts = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]));
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace(/[:T]/g, '-');

  const body = JSON.stringify(
    { format: 'azur-metal-yedek', version: 1, createdAt: now.toISOString(), counts, data },
    null,
    2
  );

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="azur-metal-yedek-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
