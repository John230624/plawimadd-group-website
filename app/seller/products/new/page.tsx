'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductRedirectPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    router.replace('/seller/add-products');
  }, [router]);

  return <div className="p-6 text-sm text-slate-500">Redirection vers le formulaire produit...</div>;
}
