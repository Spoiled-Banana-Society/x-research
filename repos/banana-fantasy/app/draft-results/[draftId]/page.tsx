'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getDraftSummary, getDraftInfo, type ApiDraftPick } from '@/lib/api/drafts';
import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';

// ─── Types ───────────────────────────────────────────────────────────────

interface DraftPlayer {
  playerId: string;
  displayName: string;
  team: string;
  position: string;
  pickNum: number;
  round: number;
  projectedPoints?: number;
  adp?: number;
}

// ─── Position Colors ─────────────────────────────────────────────────────

const POS_STYLES: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  QB: { bg: 'from-red-600/20 to-red-900/20', border: 'border-red-500/40', text: 'text-red-400', glow: '0 4px 20px rgba(239,68,68,0.25)', badge: 'bg-red-500/20' },
  RB: { bg: 'from-blue-600/20 to-blue-900/20', border: 'border-blue-500/40', text: 'text-blue-400', glow: '0 4px 20px rgba(59,130,246,0.25)', badge: 'bg-blue-500/20' },
  WR: { bg: 'from-green-600/20 to-green-900/20', border: 'border-green-500/40', text: 'text-green-400', glow: '0 4px 20px rgba(34,197,94,0.25)', badge: 'bg-green-500/20' },
  TE: { bg: 'from-orange-600/20 to-orange-900/20', border: 'border-orange-500/40', text: 'text-orange-400', glow: '0 4px 20px rgba(249,115,22,0.25)', badge: 'bg-orange-500/20' },
  DST: { bg: 'from-purple-600/20 to-purple-900/20', border: 'border-purple-500/40', text: 'text-purple-400', glow: '0 4px 20px rgba(168,85,247,0.25)', badge: 'bg-purple-500/20' },
  K: { bg: 'from-yellow-600/20 to-yellow-900/20', border: 'border-yellow-500/40', text: 'text-yellow-400', glow: '0 4px 20px rgba(234,179,8,0.25)', badge: 'bg-yellow-500/20' },
};

function posStyle(pos: string) {
  const key = pos.toUpperCase().replace(/[0-9]/g, '');
  return POS_STYLES[key] || POS_STYLES.WR;
}

// ─── Grade Calculator ────────────────────────────────────────────────────

function calcGrade(players: DraftPlayer[]): { grade: string; color: string; message: string; score: number } {
  const totalProj = players.reduce((s, p) => s + (p.projectedPoints || 0), 0);
  const positions = new Set(players.map(p => p.position.replace(/[0-9]/g, ''))).size;
  const adpValue = players.reduce((s, p) => {
    if (p.adp && p.adp > 0) return s + Math.max(0, p.adp - p.pickNum);
    return s;
  }, 0);

  let score = 0;
  if (totalProj > 0) {
    score = totalProj > 200 ? 5 : totalProj > 160 ? 4 : totalProj > 120 ? 3 : totalProj > 80 ? 2 : 1;
  } else {
    score = (positions >= 4 ? 1 : 0) + (adpValue > 10 ? 2 : adpValue > 0 ? 1 : 0) + 1;
  }
  score = Math.min(score, 5);

  if (score >= 5) return { grade: 'A+', color: 'text-green-400', message: 'Elite draft! Championship caliber roster.', score };
  if (score >= 4) return { grade: 'A', color: 'text-green-400', message: 'Strong roster with high upside.', score };
  if (score >= 3) return { grade: 'B+', color: 'text-blue-400', message: 'Solid foundation for a winning season.', score };
  if (score >= 2) return { grade: 'B', color: 'text-blue-400', message: 'Good depth. Needs a breakout performer.', score };
  return { grade: 'C+', color: 'text-yellow-400', message: 'Sleeper picks could surprise everyone.', score };
}

// ─── Strengths ───────────────────────────────────────────────────────────

