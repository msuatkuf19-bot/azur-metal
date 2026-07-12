'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export interface SearchResultItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

export interface SearchResults {
  jobs: SearchResultItem[];
  workers: SearchResultItem[];
  suppliers: SearchResultItem[];
  materials: SearchResultItem[];
}

const EMPTY_RESULTS: SearchResults = { jobs: [], workers: [], suppliers: [], materials: [] };

export async function globalSearch(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (q.length < 2) return EMPTY_RESULTS;

  const session = await getServerSession(authOptions);
  if (!session?.user) return EMPTY_RESULTS;

  const [jobs, workers, suppliers, materials] = await Promise.all([
    prisma.businessJob.findMany({
      where: {
        OR: [
          { musteriAdi: { contains: q } },
          { musteriSoyadi: { contains: q } },
          { firmaAdi: { contains: q } },
          { referansKodu: { contains: q } },
        ],
      },
      select: { id: true, referansKodu: true, musteriAdi: true, musteriSoyadi: true, firmaAdi: true },
      take: 5,
    }),
    prisma.worker.findMany({
      where: { fullName: { contains: q } },
      select: { id: true, fullName: true, roleType: true },
      take: 5,
    }),
    prisma.supplier.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, contactName: true },
      take: 5,
    }),
    prisma.material.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, unit: true },
      take: 5,
    }),
  ]);

  return {
    jobs: jobs.map((j) => ({
      id: j.id,
      label: j.firmaAdi || `${j.musteriAdi} ${j.musteriSoyadi || ''}`.trim(),
      sublabel: j.referansKodu,
      href: `/admin/is-emirleri/${j.id}`,
    })),
    workers: workers.map((w) => ({
      id: w.id,
      label: w.fullName,
      sublabel: w.roleType === 'USTA' ? 'Usta' : 'İşçi',
      href: `/admin/tanimlamalar/ustalar/${w.id}`,
    })),
    suppliers: suppliers.map((s) => ({
      id: s.id,
      label: s.name,
      sublabel: s.contactName || undefined,
      href: `/admin/tanimlamalar/toptancilar/${s.id}`,
    })),
    materials: materials.map((m) => ({
      id: m.id,
      label: m.name,
      sublabel: m.unit,
      href: `/admin/tanimlamalar/malzemeler`,
    })),
  };
}

export async function getRecentActivity(limit = 8) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return [];

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { adSoyad: true } } },
  });

  return logs.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityType: l.entityType,
    details: l.details,
    createdAt: l.createdAt.toISOString(),
    user: l.user,
  }));
}
