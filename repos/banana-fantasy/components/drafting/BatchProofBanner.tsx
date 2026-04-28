'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/**
 * BatchProofBanner — top-of-/drafting "the math is locked in" panel.
 *
 * Shows the current batch's randomization state pulled from Firestore via
 * /api/batches/current + /api/batches/{N}/proof. Cycles through:
 *
 *   - pre-launch (gray)        : no on-chain proof yet for this batch
 *   - requested  (amber pulse) : VRF + commit submitted, waiting for fulfillment
 *   - sealed     (blue lock)   : math locked, salt hidden during batch
 *   - revealed   (emerald)     : batch closed, full math publicly verifiable
 *
 * Slots-remaining counter (1 JP · 5 HOF) ticks down as drafts in the
 * batch fill — backend reveals the *type* per draft (slot machine reveal),
 * never the *which-position-it-is*. So the banner counts how many of each
 * type have already been hit by inspecting completed drafts in the batch
 * — that data isn't here yet, so v1 just shows the constant "1 JP · 5 HOF"
 * total once the batch is sealed. Live decrement is a follow-up.
 */

type ProofStatus =
  | 'pending'
  | 'committed'
  | 'revealed'
  | 'requested'
  | 'fulfilled'
  | 'pre-launch';

type ProofVariant = 'commit-reveal' | 'vrf' | 'vrf-commit';

interface BatchSummary {
  batchNumber: number;
  status: ProofStatus;
  variant?: ProofVariant;
  vrfRequestTxHash?: string;
  vrfRequestBlock?: number;
  vrfRequestedAt?: number;
  vrfFulfilledAt?: number;
  commitTxHash?: string;
  commitTxHashVrf?: string;
  saltHash?: string;
  revealTxHash?: string;
  revealSaltTxHash?: string;
  revealedAt?: number;
}

interface CurrentBatchInfo {
  filledLeaguesCount?: number;
  currentDraftNumber: number;
  currentBatchNumber: number;
  positionInBatch: number;
  nextBatchNumber: number;
}

const BASESCAN_TX = (h: string) => `https://basescan.org/tx/${h.startsWith('0x') ? h : '0x' + h}`;

