'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  classifyDraftType,
  deriveBatchSlots,
  locateDraft,
  parseDraftNumber,
  sha256Hex,
  type BatchSlots,
} from '@/lib/batchProof';

interface BatchProofPayload {
  batchNumber: number;
  status: 'pending' | 'committed' | 'revealed' | 'pre-launch';
  // The on-chain commit details (present when status >= committed):
  seedHash?: string;       // 0x-prefixed keccak256 of serverSeed
  commitTxHash?: string;   // Base mainnet tx hash
  commitBlock?: number;
  committedAt?: number;    // unix seconds
  // Reveal details (present when status === 'revealed'):
  serverSeed?: string;     // 0x-prefixed 32-byte seed
  revealTxHash?: string;
  revealedAt?: number;
  // Persisted derived slots from the backend (for cross-check):
  jackpotPositions?: number[];
  hofPositions?: number[];
  // For pre-launch batches:
  preLaunchNote?: string;
}

const BASESCAN_TX = (hash: string) => `https://basescan.org/tx/${hash.startsWith('0x') ? hash : '0x' + hash}`;
const BASESCAN_BLOCK = (block: number) => `https://basescan.org/block/${block}`;

export default function ProofPage() {
  const params = useParams();
  const draftId = typeof params?.draftId === 'string' ? params.draftId : '';
  const draftNumber = useMemo(() => parseDraftNumber(draftId), [draftId]);
  const locator = useMemo(() => (draftNumber ? locateDraft(draftNumber) : null), [draftNumber]);

  const [proof, setProof] = useState<BatchProofPayload | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [recomputed, setRecomputed] = useState<BatchSlots | null>(null);
  const [recomputeError, setRecomputeError] = useState<string | null>(null);
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);

  useEffect(() => {
    if (!locator) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/batches/${locator.batchNumber}/proof`);
        if (!res.ok) {
          if (cancelled) return;
          setProofError(`Could not load proof for batch #${locator.batchNumber} (HTTP ${res.status})`);
          return;
        }
        const body = (await res.json()) as BatchProofPayload;
        if (!cancelled) setProof(body);
      } catch (err) {
        if (!cancelled) setProofError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [locator]);

  useEffect(() => {
    if (!proof || !locator || proof.status !== 'revealed' || !proof.serverSeed) return;
    let cancelled = false;
    (async () => {
      try {
        const slots = await deriveBatchSlots(proof.serverSeed!, locator.batchNumber);
        if (cancelled) return;
        setRecomputed(slots);

        // Cross-check the commit hash matches sha256(serverSeed). The on-chain
        // commit uses keccak256, but we publish a sha256 alongside for native
        // browser verification. (Backend stores both.)
        if (proof.seedHash) {
          const sha = await sha256Hex(proof.serverSeed!);
          setHashMatch(sha.toLowerCase() === proof.seedHash.toLowerCase().replace(/^0x/, ''));
        }
      } catch (err) {
        if (!cancelled) setRecomputeError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [proof, locator]);

  if (!locator) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-white mb-2">Proof unavailable</h1>
        <p className="text-white/60">Could not parse a draft number from <code className="font-mono">{draftId}</code>.</p>
        <Link href="/drafting" className="inline-block mt-6 text-banana hover:underline">← Back to drafts</Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/drafting" className="text-xs text-white/50 hover:text-white/80">← Back</Link>
        <h1 className="text-2xl font-semibold text-white mt-2">Provably Fair · BBB #{locator.draftNumber}</h1>
        <p className="text-sm text-white/60 mt-1">
          Draft #{locator.draftNumber} is position{' '}
          <span className="font-mono text-white">{locator.positionInBatch}</span> in batch{' '}
          <span className="font-mono text-white">#{locator.batchNumber}</span>{' '}
          (BBB #{locator.batchStartDraftNumber}–#{locator.batchStartDraftNumber + 99}).
        </p>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Distribution rule</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Every 100 drafts contains exactly{' '}
          <span className="font-semibold text-purple-300">94 Pro</span>,{' '}
          <span className="font-semibold text-hof">5 HOF</span>,{' '}
          and <span className="font-semibold text-red-400">1 Jackpot</span>. SBS does not pick which slot is which type
          — assignments are derived from a server seed whose hash is committed on Base mainnet before the batch starts,
          and the seed itself is revealed after the batch closes. The Go API derives the 6 special slot positions
          deterministically from <code className="font-mono text-white/80 bg-white/5 px-1 rounded">HMAC-SHA256(seed, &quot;slot:&quot; + batchNumber + &quot;:&quot; + i)</code>.
        </p>
        <p className="text-xs text-white/40">
          See <Link href="/how-it-works#fairness" className="text-banana hover:underline">/how-it-works#fairness</Link>{' '}
          for the full algorithm. Client-side verification implementation:{' '}
          <code className="font-mono">lib/batchProof.ts</code>.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">On-chain commit</h2>

        {proofError && (
          <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{proofError}</p>
        )}

        {!proof && !proofError && (
          <p className="text-xs text-white/50">Loading…</p>
        )}

        {proof?.status === 'pre-launch' && (
          <div className="text-sm text-white/70 leading-relaxed">
            <p className="mb-2">
              <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-white/10 text-white/70 uppercase tracking-wider mr-2">Pre-launch</span>
              This batch predates the on-chain proof system.
            </p>
            <p className="text-xs text-white/50">
              The 94/5/1 distribution constraint was enforced in code for this batch, but the cryptographic seed commit
              wasn&apos;t yet published on Base. From the first batch after the rollout date, every batch will carry a
              full on-chain commit + reveal anyone can verify here.
            </p>
            {proof.preLaunchNote && (
              <p className="text-[11px] text-white/40 mt-2 italic">{proof.preLaunchNote}</p>
            )}
          </div>
        )}

        {proof?.status === 'pending' && (
          <p className="text-sm text-white/70">
            Commit transaction is being submitted. This page will show the proof once the commit lands on Base
            (typically within ~10 seconds of batch start).
          </p>
        )}

        {proof?.status === 'committed' && (
          <p className="text-xs text-amber-200/80 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg px-3 py-2 mb-2">
            <span className="font-semibold">Slot positions are intentionally hidden</span> until this batch closes
            (BBB #{((proof.batchNumber - 1) * 100) + 100}). Showing them now would let anyone time their draft
            entry to land in a known Jackpot/HOF slot. The on-chain hash below proves we&apos;ve already
            committed to a specific outcome — we just can&apos;t prove which outcome until the seed is revealed.
          </p>
        )}

        {(proof?.status === 'committed' || proof?.status === 'revealed') && (
          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-white/50">Commit tx</dt>
            <dd className="font-mono text-white break-all">
              {proof.commitTxHash ? (
                <a href={BASESCAN_TX(proof.commitTxHash)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                  {proof.commitTxHash}
                </a>
              ) : '—'}
            </dd>

            {proof.commitBlock && (
              <>
                <dt className="text-white/50">Block</dt>
                <dd className="font-mono text-white">
                  <a href={BASESCAN_BLOCK(proof.commitBlock)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                    {proof.commitBlock.toLocaleString()}
                  </a>
                </dd>
              </>
            )}

            <dt className="text-white/50">Seed hash (keccak256)</dt>
            <dd className="font-mono text-white break-all">{proof.seedHash || '—'}</dd>
          </dl>
        )}
      </section>

      {proof?.status === 'revealed' && (
        <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-emerald-200 uppercase tracking-wider">Reveal · live recomputation</h2>

          <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-xs">
            <dt className="text-white/50">Reveal tx</dt>
            <dd className="font-mono text-white break-all">
              {proof.revealTxHash ? (
                <a href={BASESCAN_TX(proof.revealTxHash)} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                  {proof.revealTxHash}
                </a>
              ) : '—'}
            </dd>

            <dt className="text-white/50">Server seed</dt>
            <dd className="font-mono text-white break-all">{proof.serverSeed}</dd>

            <dt className="text-white/50">Hash check</dt>
            <dd>
              {hashMatch === null ? <span className="text-white/40">computing…</span>
                : hashMatch ? <span className="text-emerald-300">✓ sha256(seed) matches commit hash</span>
                : <span className="text-red-300">⚠ hash mismatch</span>}
            </dd>
          </dl>

          {recomputeError && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{recomputeError}</p>
          )}

          {recomputed && (
            <div className="space-y-2">
              <p className="text-xs text-white/60">
                Re-derived from the revealed seed in your browser:
              </p>
              <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-xs">
                <dt className="text-white/50">Jackpot slot(s)</dt>
                <dd className="font-mono text-white">
                  {recomputed.jackpotPositions.map((p) => (
                    <span key={p} className={`mr-2 ${p === locator.positionInBatch ? 'text-red-300 font-semibold' : ''}`}>
                      {p}{p === locator.positionInBatch ? ' ← this draft' : ''}
                    </span>
                  ))}
                </dd>
                <dt className="text-white/50">HOF slots</dt>
                <dd className="font-mono text-white">
                  {recomputed.hofPositions.map((p) => (
                    <span key={p} className={`mr-2 ${p === locator.positionInBatch ? 'text-hof font-semibold' : ''}`}>
                      {p}{p === locator.positionInBatch ? ' ← this draft' : ''}
                    </span>
                  ))}
                </dd>
                <dt className="text-white/50">This draft</dt>
                <dd>
                  <span className="text-white">Position {locator.positionInBatch} → </span>
                  <span className="font-semibold" style={{
                    color: classifyDraftType(locator.positionInBatch, recomputed) === 'jackpot' ? '#ef4444'
                      : classifyDraftType(locator.positionInBatch, recomputed) === 'hof' ? '#D4AF37'
                      : '#a855f7',
                  }}>
                    {classifyDraftType(locator.positionInBatch, recomputed).toUpperCase()}
                  </span>
                </dd>
              </dl>

              {proof.jackpotPositions && proof.hofPositions && (
                <p className="text-[11px] text-white/40">
                  Backend-published positions:{' '}
                  jackpot=[{proof.jackpotPositions.join(',')}] hof=[{proof.hofPositions.join(',')}].
                  Your recomputation must match these.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Why this is real proof</h2>
        <ul className="text-xs text-white/60 space-y-1.5 leading-relaxed list-disc list-inside">
          <li>Hash is published on Base mainnet <em>before</em> any draft in the batch fills — chain timestamp is independent.</li>
          <li>Anyone with a Base RPC node (or basescan) can read the commit and verify when it landed.</li>
          <li>Reveal must hash to the committed value — math, not trust.</li>
          <li>Slot derivation is deterministic; the recomputation above runs in your browser, no server call needed.</li>
          <li>If we ever published a different seed than the one we committed, the hash check above would say <span className="text-red-300">⚠ hash mismatch</span>.</li>
        </ul>
      </section>
    </div>
  );
}
