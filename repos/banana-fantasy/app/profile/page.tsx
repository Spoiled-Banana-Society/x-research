'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { SkeletonStatGrid, SkeletonCard, Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

// ─── Types ───────────────────────────────────────────────────────────────

type DraftStatus = 'live' | 'completed' | 'upcoming';

interface UserDraft {
  id: string;
  name: string;
  type: 'bbb' | 'jackpot' | 'hof';
  status: DraftStatus;
  date: string;
  rank?: number;
  totalPlayers: number;
  winnings?: number;
  grade?: string;
}

interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────

function getMockDrafts(): UserDraft[] {
  return [
    { id: 'd-101', name: 'Banana Blitz #142', type: 'bbb', status: 'live', date: new Date().toISOString(), totalPlayers: 10, rank: 3 },
    { id: 'd-099', name: 'Peel Party #98', type: 'hof', status: 'completed', date: new Date(Date.now() - 86400000).toISOString(), totalPlayers: 10, rank: 1, winnings: 45, grade: 'A' },
    { id: 'd-097', name: 'Monkey Mayhem #77', type: 'bbb', status: 'completed', date: new Date(Date.now() - 172800000).toISOString(), totalPlayers: 10, rank: 4, grade: 'B+' },
    { id: 'd-095', name: 'Golden Split #55', type: 'jackpot', status: 'completed', date: new Date(Date.now() - 345600000).toISOString(), totalPlayers: 10, rank: 2, winnings: 120, grade: 'A+' },
    { id: 'd-094', name: 'Tropical Storm #33', type: 'bbb', status: 'completed', date: new Date(Date.now() - 518400000).toISOString(), totalPlayers: 10, rank: 7, grade: 'C+' },
    { id: 'd-090', name: 'Ripe Rivalry #21', type: 'bbb', status: 'upcoming', date: new Date(Date.now() + 3600000).toISOString(), totalPlayers: 8 },
  ];
}

function getMockAchievements(): Achievement[] {
  return [
    { id: 'first-draft', name: 'First Pick', emoji: '🎟️', description: 'Complete your first draft', unlocked: true },
    { id: 'five-drafts', name: 'Draft Addict', emoji: '🔥', description: 'Complete 5 drafts', unlocked: true, progress: 5, maxProgress: 5 },
    { id: 'first-win', name: 'Winner Winner', emoji: '🏆', description: 'Win your first draft', unlocked: true },
    { id: 'jackpot-entry', name: 'High Roller', emoji: '🎰', description: 'Enter a Jackpot draft', unlocked: true },
    { id: 'ten-drafts', name: 'Draft Legend', emoji: '👑', description: 'Complete 10 drafts', unlocked: false, progress: 5, maxProgress: 10 },
    { id: 'hof-win', name: 'Hall of Famer', emoji: '⭐', description: 'Win a HOF draft', unlocked: false },
    { id: 'streak-3', name: 'Hot Streak', emoji: '🔥', description: '3 consecutive top-3 finishes', unlocked: false, progress: 1, maxProgress: 3 },
    { id: 'share-team', name: 'Show Off', emoji: '📤', description: 'Share your team on social media', unlocked: false },
  ];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function truncateAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 0) {
    const hrs = Math.ceil(Math.abs(diff) / 3600000);
    return hrs <= 1 ? 'In 1 hour' : `In ${hrs} hours`;
  }
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function memberSince(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const TYPE_CONFIG = {
  bbb: { label: 'BBB', color: '#a855f7', emoji: '⚡' },
  jackpot: { label: 'Jackpot', color: '#ef4444', emoji: '🔥' },
  hof: { label: 'HOF', color: '#d4af37', emoji: '🏆' },
};

const STATUS_CONFIG = {
  live: { label: 'LIVE', bg: 'bg-green-500/20', text: 'text-green-400', pulse: true },
  completed: { label: 'Done', bg: 'bg-white/5', text: 'text-white/40', pulse: false },
  upcoming: { label: 'Soon', bg: 'bg-banana/20', text: 'text-banana', pulse: false },
};

// ─── Animation ───────────────────────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' as const },
  }),
};

