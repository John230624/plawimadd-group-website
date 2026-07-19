'use client';

import React from 'react';

interface SellerTableProps {
  children: React.ReactNode;
  className?: string;
}

interface SellerTableCellProps {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
  onClick?: React.MouseEventHandler<HTMLTableCellElement>;
  colSpan?: number;
}

export function SellerTable({ children, className = '' }: SellerTableProps): React.ReactElement {
  return (
    <div className={`overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function SellerTableHeader({ children, className = '' }: SellerTableProps): React.ReactElement {
  return <thead className={`border-y border-[var(--border)] bg-[var(--bg-outer)] text-left text-[var(--text-secondary)] ${className}`}>{children}</thead>;
}

export function SellerTableBody({ children, className = '' }: SellerTableProps): React.ReactElement {
  return <tbody className={`divide-y divide-[var(--border)] ${className}`}>{children}</tbody>;
}

interface SellerTableRowProps extends SellerTableProps {
  onClick?: React.MouseEventHandler<HTMLTableRowElement>;
}

export function SellerTableRow({ children, className = '', onClick }: SellerTableRowProps): React.ReactElement {
  return <tr className={`align-middle transition hover:bg-[var(--bg-hover)] ${className}`} onClick={onClick}>{children}</tr>;
}

export function SellerTableCell({
  children,
  className = '',
  isHeader = false,
  onClick,
  colSpan,
}: SellerTableCellProps): React.ReactElement {
  const Cell = isHeader ? 'th' : 'td';

  return (
    <Cell className={`px-5 py-4 ${isHeader ? 'font-medium' : ''} ${className}`} onClick={onClick} colSpan={colSpan}>
      {children}
    </Cell>
  );
}
