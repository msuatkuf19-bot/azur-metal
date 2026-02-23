import { getWorkers } from '@/app/actions/workers';
import WorkersClient from './WorkersClient';

export default async function UstalarPage() {
  const result = await getWorkers();
  
  // Date nesnelerini string'e çevir (client component için)
  const serializedData = result.data?.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })) || [];
  
  return <WorkersClient initialData={serializedData} />;
}