function getStrengths(players: DraftPlayer[]): string[] {
  const strengths: string[] = [];
  const posCount: Record<string, number> = {};
  players.forEach(p => {
    const k = p.position.replace(/[0-9]/g, '');
    posCount[k] = (posCount[k] || 0) + 1;
  });

  if ((posCount['WR'] || 0) >= 3) strengths.push('🎯 Deep WR corps');
  if ((posCount['RB'] || 0) >= 2) strengths.push('🏃 Strong RB room');
  if (posCount['QB']) strengths.push('🎯 QB secured');
  if (posCount['TE']) strengths.push('💪 TE locked in');
  if (posCount['DST']) strengths.push('🛡️ Defense ready');

  const steals = players.filter(p => p.adp && p.adp > p.pickNum + 2);
  if (steals.length >= 2) strengths.push('🔥 Multiple value picks');

  if (strengths.length === 0) strengths.push('🍌 Well-balanced roster');
  return strengths.slice(0, 4);
}

// ─── Share Image Generator ───────────────────────────────────────────────

function generateShareImage(players: DraftPlayer[], grade: string, draftLevel: string, draftId: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const W = 800;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) { resolve(null); return; }

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a0f');
    bgGrad.addColorStop(1, '#111118');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Border accent
    ctx.strokeStyle = '#F3E216';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Header
    ctx.fillStyle = '#F3E216';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${draftLevel.toUpperCase()} DRAFT COMPLETE`, W / 2, 65);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText('My BBB4 Team', W / 2, 110);

    // Grade
    ctx.fillStyle = '#F3E216';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.fillText(grade, W / 2, 185);

    // Players
    const startY = 220;
    const rowH = 56;
    const colW = W - 80;

    players.forEach((p, i) => {
      const y = startY + i * rowH;

      // Row background
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)';
      ctx.fillRect(40, y, colW, rowH - 4);

      // Position badge
      const posColors: Record<string, string> = { QB: '#ef4444', RB: '#3b82f6', WR: '#22c55e', TE: '#f97316', DST: '#a855f7', K: '#eab308' };
      const posKey = p.position.replace(/[0-9]/g, '');
      ctx.fillStyle = posColors[posKey] || '#22c55e';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(p.position, 56, y + 24);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(p.displayName, 110, y + 24);

      // Team
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(p.team, 110, y + 44);

      // Pick # and ADP
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(`Pick #${p.pickNum}`, W - 56, y + 24);
      if (p.adp) {
        const diff = p.adp - p.pickNum;
        ctx.fillStyle = diff > 0 ? '#22c55e' : diff < -2 ? '#ef4444' : 'rgba(255,255,255,0.3)';
        ctx.fillText(`ADP ${p.adp.toFixed(1)}${diff > 0 ? ' ▲' : ''}`, W - 56, y + 44);
      }
      ctx.textAlign = 'left';
    });

    // Footer
    const footY = H - 50;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`spoiledbananasociety.com • Draft ${draftId}`, W / 2, footY);

    ctx.fillStyle = '#F3E216';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText('🍌 Spoiled Banana Society — BBB4', W / 2, footY + 20);

    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ─── Main Page Component ─────────────────────────────────────────────────

