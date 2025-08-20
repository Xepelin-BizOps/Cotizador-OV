'use client';

import { useRouter } from 'next/navigation';
import QuoteForm from '@/app/(sections)/home/_feature/quote/components/QuoteForm';
import type { EditQuoteDto } from '@/schemas/quote/quote.dto';

interface Props {
  optionsProducts: { label: string; value: number }[];
  optionsClients: { label: string; value: number }[];
}

export default function ClientNewQuotePage({ optionsProducts, optionsClients }: Props) {
  const router = useRouter();

  const handleToggle = (type: 'create' | 'edit' | null, _data?: EditQuoteDto) => {
    if (type === null) {
      router.push('/home?tab=quotes');
    }
  };

  return (
    <div className="p-4">
      <QuoteForm
        toggleForm={handleToggle}
        isEdit={false}
        optionsProducts={optionsProducts}
        optionsClients={optionsClients}
      />
    </div>
  );
}