// ─── Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, login, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<'drafts' | 'achievements'>('drafts');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [drafts] = useState<UserDraft[]>(getMockDrafts);
  const [achievements] = useState<Achievement[]>(getMockAchievements);

  const PROMO_KEY = 'sbs-first-draft-promo-claimed';
  const promoClaimed = typeof window !== 'undefined' && localStorage.getItem(PROMO_KEY) === 'true';

  // Stats
  const stats = useMemo(() => {
    const completed = drafts.filter(d => d.status === 'completed');
    const wins = completed.filter(d => d.rank === 1).length;
    const totalWinnings = completed.reduce((s, d) => s + (d.winnings || 0), 0);
    const avgRank = completed.length > 0
      ? completed.reduce((s, d) => s + (d.rank || 0), 0) / completed.length
      : 0;
    return {
      totalDrafts: completed.length + drafts.filter(d => d.status === 'live').length,
      winRate: completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0,
      totalWinnings,
      avgRank: avgRank > 0 ? avgRank.toFixed(1) : '-',
    };
  }, [drafts]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <SkeletonAvatar size={64} />
            <div className="space-y-2 flex-1">
              <Skeleton width="40%" height={24} />
              <Skeleton width="25%" height={14} />
            </div>
          </div>
          <SkeletonStatGrid count={4} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <div className="text-5xl mb-4">🍌</div>
          <h1 className="text-white text-2xl font-bold mb-2">Your Profile</h1>
          <p className="text-white/40 text-sm mb-6">Log in to view your stats, drafts, and achievements.</p>
          <button
            onClick={() => login()}
            className="px-6 py-3 bg-banana text-black font-bold rounded-xl hover:brightness-110 transition-all"
          >
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  const handleCopyWallet = () => {
    if (user.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress).catch(() => {});
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 1500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">

        {/* ─── User Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-banana/10 to-transparent border border-banana/15 rounded-2xl p-5 sm:p-6 mb-6"
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-banana/20 border-2 border-banana/30 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.profilePicture ? (
                <Image src={user.profilePicture} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
              ) : (
                <span className="text-3xl sm:text-4xl">🍌</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xl sm:text-2xl font-bold truncate">
                  {user.username || 'Anonymous'}
                </h1>
                {user.isVerified && (
                  <span className="text-banana text-sm" title="Verified">✓</span>
                )}
              </div>

              <button
                onClick={handleCopyWallet}
                className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors mt-0.5"
                title="Copy wallet address"
              >
                {copiedWallet ? '✅ Copied!' : truncateAddress(user.walletAddress)}
              </button>

              <p className="text-white/20 text-[11px] mt-1">
                Member since {memberSince(user.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Stats Grid ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          {[
            { label: 'Drafts', value: stats.totalDrafts, emoji: '🎟️' },
            { label: 'Win Rate', value: `${stats.winRate}%`, emoji: '🏆' },
            { label: 'Winnings', value: `$${stats.totalWinnings}`, emoji: '💰' },
            { label: 'Avg Rank', value: stats.avgRank, emoji: '📊' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 sm:p-4 text-center"
            >
              <span className="text-lg">{s.emoji}</span>
              <p className="text-white font-bold text-lg sm:text-xl mt-1 tabular-nums">{s.value}</p>
              <p className="text-white/30 text-[10px] uppercase tracking-wider font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Quick Actions ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide"
        >
          {[
            { href: '/buy-drafts', label: '🎟️ Buy Drafts', primary: true },
            { href: '/draft-queue', label: '🏟️ Join Queue', primary: false },
            { href: '/standings', label: '📊 Standings', primary: false },
            { href: '/banana-wheel', label: '🍌 Spin', primary: false },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                action.primary
                  ? 'bg-banana text-black hover:brightness-110'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {action.label}
            </Link>
          ))}
        </motion.div>

        {/* ─── Inventory ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-banana font-bold text-2xl tabular-nums">{user.draftPasses + user.freeDrafts}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Draft Passes</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-banana font-bold text-2xl tabular-nums">{user.wheelSpins}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Wheel Spins</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
            <p className="text-banana font-bold text-2xl tabular-nums">{user.jackpotEntries + user.hofEntries}</p>
            <p className="text-white/30 text-[10px] uppercase tracking-wider">Special Entries</p>
          </div>
        </motion.div>

        {/* ─── Promo Status ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-6"
        >
          <h3 className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mb-3">Promos & Referrals</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{promoClaimed ? '✅' : '🎁'}</span>
                <div>
                  <p className="text-white text-sm font-medium">Welcome Gift — 50% Off</p>
                  <p className="text-white/30 text-xs">{promoClaimed ? 'Claimed' : 'Available — claim in Buy Drafts'}</p>
                </div>
              </div>
              {!promoClaimed && (
                <Link href="/buy-drafts" className="text-banana text-xs font-bold hover:underline">
                  Claim →
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔗</span>
                <div>
                  <p className="text-white text-sm font-medium">Referral Code</p>
                  <p className="text-white/30 text-xs font-mono">{truncateAddress(user.walletAddress)}</p>
                </div>
              </div>
              <button
                onClick={handleCopyWallet}
                className="text-banana text-xs font-bold hover:underline"
              >
                {copiedWallet ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── Tab Toggle ─── */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-4">
          {(['drafts', 'achievements'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                tab === t ? 'bg-banana text-black' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t === 'drafts' ? `🏈 My Drafts (${drafts.length})` : `🏅 Achievements (${unlockedCount}/${achievements.length})`}
            </button>
          ))}
        </div>

        {/* ─── Drafts Tab ─── */}
        <AnimatePresence mode="wait">
          {tab === 'drafts' && (
            <motion.div
              key="drafts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {drafts.map((draft, i) => {
                const typeConf = TYPE_CONFIG[draft.type];
                const statusConf = STATUS_CONFIG[draft.status];

                return (
                  <motion.div
                    key={draft.id}
                    custom={i}
                    variants={stagger}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={
                        draft.status === 'live'
                          ? `/draft-room?id=${draft.id}`
                          : draft.status === 'completed'
                            ? `/draft-results/${draft.id}`
                            : `/draft-room?id=${draft.id}&name=${encodeURIComponent(draft.name)}`
                      }
                      className="block"
                    >
                      <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] rounded-xl p-4 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl flex-shrink-0">{typeConf.emoji}</span>
                            <div className="min-w-0">
                              <h4 className="text-white font-semibold text-sm truncate">{draft.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                  style={{ color: typeConf.color, backgroundColor: `${typeConf.color}20` }}
                                >
                                  {typeConf.label}
                                </span>
                                <span className="text-white/20 text-[11px]">{formatDate(draft.date)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Rank/Grade */}
                            {draft.status === 'completed' && (
                              <div className="text-right">
                                {draft.winnings ? (
                                  <p className="text-green-400 text-sm font-bold">+${draft.winnings}</p>
                                ) : null}
                                <p className="text-white/30 text-[11px]">
                                  {draft.grade && <span className="text-white/50 font-medium">{draft.grade}</span>}
                                  {' '}#{draft.rank}/{draft.totalPlayers}
                                </p>
                              </div>
                            )}

                            {/* Status badge */}
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusConf.bg} ${statusConf.text} ${statusConf.pulse ? 'animate-pulse' : ''}`}>
                              {statusConf.label}
                            </span>

                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* ─── Achievements Tab ─── */}
          {tab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              {achievements.map((ach, i) => (
                <motion.div
                  key={ach.id}
                  custom={i}
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  className={`rounded-xl border p-4 transition-all ${
                    ach.unlocked
                      ? 'bg-banana/5 border-banana/20'
                      : 'bg-white/[0.02] border-white/[0.06] opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-2xl ${ach.unlocked ? '' : 'grayscale'}`}>{ach.emoji}</span>
                    {ach.unlocked && (
                      <span className="text-banana text-[10px] font-bold">✓</span>
                    )}
                  </div>
                  <h4 className={`font-semibold text-sm ${ach.unlocked ? 'text-white' : 'text-white/40'}`}>
                    {ach.name}
                  </h4>
                  <p className="text-white/30 text-xs mt-0.5">{ach.description}</p>

                  {/* Progress bar */}
                  {ach.maxProgress && (
                    <div className="mt-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${ach.unlocked ? 'bg-banana' : 'bg-white/20'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${((ach.progress || 0) / ach.maxProgress) * 100}%` }}
                          transition={{ delay: i * 0.05 + 0.3, duration: 0.5 }}
                        />
                      </div>
                      <p className="text-white/20 text-[10px] mt-1 tabular-nums">
                        {ach.progress || 0}/{ach.maxProgress}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
