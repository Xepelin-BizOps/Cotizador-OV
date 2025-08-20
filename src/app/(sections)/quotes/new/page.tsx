import { redirect } from 'next/navigation';
import ClientNewQuotePage from './ClientNewQuotePage';
import { getCompanyClientCatalog, getCompanyProductCatalog } from '@/app/(sections)/home/_actions';

export default async function NewQuotePage() {
  if (process.env.NEXT_PUBLIC_FEATURE_NUEVA_COTIZACION !== 'true') {
    redirect('/home?tab=quotes');
  }

  const optionsProducts = await getCompanyProductCatalog(1);
  const optionsClients = await getCompanyClientCatalog(1);

  return (
    <ClientNewQuotePage
      optionsProducts={optionsProducts}
      optionsClients={optionsClients}
    />
  );
}
