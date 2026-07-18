import React from 'react'
import { SkeletonBlock, TableSkeleton } from './Skeleton'

const Loading = () => {
    return (
        <div className="w-full max-w-[1200px] mx-auto p-6 space-y-6">
            {/* Top Page Header */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between animate-pulse">
                <div className="space-y-2">
                    <SkeletonBlock className="h-8 w-48 rounded-lg" />
                    <SkeletonBlock className="h-4 w-32 rounded-lg" />
                </div>
                <SkeletonBlock className="h-10 w-28 rounded-lg" />
            </div>

            {/* Quick Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                    <SkeletonBlock className="h-4 w-1/2 rounded" />
                    <SkeletonBlock className="h-6 w-1/3 rounded" />
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                    <SkeletonBlock className="h-4 w-1/2 rounded" />
                    <SkeletonBlock className="h-6 w-1/3 rounded" />
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                    <SkeletonBlock className="h-4 w-1/2 rounded" />
                    <SkeletonBlock className="h-6 w-1/3 rounded" />
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm space-y-3">
                    <SkeletonBlock className="h-4 w-1/2 rounded" />
                    <SkeletonBlock className="h-6 w-1/3 rounded" />
                </div>
            </div>

            {/* Content Table Skeleton */}
            <TableSkeleton rows={4} cols={5} />
        </div>
    )
}

export default Loading