export default function DraftResultsPage() {
  const params = useParams();
  const _router = useRouter();
  const draftId = typeof params?.draftId === 'string' ? params.draftId : '';
  const { user } = useAuth();
  const walletAddress = user?.walletAddress ?? '';

  const [players, setPlayers] = useState<DraftPlayer[]>([]);
  const [draftLevel, setDraftLevel] = useState('Pro');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [allRevealed, setAllRevealed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const cardContainerRef = useRef<HTMLDivElement>(null);

  const grade = calcGrade(players);
  const strengths = getStrengths(players);
  const totalProjected = players.reduce((s, p) => s + (p.projectedPoints || 0), 0);

  // Fetch draft data
  useEffect(() => {
    if (!draftId) { setIsLoading(false); return; }

    (async () => {
      try {
        const [summaryRes, infoRes] = await Promise.allSettled([
          getDraftSummary(draftId),
          getDraftInfo(draftId),
        ]);

        if (infoRes.status === 'fulfilled') {
          const info = infoRes.value as Record<string, unknown>;
          setDraftLevel(String(info.draftLevel ?? info.level ?? info.draftType ?? 'Pro'));
        }

        if (summaryRes.status === 'fulfilled') {
          const allPicks = summaryRes.value;
          let picks: ApiDraftPick[] = allPicks;

          if (walletAddress) {
            const userPicks = allPicks.filter(
              (p) => p.ownerAddress?.toLowerCase() === walletAddress.toLowerCase()
            );
            if (userPicks.length > 0) picks = userPicks;
          }

          const mapped: DraftPlayer[] = picks.map((p) => ({
            playerId: p.playerId,
            displayName: p.displayName,
            team: p.team,
            position: p.position,
            pickNum: p.pickNum ?? 0,
            round: p.round ?? 0,
            projectedPoints: typeof (p as Record<string, unknown>).projectedPoints === 'number'
              ? (p as Record<string, unknown>).projectedPoints as number
              : undefined,
            adp: typeof (p as Record<string, unknown>).adp === 'number'
              ? (p as Record<string, unknown>).adp as number
              : undefined,
          }));

          mapped.sort((a, b) => a.pickNum - b.pickNum);
          setPlayers(mapped);
        } else {
          setError('Failed to load draft results.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [draftId, walletAddress]);

  // Staggered reveal
  useEffect(() => {
    if (players.length === 0 || isLoading) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    players.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedCount(i + 1), 600 + i * 500));
    });

    timers.push(setTimeout(() => {
      setAllRevealed(true);
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { y: 0.5 },
        colors: ['#F3E216', '#fbbf24', '#22c55e', '#3b82f6', '#a78bfa'],
      });
    }, 600 + players.length * 500 + 200));

    timers.push(setTimeout(() => setShowSummary(true), 600 + players.length * 500 + 1000));

    return () => timers.forEach(clearTimeout);
  }, [players, isLoading]);

  const skipAnimation = () => {
    setRevealedCount(players.length);
    setAllRevealed(true);
    setShowSummary(true);
  };

  // Share handler — generates image
  const handleShare = useCallback(async () => {
    setShareLoading(true);
    try {
      const blob = await generateShareImage(players, grade.grade, draftLevel, draftId);

      if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'team.png', { type: 'image/png' })] })) {
        const file = new File([blob], `sbs-draft-${draftId}.png`, { type: 'image/png' });
        await navigator.share({
          title: 'My SBS Draft Team',
          text: `Just drafted my BBB4 team! Grade: ${grade.grade} 🍌`,
          files: [file],
        });
      } else if (blob) {
        // Fallback: download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sbs-draft-${draftId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      } else {
        // Fallback: copy text
        const text = `Just drafted my BBB4 team! 🍌\n\n${players.map(p => `${p.position}: ${p.displayName} (${p.team})`).join('\n')}\n\nGrade: ${grade.grade}\nspoiledbananasociety.com`;
        await navigator.clipboard.writeText(text);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // Silent fail
    } finally {
      setShareLoading(false);
    }
  }, [players, grade.grade, draftLevel, draftId]);

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <Skeleton width={200} height={28} className="mx-auto" />
            <Skeleton width={300} height={16} className="mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <SkeletonAvatar size={48} />
                <Skeleton width="80%" height={14} />
                <Skeleton width="50%" height={12} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <ErrorState
          title="Couldn't load your team"
          message={error}
          icon="😔"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  // ─── Empty ───
  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-white text-xl font-bold mb-2">No Results Yet</h2>
          <p className="text-white/50 mb-6 text-sm">This draft hasn&apos;t completed or no picks were found.</p>
          <Link href="/buy-drafts" className="px-5 py-2.5 bg-[#F3E216] text-black font-semibold rounded-xl">
            Buy Draft Pass
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Reveal ───
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[#F3E216] text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-2"
          >
            {draftLevel} Draft Complete
          </motion.p>
          <h1 className="text-white text-3xl sm:text-4xl font-bold mb-1">Your Team</h1>
          <p className="text-white/30 text-xs font-mono">Draft #{draftId}</p>

          {!allRevealed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={skipAnimation}
              className="mt-3 text-white/20 text-xs hover:text-white/50 transition-colors"
            >
              Skip animation →
            </motion.button>
          )}
        </motion.div>

        {/* Player Cards */}
        <div ref={cardContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {players.map((player, index) => {
            const revealed = index < revealedCount;
            const ps = posStyle(player.position);
            const adpDiff = player.adp ? player.adp - player.pickNum : null;

            return (
              <div key={player.playerId || index} style={{ perspective: '1000px' }}>
                <AnimatePresence mode="wait">
                  {!revealed ? (
                    /* Card Back */
                    <motion.div
                      key="back"
                      className="relative h-[140px] sm:h-[160px] rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center overflow-hidden"
                    >
                      <span className="text-3xl opacity-15">🍌</span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </motion.div>
                  ) : (
                    /* Card Front — 3D flip */
                    <motion.div
                      key="front"
                      initial={{ rotateY: -90, opacity: 0, scale: 0.8 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                      className={`relative h-[140px] sm:h-[160px] rounded-xl bg-gradient-to-br ${ps.bg} border ${ps.border} overflow-hidden`}
                      style={{ boxShadow: ps.glow, transformStyle: 'preserve-3d' }}
                    >
                      <div className="relative z-10 h-full p-3 sm:p-4 flex flex-col justify-between">
                        {/* Top: Position + Pick */}
                        <div className="flex items-start justify-between">
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${ps.text} ${ps.badge}`}>
                            {player.position}
                          </span>
                          <div className="text-right">
                            <span className="text-white/30 text-[11px]">Pick #{player.pickNum}</span>
                            {adpDiff !== null && (
                              <p className={`text-[10px] font-medium ${adpDiff > 2 ? 'text-green-400' : adpDiff < -2 ? 'text-red-400' : 'text-white/20'}`}>
                                ADP {player.adp?.toFixed(1)}
                                {adpDiff > 0 && <span> ▲</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Player name & team */}
                        <div>
                          <h3 className="text-white font-bold text-base sm:text-lg leading-tight">{player.displayName}</h3>
                          <p className="text-white/40 text-xs sm:text-sm">{player.team}</p>
                        </div>

                        {/* Bottom: projected or round */}
                        <div className="flex items-end justify-between">
                          {player.projectedPoints ? (
                            <p className="text-white/60 text-xs">
                              <span className="text-white font-semibold">{player.projectedPoints.toFixed(1)}</span> proj pts
                            </p>
                          ) : (
                            <p className="text-white/25 text-xs">Rd {player.round}</p>
                          )}
                          {adpDiff !== null && adpDiff > 3 && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.3 }}
                              className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold"
                            >
                              STEAL
                            </motion.span>
                          )}
                        </div>
                      </div>

                      {/* Decorative corner */}
                      <div className="absolute -right-6 -top-6 w-16 h-16 rotate-45 bg-white/[0.03]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Summary Section */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' as const }}
              className="space-y-6"
            >
              {/* Grade Card */}
              <div className="bg-white/[0.04] rounded-2xl border border-white/10 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-24 h-24 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center flex-shrink-0"
                  >
                    <span className={`text-4xl font-black ${grade.color}`}>{grade.grade}</span>
                  </motion.div>

                  <div className="text-center sm:text-left flex-1">
                    <h2 className="text-white text-xl font-bold mb-1">Draft Grade</h2>
                    <p className="text-white/50 text-sm mb-3">{grade.message}</p>
                    {totalProjected > 0 && (
                      <p className="text-white/60 text-sm">
                        Projected Total: <span className="text-white font-semibold">{totalProjected.toFixed(1)} pts</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Strengths */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <p className="text-white/30 text-[11px] font-semibold tracking-widest uppercase mb-3">Roster Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {strengths.map((s, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 text-white/60 text-sm px-3 py-1.5 rounded-lg"
                      >
                        {s}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/standings"
                  className="px-6 py-3 bg-[#F3E216] text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors text-center text-sm"
                >
                  📊 View Standings
                </Link>
                <Link
                  href={`/draft-reveal?id=${draftId}`}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-center text-sm"
                >
                  🎰 Spin the Wheel
                </Link>
                <Link
                  href="/buy-drafts"
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors text-center text-sm"
                >
                  🎟️ Draft Again
                </Link>
              </div>

              {/* Share Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleShare}
                  disabled={shareLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white text-sm transition-all disabled:opacity-50"
                >
                  {shareLoading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>🍌</motion.span>
                      Generating...
                    </>
                  ) : shareCopied ? (
                    <>✅ Saved!</>
                  ) : (
                    <>📤 Share My Team</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
