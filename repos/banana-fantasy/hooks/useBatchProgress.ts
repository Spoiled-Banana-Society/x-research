import { useState, useEffect, useCallback } from 'react';
import { getBatchProgress, type BatchProgress } from '@/lib/api/leagues';

interface UseBatchProgressReturn {
  data: BatchProgress | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useBatchProgress(): UseBatchProgressReturn {
  const [data, setData] = useState<BatchProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    getBatchProgress()
      .then(result => {
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 30 seconds for live updates
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
