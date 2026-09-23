import { getMaterials } from '@/app/actions/materials';
import MaterialsClient from './MaterialsClient';

// Liste her istekte veritabanından güncel okunur (build anında dondurulmaz)
export const dynamic = 'force-dynamic';

export default async function MalzemelerPage() {
  const result = await getMaterials();
  
  // Date nesnelerini string'e çevir (client component için)
  const serializedData = result.data?.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })) || [];
  
  return <MaterialsClient initialData={serializedData} />;
}