export function BatchProofBanner() {
  const [info, setInfo] = useState<CurrentBatchInfo | null>(null);
  const [proof, setProof] = useState<BatchSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/batches/current');
        if (!r.ok) throw new Error(`current batch: ${r.status}`);
        const body = (await r.json()) as CurrentBatchInfo;
        if (cancelled) return;
        setInfo(body);
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!info) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/batches/${info.currentBatchNumber}/proof`);
        if (!r.ok) throw new Error(`proof: ${r.status}`);
        const body = (await r.json()) as BatchSummary;
        if (cancelled) return;
        setProof(body);
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [info]);

  // Derive the batch-bound BBB# range and a representative proof draftId for
  // navigation (the verify page can resolve any draft inside this batch).
  const batchRange = useMemo(() => {
    if (!info) return null;
    const start = (info.currentBatchNumber - 1) * 100 + 1;
    return { start, end: start + 99 };
  }, [info]);

  if (loadError) {
    // Banner is non-essential; fail silent rather than break /drafting.
    return null;
  }
  if (!info || !proof) {
    return (
      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
        <div className="h-4 w-2/3 bg-white/5 rounded animate-pulse" />
      </div>
    );
  }

  const variant: ProofVariant =
    proof.variant === 'vrf' ? 'vrf'
    : proof.variant === 'vrf-commit' ? 'vrf-commit'
    : 'commit-reveal';

  const isVRFCommit = variant === 'vrf-commit';
  const isVRF = variant === 'vrf';

  // State buckets for visual treatment.
  const isPrelaunch = proof.status === 'pre-launch';
  const isAwaiting =
    proof.status === 'pending' ||
    (isVRF && proof.status === 'requested') ||
    (isVRFCommit && proof.status === 'requested');
  const isSealed =
    (!isVRFCommit && proof.status === 'committed') ||
    (isVRF && proof.status === 'fulfilled') ||
    (isVRFCommit && proof.status === 'fulfilled');
  const isRevealed = proof.status === 'revealed';

  const bookendDraftId = `2025-fast-draft-${batchRange?.start ?? 1}`;

  return (
    <div
      className={
        'mb-4 rounded-xl border px-4 py-3 ' +
        (isRevealed
          ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
          : isSealed
          ? 'border-blue-500/25 bg-blue-500/[0.04]'
          : isAwaiting
          ? 'border-amber-500/25 bg-amber-500/[0.04]'
          : 'border-white/10 bg-white/[0.02]')
      }
    >
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">
              {isRevealed ? '🎉' : isSealed ? '🔒' : isAwaiting ? '🎲' : '📦'}{' '}
              Batch #{info.currentBatchNumber}
            </span>
            {batchRange && (
              <span className="text-xs text-white/50 font-mono">
                BBB #{batchRange.start}–#{batchRange.end}
              </span>
            )}
            {!isPrelaunch && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-semibold rounded-full bg-blue-500/[0.08] border border-blue-400/30 text-blue-200 uppercase tracking-wider">
                {isVRFCommit ? 'Chainlink VRF + Salt Commit'
                  : isVRF ? 'Chainlink VRF v2.5'
                  : 'Commit · Reveal'}
              </span>
            )}
          </div>

          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
            {isPrelaunch && <>This batch predates the on-chain proof system. From the next batch forward, every batch
              carries a full on-chain proof anyone can verify.</>}

            {isAwaiting && (
              <>
                {isVRFCommit ? (
                  <>🎲 Asking Chainlink VRF for a random number + sealing the SBS-side salt on Base. ~30–60s.
                  Once the math lands, the 6 special slot positions are <em>locked but hidden</em> until the batch closes.</>
                ) : isVRF ? (
                  <>🎲 Asking Chainlink VRF for the random number that determines the 6 special slots. ~30–60s.</>
                ) : (
                  <>Sealing this batch&apos;s commitment on Base. The 6 special slot positions become locked-in
                  once the commit lands.</>
                )}
              </>
            )}

            {isSealed && (
              <>
                {isVRFCommit ? (
                  <><span className="text-blue-200 font-semibold">Sealed.</span> The 6 special slots
                  ({' '}<span className="text-red-300">1 Jackpot</span> ·{' '}
                  <span className="text-hof">5 HOF</span>){' '}are <strong>already determined</strong> for this batch — Chainlink
                  randomness AND a SBS-side salt are both cryptographically bound on Base. Nobody (including SBS) can
                  change them, and nobody can compute which draft is which type until the salt is revealed at batch
                  close. Each draft&apos;s type reveals when the lobby fills.</>
                ) : isVRF ? (
                  <><span className="text-blue-200 font-semibold">Locked in.</span> Chainlink VRF delivered the
                  random number that determines the 6 special slots ({' '}<span className="text-red-300">1 Jackpot</span> ·{' '}
                  <span className="text-hof">5 HOF</span>){' '}for this batch. Each draft&apos;s type reveals when the lobby fills.</>
                ) : (
                  <><span className="text-blue-200 font-semibold">Sealed.</span> The 6 special slots are committed
                  on Base. Each draft&apos;s type reveals as the lobby fills; full math becomes verifiable when the
                  batch closes.</>
                )}
              </>
            )}

            {isRevealed && (
              <>
                <span className="text-emerald-200 font-semibold">✓ Verified.</span> This batch is closed. Anyone can
                independently re-derive every Jackpot/HOF/Pro assignment from the on-chain math.
              </>
            )}
          </p>

          {/* Proof links — show whichever transactions are available. */}
          {!isPrelaunch && (
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[11px]">
              {(proof.commitTxHashVrf || proof.vrfRequestTxHash) && (
                <a
                  href={BASESCAN_TX((proof.commitTxHashVrf || proof.vrfRequestTxHash) as string)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  {isVRFCommit ? 'Commit + VRF request ↗' : isVRF ? 'VRF request ↗' : 'Commit tx ↗'}
                </a>
              )}
              {proof.commitTxHash && !proof.commitTxHashVrf && !isVRFCommit && (
                <a
                  href={BASESCAN_TX(proof.commitTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline"
                >
                  Commit tx ↗
                </a>
              )}
              {(proof.revealSaltTxHash || proof.revealTxHash) && (
                <a
                  href={BASESCAN_TX((proof.revealSaltTxHash || proof.revealTxHash) as string)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 hover:text-emerald-200 underline"
                >
                  {isVRFCommit ? 'Salt reveal ↗' : 'Reveal tx ↗'}
                </a>
              )}
              <Link
                href={`/proof/${bookendDraftId}`}
                className="text-white/60 hover:text-white/90 underline"
              >
                Full proof
              </Link>
            </div>
          )}
        </div>

        {/* Counter pill — total special slots in this batch. */}
        {!isPrelaunch && (isSealed || isRevealed) && (
          <div className="text-right shrink-0">
            <div className="text-[9px] uppercase tracking-wider text-white/50">
              Special slots
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">
              <span className="text-red-300">1 JP</span> · <span className="text-hof">5 HOF</span>
            </div>
            <div className="text-[10px] text-white/50 mt-0.5">in this batch</div>
          </div>
        )}
      </div>
    </div>
  );
}
