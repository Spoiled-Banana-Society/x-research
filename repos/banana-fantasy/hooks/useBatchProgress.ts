import { useState, useEffect, useCallback, useRef } from 'react';
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
  const controllerRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setError(null);

    getBatchProgress(controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setData(result);
        setIsLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      })
      .finally(() => {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      });
  }, []);

  useEffect(() => {
    refresh();
    // Poll every 30 seconds for live updates
    const interval = setInterval(refresh, 30_000);

    // Slot machine completion in /draft-room dispatches this event;
    // gives the JP/HOF counter an instant refresh instead of waiting
    // for the next poll cycle. See app/draft-room/page.tsx.
    const onTypeRevealed = () => refresh();
    window.addEventListener('bbb:type-revealed', onTypeRevealed);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bbb:type-revealed', onTypeRevealed);
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
