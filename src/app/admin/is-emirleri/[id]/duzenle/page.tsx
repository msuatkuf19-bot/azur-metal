import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import BusinessJobForm from '@/components/forms/BusinessJobForm';

async function getJob(id: string) {
  const job = await prisma.businessJob.findUnique({
    where: { id },
  });

  if (!job) {
    notFound();
  }

  return job;
}

export default async function EditJobPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);

  // Etiketleri array olarak hazırla
  const initialData = {
    ...job,
    etiketler: job.etiketler || [],
  };

  return <BusinessJobForm initialData={initialData} jobId={job.id} />;
}
