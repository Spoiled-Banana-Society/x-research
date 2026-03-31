'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMockDataEnabled } from '@/lib/mockMode';

type CacheEntry<T> = {
  data: T | null;
  error: unknown;
  updatedAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export interface UseSWRLikeOptions<T> {
  enabled?: boolean;
  fallbackData: T;
}

export interface UseSWRLikeResult<T> {
  data: T;
  error: unknown;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<void>;
  usingMockData: boolean;
}

/**
 * Minimal SWR-like hook:
 * - returns cached data immediately when available
 * - revalidates on mount
 * - provides mutate() to refetch
 */
export function useSWRLike<T>(
  key: string | null,
  fetcher: (ctx: { signal: AbortSignal }) => Promise<T>,
  options: UseSWRLikeOptions<T>,
): UseSWRLikeResult<T> {
  const usingMockData = isMockDataEnabled();

  const enabled = (options.enabled ?? true) && !!key && !usingMockData;

  const cached = useMemo(() => {
    if (!key) return null;
    return (cache.get(key) as CacheEntry<T> | undefined) ?? null;
  }, [key]);

  const [data, setData] = useState<T>(() => (cached?.data ?? null) ?? options.fallbackData);
  const [error, setError] = useState<unknown>(() => cached?.error ?? null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const isFirstLoadRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  const runFetch = useCallback(async () => {
    if (!enabled || !key) {
      controllerRef.current?.abort();
      controllerRef.current = null;
      setData(options.fallbackData);
      setError(null);
      setIsValidating(false);
      return;
    }

    controllerRef.current?.abort();
    const ctrl = new AbortController();
    controllerRef.current = ctrl;

    setIsValidating(true);
    try {
      const next = await fetcher({ signal: ctrl.signal });
      if (ctrl.signal.aborted) return;
      cache.set(key, { data: next, error: null, updatedAt: Date.now() });
      setData(next);
      setError(null);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      cache.set(key, { data: options.fallbackData, error: err, updatedAt: Date.now() });
      setData(options.fallbackData);
      setError(err);
    } finally {
      if (controllerRef.current === ctrl) {
        controllerRef.current = null;
        setIsValidating(false);
      }
    }
  }, [enabled, key, fetcher, options.fallbackData]);

  useEffect(() => {
    void runFetch();

    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled, runFetch]);

  const isLoading = useMemo(() => {
    if (!enabled) return false;
    if (!key) return false;
    // Consider it loading only on the very first load when we had no cache.
    return isFirstLoadRef.current && !cached;
  }, [enabled, key, cached]);

  useEffect(() => {
    isFirstLoadRef.current = false;
  }, []);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: runFetch,
    usingMockData,
  };
}
