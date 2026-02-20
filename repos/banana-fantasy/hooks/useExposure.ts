'use client';

import type { UserExposure } from '@/lib/exposureUtils';
import { fetchJson } from '@/lib/appApiClient';
import { useSWRLike } from '@/hooks/useSWRLike';
import { useAuth } from '@/hooks/useAuth';

export function useExposure(opts?: { userId?: string }) {
  const { user } = useAuth();
  const userId = opts?.userId ?? user?.id;

  return useSWRLike<UserExposure | null>(
    userId ? `exposure:${userId}` : null,
    ({ signal }) => fetchJson<UserExposure>(`/api/exposure/${userId}`, { signal }),
    { enabled: !!userId, fallbackData: null },
  );
}
