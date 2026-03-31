'use client';

import React from 'react';
import { CompletedDrafts } from '@/components/standings/CompletedDrafts';
import type { CompletedDraft } from '@/types';

interface CompletedDraftsListProps {
  drafts: CompletedDraft[];
  isLoading?: boolean;
}

export function CompletedDraftsList({ drafts, isLoading = false }: CompletedDraftsListProps) {
  if (isLoading && drafts.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-12 text-center">
        <p className="text-white/40">Loading completed drafts...</p>
      </div>
    );
  }

  return <CompletedDrafts drafts={drafts} />;
}
