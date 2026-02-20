'use client';

import React from 'react';
import { SkeletonPage, SkeletonStatGrid, SkeletonTable, SkeletonList, SkeletonCard } from './Skeleton';
import { ErrorState } from './ErrorState';

type SkeletonVariant = 'page' | 'stats' | 'table' | 'list' | 'cards';

interface PageShellProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  skeleton?: SkeletonVariant;
  skeletonCount?: number;
  className?: string;
}

function SkeletonForVariant({ variant, count }: { variant: SkeletonVariant; count: number }) {
  switch (variant) {
    case 'stats':
      return <SkeletonStatGrid count={count} />;
    case 'table':
      return (
        <div className="space-y-6">
          <SkeletonStatGrid count={4} />
          <SkeletonTable rows={count} cols={5} />
        </div>
      );
    case 'list':
      return <SkeletonList count={count} />;
    case 'cards':
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    default:
      return <SkeletonPage />;
  }
}

/**
 * Wraps a page with loading skeleton + error state.
 * 
 * Usage:
 *   <PageShell loading={loading} error={error} onRetry={reload} skeleton="table">
 *     {actual content}
 *   </PageShell>
 */
export function PageShell({
  loading,
  error,
  onRetry,
  children,
  skeleton = 'page',
  skeletonCount = 5,
  className = '',
}: PageShellProps) {
  if (loading) {
    return (
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <SkeletonForVariant variant={skeleton} count={skeletonCount} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 ${className}`}>
        <ErrorState
          message={error}
          onRetry={onRetry}
        />
      </div>
    );
  }

  return <>{children}</>;
}
