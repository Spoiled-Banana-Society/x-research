'use client';

import { useCallback, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/useAuth';
import { shareToX, getShareableUrl } from '@/lib/shareUtils';
import type { SpinShareType } from '@/types';

type Status = 'idle' | 'opening' | 'verifying' | 'verified' | 'not-found' | 'error' | 'already';

export interface ShareWinButtonProps {
  shareType: SpinShareType;
  sourceId: string; // spinId or draftId
  prize: string; // e.g. "jackpot", "hof", "draft-5"
  tweetText: string;
  className?: string;
  label?: string;
  earnsCredit?: boolean; // if false, we still let them share but never fire verify
}

const VERIFY_ATTEMPTS = 5;
const VERIFY_INTERVAL_MS = 12_000; // X search has 10-30s indexing delay

export function ShareWinButton({
  shareType,
  sourceId,
  prize,
  tweetText,
  className = '',
  label,
  earnsCredit = true,
}: ShareWinButtonProps) {
  const { isTwitterVerified, isTwitterLinking, linkTwitter } = useAuth();
  const privy = usePrivy();
  const [status, setStatus] = useState<Status>('idle');
  const [credited, setCredited] = useState<null | { verifiedShareCount: number; threshold: number; claimable: boolean }>(null);

  const verifyShare = useCallback(async () => {
    try {
      const token = await privy.getAccessToken();
      if (!token) {
        setStatus('error');
        return;
      }

      for (let attempt = 0; attempt < VERIFY_ATTEMPTS; attempt++) {
        // Wait a bit before first check (user needs time to post)
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, VERIFY_INTERVAL_MS));
        } else {
          await new Promise((r) => setTimeout(r, 8000)); // first check after 8s
        }

        const res = await fetch('/api/promos/spin-share', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ shareType, sourceId, prize }),
        });

        if (!res.ok) {
          setStatus('error');
          return;
        }
        const data = await res.json();

        if (data.verified) {
          if (data.alreadyRecorded) {
            setStatus('already');
          } else {
            setStatus('verified');
          }
          if (data.earnsCredit) {
            setCredited({
              verifiedShareCount: data.verifiedShareCount ?? 0,
              threshold: data.threshold ?? 3,
              claimable: data.claimable ?? false,
            });
          }
          return;
        }

        if (data.reason === 'no-x-link') {
          setStatus('error');
          return;
        }
      }

      setStatus('not-found');
    } catch (err) {
      console.error('[ShareWinButton] verify error', err);
      setStatus('error');
    }
  }, [privy, shareType, sourceId, prize]);

  const handleClick = useCallback(() => {
    if (!isTwitterVerified) {
      linkTwitter();
      return;
    }
    const url = getShareableUrl(
      shareType === 'wheel' ? `/wheel-result/${sourceId}` : `/draft/${sourceId}`,
    );
    shareToX(tweetText, url);
    setStatus('opening');
    if (earnsCredit) {
      setStatus('verifying');
      void verifyShare();
    } else {
      setStatus('verified');
    }
  }, [isTwitterVerified, linkTwitter, shareType, sourceId, tweetText, earnsCredit, verifyShare]);

  const defaultLabel = isTwitterVerified ? (label || 'Share on X') : 'Connect X to share';
  const disabled = isTwitterLinking || status === 'verifying';

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={
          className ||
          'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-text-primary font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed'
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2H21.5l-7.53 8.607L22.5 22h-6.77l-5.3-6.92L4.48 22H1.22l8.06-9.21L1.5 2h6.93l4.79 6.33L18.244 2Zm-1.187 18h1.873L7.01 3.9H5.01L17.057 20Z" />
        </svg>
        {status === 'verifying' ? 'Verifying…' : defaultLabel}
      </button>

      {status === 'verified' && credited && (
        <p className="text-xs text-text-muted">
          Verified ✓ — {credited.verifiedShareCount}/{credited.threshold} shares
          {credited.claimable ? ' — free spin ready!' : ''}
        </p>
      )}
      {status === 'verified' && !credited && (
        <p className="text-xs text-text-muted">Shared — thanks 🍌</p>
      )}
      {status === 'already' && (
        <p className="text-xs text-text-muted">Already shared this one</p>
      )}
      {status === 'not-found' && (
        <p className="text-xs text-text-muted">
          Couldn&apos;t find your tweet. Once posted it may take up to a minute — refresh to retry.
        </p>
      )}
      {status === 'error' && (
        <p className="text-xs text-text-muted">Something went wrong verifying. Your tweet still posted.</p>
      )}
    </div>
  );
}
