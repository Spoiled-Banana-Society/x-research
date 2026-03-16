import { useState, useEffect, useCallback } from 'react';
import * as batchManager from '@/lib/batchManager';

export interface BatchProgress {
  current: number;
  total: number;
  jackpotRemaining: number;
  hofRemaining: number;
}

interface UseBatchProgressReturn {
  data: BatchProgress | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useBatchProgress(): UseBatchProgressReturn {
  const [data, setData] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    try {
      const progress = batchManager.getBatchProgress();
      setData(progress);
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 5 seconds for updates (other tabs may claim types)
    const interval = setInterval(refresh, 5_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
