'use client';

import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: string;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  icon = '⚠️',
  compact = false,
  className = '',
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 ${className}`}>
        <span className="text-lg flex-shrink-0">{icon}</span>
        <p className="text-red-300 text-sm flex-1">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-medium transition-colors flex-shrink-0"
          >
            {retryLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <span className="text-5xl mb-4">{icon}</span>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 text-sm max-w-md mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-[#F3E216] text-black font-semibold text-sm hover:brightness-110 transition-all"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'Check back later for updates.',
  icon = '📭',
  action,
  className = '',
}: {
  title?: string;
  message?: string;
  icon?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      {action && (
        action.href ? (
          <a href={action.href} className="mt-4 px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium text-white transition-colors">
            {action.label}
          </a>
        ) : action.onClick ? (
          <button type="button" onClick={action.onClick} className="mt-4 px-5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium text-white transition-colors">
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
