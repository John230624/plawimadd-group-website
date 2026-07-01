'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SellerBrandProps {
  compact?: boolean;
}

// Note: Les styles dark-theme sont appliqués via la classe .dark-theme du parent

export default function SellerBrand({
  compact = false,
}: SellerBrandProps): React.ReactElement {
  return (
    <Link
      href="/seller"
      aria-label="Retour au tableau de bord vendeur"
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <Image
        src="/images/seller-logo.svg"
        alt="Plawimadd Group"
        width={248}
        height={40}
        priority
        className={`max-w-full object-contain brightness-0 invert ${
          compact ? 'w-[166px]' : 'w-[190px] md:w-[205px]'
        }`}
      />
    </Link>
  );
}
