'use client';

import { useBatchProgress } from '@/hooks/useBatchProgress';
import { Tooltip } from '../ui/Tooltip';
import { useAuth } from '@/hooks/useAuth';

export function BatchProgressIndicator() {
  const { isLoggedIn } = useAuth();
  const { data } = useBatchProgress();

  if (!isLoggedIn || !data) return null;

  const { current, total, jackpotRemaining, hofRemaining } = data;
  const jackpotHit = jackpotRemaining <= 0;
  const allHofHit = hofRemaining <= 0;
  const draftsLeft = total - current;

  return (
    <Tooltip
      content={
        <div className="text-center space-y-2 py-1">
          <p className="font-semibold text-text-primary">Draft {current} of {total}</p>
          {!jackpotHit && (
            <p className="text-red-400 text-xs">
              Jackpot must hit in next {draftsLeft} draft{draftsLeft !== 1 ? 's' : ''}!
            </p>
          )}
          {jackpotHit && (
            <p className="text-green-400 text-xs">Jackpot hit this batch!</p>
          )}
          {!allHofHit && (
            <p className="text-banana text-xs">
              {hofRemaining} HOF remaining this batch
            </p>
          )}
          {allHofHit && (
            <p className="text-green-400 text-xs">All 5 HOF hit this batch!</p>
          )}
          <div className="border-t border-bg-elevated pt-2 space-y-1">
            <p className="text-xs">
              <span className="text-red-400 font-semibold">Jackpot</span>{' '}
              <span className="text-text-secondary">&mdash; Win your league &amp; skip to finals</span>
            </p>
            <p className="text-xs">
              <span className="text-banana font-semibold">HOF</span>{' '}
              <span className="text-text-secondary">&mdash; Compete for bonus prizes</span>
            </p>
            <p className="text-text-muted text-xs mt-1">
              1 Jackpot &amp; 5 HOF guaranteed every {total} drafts
            </p>
          </div>
        </div>
      }
    >
      <div className="hidden sm:flex flex-col items-center w-[72px] py-1 cursor-help">
        <span className="text-[16px] font-semibold tabular-nums text-white/75 leading-tight">
          {current}<span className="text-white/40 font-normal">/{total}</span>
        </span>
        <div className="flex items-center justify-center gap-[6px] leading-tight">
          <span className="inline-flex items-center gap-[2px]">
            <span className={`text-[12px] font-bold tabular-nums ${jackpotHit ? 'text-green-400' : 'text-red-400'}`}>
              {jackpotHit ? '\u2713' : jackpotRemaining}
            </span>
            <span className="text-[9px] font-semibold text-white/50">JP</span>
          </span>
          <span className="inline-flex items-center gap-[2px]">
            <span className={`text-[12px] font-bold tabular-nums ${allHofHit ? 'text-green-400' : 'text-banana'}`}>
              {allHofHit ? '\u2713' : hofRemaining}
            </span>
            <span className="text-[9px] font-semibold text-white/50">HOF</span>
          </span>
        </div>
      </div>
    </Tooltip>
  );
}
