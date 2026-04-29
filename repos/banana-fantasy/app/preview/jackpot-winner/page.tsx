'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DRAFT_PLAYERS, POSITION_COLORS } from '@/lib/draftRoomConstants';

// Self-contained preview of the jackpot winner-picker animation. Renders
// the 10-tile draft-order banner with the same styling as DraftRoomReveal
// post-slotAnimationDone, then cycles a highlight through the tiles and
// lands on the deterministic winner. Replay button reseeds with a fresh
// mock draftId so the winner index changes between runs.
export default function JackpotWinnerPreviewPage() {
  const [draftId, setDraftId] = useState('preview-draft-001');
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef<(() => void) | null>(null);

  const run = useCallback(async (id: string) => {
    cancelRef.current?.();
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    cancelRef.current = () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };

    setRunning(true);
    setSettled(false);
    setHighlightIdx(null);

    let winnerIdx = 0;
    try {
      const enc = new TextEncoder();
      const digest = await crypto.subtle.digest('SHA-256', enc.encode(id));
      const view = new DataView(digest);
      winnerIdx = view.getUint32(0, false) % 10;
    } catch {
      let h = 0;
      for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
      winnerIdx = Math.abs(h) % 10;
    }
    if (cancelled) return;

    const totalTicks = 28;
    let curr = ((winnerIdx - (totalTicks - 1)) % 10 + 10) % 10;

    const tick = (n: number) => {
      if (cancelled) return;
      if (n >= totalTicks) {
        setHighlightIdx(winnerIdx);
        setSettled(true);
        setRunning(false);
        return;
      }
      setHighlightIdx(curr);
      curr = (curr + 1) % 10;
      const t = n / totalTicks;
      const interval = 70 + Math.pow(t, 2) * 380;
      timeoutId = setTimeout(() => tick(n + 1), interval);
    };
    tick(0);
  }, []);

  useEffect(() => {
    run(draftId);
    return () => cancelRef.current?.();
  }, [draftId, run]);

  const replay = () => {
    setDraftId(`preview-draft-${Math.random().toString(36).slice(2, 10)}`);
  };

  return (
    <div className="min-h-screen bg-black text-white font-primary">
      {/* Same red-tint pulse glow as live JP reveal */}
      <div
        className="fixed inset-0 z-30 pointer-events-none animate-pulse-glow"
        style={{
          background: 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)',
        }}
      />

      <div className="fixed top-0 left-0 z-[55] w-full overflow-hidden" style={{ backgroundColor: '#000' }}>
        <div className="w-full flex gap-2 lg:gap-5 overflow-x-auto banner-no-scrollbar" style={{ marginTop: '15px' }}>
          {Array.from({ length: 10 }, (_, i) => {
            const player = DRAFT_PLAYERS[i];
            const isUser = player?.isYou ?? false;
            const displayName = player?.displayName ?? '???';
            const truncatedName = displayName.length > 14 ? `${displayName.substring(0, 12)}...` : displayName;
            const isJpCycling = highlightIdx === i && !settled;
            const isJpWinner = settled && highlightIdx === i;
            const bgColor = isJpWinner
              ? '#FF474C'
              : isJpCycling
              ? '#fbbf24'
              : isUser
              ? '#FF474C'
              : '#222';
            const textColor = (isJpWinner || isUser) ? '#222' : isJpCycling ? '#111' : '#fff';
            const tileBorder = isJpWinner ? '#fff' : isJpCycling ? '#fbbf24' : isUser ? '#F3E216' : '#444';
            const tileBoxShadow = isJpWinner
              ? '0 0 24px 4px rgba(255, 71, 76, 0.85), 0 0 60px 10px rgba(255, 71, 76, 0.5)'
              : isJpCycling
              ? '0 0 14px 2px rgba(251, 191, 36, 0.7)'
              : 'none';
            const tileTransform = isJpWinner ? 'scale(1.08)' : isJpCycling ? 'scale(1.04)' : 'scale(1)';

            return (
              <div
                key={i}
                className={`flex-shrink-0 text-center overflow-hidden cursor-pointer relative ${isJpWinner ? 'animate-pulse' : ''}`}
                style={{
                  minWidth: 'clamp(100px, 12vw, 140px)',
                  flex: 1,
                  padding: '10px 0 0 0',
                  borderRadius: '5px',
                  borderWidth: isJpWinner ? 2 : 1,
                  borderStyle: 'solid',
                  borderColor: tileBorder,
                  transition: 'all 120ms ease-out',
                  background: bgColor,
                  boxShadow: tileBoxShadow,
                  transform: tileTransform,
                  zIndex: isJpWinner ? 10 : isJpCycling ? 5 : 1,
                }}
              >
                {isJpWinner && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full font-black text-[10px] tracking-wider"
                    style={{
                      background: '#fff',
                      color: '#FF474C',
                      boxShadow: '0 0 12px rgba(255,255,255,0.6)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    WINNER
                  </div>
                )}
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/banana-profile.png" alt="Banana" className="rounded-full w-[30px] mx-auto h-[30px] border border-gray-500" />

                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 5, paddingBottom: 3 }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>#{i + 1}</span>
                  </div>

                  <div className="lg:mt-1 font-bold text-[11px] lg:text-[14px]" style={{ color: textColor }}>
                    {truncatedName}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: '54px', color: textColor }}>
                    {(['QB', 'RB', 'WR', 'TE', 'DST'] as const).map(pos => (
                      <div
                        key={pos}
                        style={{ flex: 1, borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: POSITION_COLORS[pos], textAlign: 'center', opacity: 0.5 }}
                      >
                        <p style={{ fontSize: '10px' }}>{pos}</p>
                        <p className="text-xs">0</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grow text-center uppercase text-sm font-bold px-3 pt-2 mt-3">
          <span className="text-red-400">JACKPOT — picking winner…</span>
        </div>
      </div>

      <div style={{ height: '290px', flexShrink: 0 }} />

      <div className="relative z-[60] flex flex-col items-center gap-4 pt-12 pb-8">
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Mock draftId (seeds the winner)</div>
          <div className="font-mono text-sm text-white/80 break-all px-4">{draftId}</div>
          <div className="text-xs text-white/50 mt-2">
            Winner index = sha256(draftId) mod 10 — same algo as the server-side gate.
          </div>
        </div>

        <button
          onClick={replay}
          disabled={running}
          className="px-6 py-3 rounded-lg bg-banana text-black font-bold tracking-wide hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? 'Running…' : 'Replay with new draftId'}
        </button>

        <p className="text-xs text-white/40 max-w-md text-center px-4">
          Preview only — no real draft, no Firestore writes. The animation above
          mirrors what plays at the top of the live draft room after the slot
          machine reveals JACKPOT.
        </p>
      </div>
    </div>
  );
}
