'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import ProductWizard from '@/components/seller/ProductWizard';
import SellerButton from '@/components/seller/SellerButton';

export default function EditProductPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id || '';

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <div />
        <SellerButton variant="outline" onClick={() => router.push('/seller/product-list')}>
          <ChevronLeft className="h-4 w-4" /> Retour au catalogue
        </SellerButton>
      </div>
      <ProductWizard productId={productId} />
    </div>
  );
}
