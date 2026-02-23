import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BusinessJobForm from '@/components/forms/BusinessJobForm';
import { parseEtiketler } from '@/lib/utils';

async function getJob(id: string) {
  const job = await prisma.businessJob.findUnique({
    where: { id },
  });

  if (!job) {
    notFound();
  }

  return job;
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  // Etiketleri array olarak hazırla
  const initialData = {
    ...job,
    etiketler: parseEtiketler(job.etiketler),
  };

  return <BusinessJobForm initialData={initialData} jobId={job.id} />;
}
