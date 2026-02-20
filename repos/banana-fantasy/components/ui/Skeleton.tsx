'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-white/10';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns for common UI elements
export function SkeletonCard() {
  return (
    <div className="bg-bg-secondary rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="rounded" height={120} />
      <div className="flex gap-3">
        <Skeleton variant="rounded" height={40} className="flex-1" />
        <Skeleton variant="rounded" height={40} className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonDraftRow() {
  return (
    <div className="flex items-center gap-4 p-4 bg-bg-secondary rounded-xl">
      <Skeleton variant="rounded" width={80} height={20} />
      <Skeleton variant="rounded" width={60} height={20} />
      <Skeleton variant="rounded" width={100} height={20} />
      <div className="flex-1" />
      <Skeleton variant="rounded" width={80} height={36} />
    </div>
  );
}

export function SkeletonContestCard() {
  return (
    <div className="relative rounded-3xl p-10 max-w-3xl w-full backdrop-blur-md border border-white/10 bg-white/5">
      <div className="text-center space-y-6">
        <Skeleton width={200} height={32} className="mx-auto" />
        <Skeleton width={280} height={64} className="mx-auto" />
        <div className="flex justify-center gap-10">
          <div className="text-center space-y-2">
            <Skeleton width={80} height={28} className="mx-auto" />
            <Skeleton width={60} height={12} className="mx-auto" />
          </div>
          <div className="text-center space-y-2">
            <Skeleton width={60} height={28} className="mx-auto" />
            <Skeleton width={40} height={12} className="mx-auto" />
          </div>
        </div>
        <div className="flex justify-center gap-6 pt-4">
          <Skeleton variant="rounded" width={180} height={56} />
          <Skeleton variant="rounded" width={180} height={56} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPromoCard() {
  return (
    <div className="bg-bg-secondary rounded-2xl p-4 space-y-3">
      <Skeleton variant="circular" width={40} height={40} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="60%" height={12} />
      <Skeleton variant="rounded" height={8} />
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonDraftRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-2">
      <Skeleton width="50%" height={12} />
      <Skeleton width="40%" height={28} />
      <Skeleton width="30%" height={10} />
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStat key={i} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="bg-white/5 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width={`${100 / cols}%`} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-t border-white/5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ title = true }: { title?: boolean }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {title && <Skeleton width={200} height={32} />}
      <SkeletonStatGrid />
      <SkeletonTable />
    </div>
  );
}
