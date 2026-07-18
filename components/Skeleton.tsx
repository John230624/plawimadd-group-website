import React from 'react';

// Basic pulse shimmer block
export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 [.dark-theme_&]:bg-zinc-700/50 rounded ${className}`}></div>
  );
};

// Skeleton for a Product Card
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-xl border border-slate-100 [.dark-theme_&]:border-[var(--border)] bg-white [.dark-theme_&]:bg-[var(--bg-card)] p-3 shadow-sm w-full">
      {/* Product Image */}
      <div className="aspect-square w-full rounded-lg bg-slate-100 [.dark-theme_&]:bg-zinc-800/40 animate-pulse"></div>
      {/* Title */}
      <SkeletonBlock className="mt-3 h-4 w-3/4" />
      {/* Rating */}
      <SkeletonBlock className="mt-2 h-3 w-1/3" />
      {/* Price & Cart button */}
      <div className="mt-4 flex items-center justify-between">
        <SkeletonBlock className="h-5 w-1/4" />
        <SkeletonBlock className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};

// Skeleton for a Dashboard Metric Card
export const DashboardCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-100 [.dark-theme_&]:border-[var(--border)] bg-white [.dark-theme_&]:bg-[var(--bg-card)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-full" />
      </div>
      <SkeletonBlock className="mt-4 h-8 w-16" />
      <SkeletonBlock className="mt-2 h-3 w-32" />
    </div>
  );
};

// Skeleton for a Table (e.g. list of orders, users, products in admin panel)
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="w-full space-y-4 rounded-xl border border-slate-100 [.dark-theme_&]:border-[var(--border)] bg-white [.dark-theme_&]:bg-[var(--bg-card)] p-6 shadow-sm">
      {/* Table Header */}
      <div className="flex space-x-4 border-b border-slate-100 [.dark-theme_&]:border-[var(--border)] pb-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex space-x-4 py-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBlock key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Skeleton for Cart Page List Item
export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 [.dark-theme_&]:border-[var(--border)] py-4">
      <SkeletonBlock className="h-20 w-20 rounded-lg shrink-0 animate-pulse" />
      <div className="flex-grow space-y-2">
        <SkeletonBlock className="h-4 w-1/2" />
        <SkeletonBlock className="h-3 w-1/4" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <SkeletonBlock className="h-8 w-20 rounded" />
        <SkeletonBlock className="h-6 w-12" />
      </div>
    </div>
  );
};

// Skeleton for Product Detail Page
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="mx-auto max-w-[1140px] px-4 py-8 sm:px-6 animate-pulse">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Left: Product Images */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          <div className="flex gap-2">
            <div className="h-16 w-16 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
            <div className="h-16 w-16 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
            <div className="h-16 w-16 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="h-8 w-3/4 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
            <div className="h-4 w-1/3 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          </div>
          <div className="h-6 w-1/4 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          
          <div className="border-t border-b border-slate-100 [.dark-theme_&]:border-[var(--border)] py-4 space-y-2">
            <div className="h-4 w-1/2 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
            <div className="h-4 w-2/3 rounded-lg bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          </div>

          <div className="flex gap-4">
            <div className="h-12 flex-1 rounded-xl bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
            <div className="h-12 w-12 rounded-xl bg-slate-200 [.dark-theme_&]:bg-zinc-700/50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
