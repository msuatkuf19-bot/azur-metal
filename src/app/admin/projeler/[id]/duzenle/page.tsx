import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BusinessJobForm from '@/components/forms/BusinessJobForm';
import { parseEtiketler } from '@/lib/utils';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.businessJob.findUnique({ where: { id } });

  if (!project) {
    notFound();
  }

  const initialData = {
    ...project,
    etiketler: parseEtiketler(project.etiketler),
  };

  return (
    <BusinessJobForm
      initialData={initialData}
      jobId={project.id}
      basePath="/admin/projeler"
      entityLabel="Proje"
    />
  );
}
