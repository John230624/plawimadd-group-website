'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import SellerButton from '@/components/seller/SellerButton';

interface SellerPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export default function SellerPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: SellerPaginationProps): React.ReactElement | null {
  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));

  const pages = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pageCount, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pageCount]);

  if (totalItems <= pageSize) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between">
      <p>
        {firstItem}-{lastItem} sur {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <SellerButton
          variant="outline"
          size="icon"
          icon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Precedent
        </SellerButton>
        {pages.map((item) => (
          <SellerButton
            key={item}
            variant={item === page ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onPageChange(item)}
            className="min-w-9 px-3"
          >
            {item}
          </SellerButton>
        ))}
        <SellerButton
          variant="outline"
          size="icon"
          icon={ChevronRight}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </SellerButton>
      </div>
    </div>
  );
}
