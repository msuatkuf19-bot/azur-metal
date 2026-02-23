import { getSuppliers } from '@/app/actions/suppliers';
import SuppliersClient from './SuppliersClient';

export default async function ToptancilarPage() {
  const result = await getSuppliers();
  
  // Date nesnelerini string'e çevir (client component için)
  const serializedData = result.data?.map(item => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  })) || [];
  
  return <SuppliersClient initialData={serializedData} />;
}
