'use client';

import type { DraftRoom } from '@/types';
import { fetchJson } from '@/lib/appApiClient';
import { useSWRLike } from '@/hooks/useSWRLike';

export function useDraftRooms() {
  return useSWRLike<DraftRoom[]>(
    'draftRooms',
    ({ signal }) => fetchJson<DraftRoom[]>('/api/drafts', { signal }),
    { fallbackData: [] },
  );
}
