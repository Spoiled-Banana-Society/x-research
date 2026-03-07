'use client';

import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { fetchJson } from '@/lib/appApiClient';
import { useAuth } from '@/hooks/useAuth';

export type WheelSpinOutcome = {
  spinId: string;
  result: string;
  prize: {
    type: 'draft_pass' | 'discount' | 'merch' | 'nothing' | 'custom';
    value?: number | string;
  };
  angle: number;
};

export function useWheel(opts?: { userId?: string }) {
  const { user } = useAuth();
  const privy = usePrivy();
  const userId = opts?.userId ?? user?.id;
  const [history, setHistory] = useState<WheelSpinOutcome[]>([]);

  const spin = useCallback(async (): Promise<WheelSpinOutcome | null> => {
    if (!userId) throw new Error('Not logged in');
    const token = await privy.getAccessToken();
    if (!token) throw new Error('Missing Privy access token');

    const res = await fetchJson<WheelSpinOutcome>('/api/wheel/spin', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    setHistory((prev) => [res, ...prev]);
    return res;
  }, [privy, userId]);

  return {
    history,
    spin,
    userId,
  };
}
