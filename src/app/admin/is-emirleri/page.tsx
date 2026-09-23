import { prisma } from '@/lib/prisma';
import JobsListClient from './JobsListClient';

async function getJobs(searchParams: any) {
  const { search, durum, oncelik, arsiv } = searchParams;

  // Arşivlenenler varsayılan olarak gizli; "arsiv=1" ile sadece arşiv listelenir
  const where: any = { arsivlendi: arsiv === '1' };

  if (search) {
    where.OR = [
      { firmaAdi: { contains: search } },
      { musteriAdi: { contains: search } },
      { musteriSoyadi: { contains: search } },
      { telefon: { contains: search } },
      { referansKodu: { contains: search } },
    ];
  }

  if (durum) {
    where.durum = durum;
  }

  if (oncelik) {
    where.oncelik = oncelik;
  }

  const jobs = await prisma.businessJob.findMany({
    where,
    orderBy: { guncellemeTarihi: 'desc' },
    include: {
      offers: {
        where: { durum: 'Kabul' },
      },
      payments: true,
    },
  });

  // Her iş emri için finansal özet hesapla
  const jobsWithFinancials = jobs.map((job) => {
    const acceptedOfferTotal = job.offers.reduce((sum, offer) => sum + offer.genelToplam, 0);
    const totalIncome = job.payments
      .filter((p) => p.tip === 'Tahsilat')
      .reduce((sum, p) => sum + p.tutar, 0);
    const totalExpense = job.payments
      .filter((p) => p.tip === 'Gider')
      .reduce((sum, p) => sum + p.tutar, 0);
    const remaining = acceptedOfferTotal - totalIncome;

    return {
      ...job,
      financials: {
        acceptedOfferTotal,
        totalIncome,
        totalExpense,
        remaining,
      },
    };
  });

  return jobsWithFinancials;
}

export default async function JobsListPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<any>;
}) {
  const searchParams = await searchParamsPromise;
  const jobs = await getJobs(searchParams);

  return <JobsListClient jobs={jobs} searchParams={searchParams} />;
}
