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

  const runFetch = useCallback(async () => {
    if (!enabled || !key) {
      setData(options.fallbackData);
      setError(null);
      return;
    }

    const ctrl = new AbortController();

    setIsValidating(true);
    try {
      const next = await fetcher({ signal: ctrl.signal });
      cache.set(key, { data: next, error: null, updatedAt: Date.now() });
      setData(next);
      setError(null);
    } catch (err) {
      cache.set(key, { data: options.fallbackData, error: err, updatedAt: Date.now() });
      setData(options.fallbackData);
      setError(err);
    } finally {
      setIsValidating(false);
    }
  }, [enabled, key, fetcher, options.fallbackData]);

  useEffect(() => {
    // Always revalidate on mount when enabled.
    // If we have cached data, keep it while validating.
    if (!enabled || !key) {
      setData(options.fallbackData);
      setError(null);
      return;
    }

    const ctrl = new AbortController();
    let mounted = true;

    (async () => {
      setIsValidating(true);
      try {
        const next = await fetcher({ signal: ctrl.signal });
        if (!mounted) return;
        cache.set(key, { data: next, error: null, updatedAt: Date.now() });
        setData(next);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        cache.set(key, { data: options.fallbackData, error: err, updatedAt: Date.now() });
        setData(options.fallbackData);
        setError(err);
      } finally {
        if (mounted) setIsValidating(false);
      }
    })();

    return () => {
      mounted = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

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
