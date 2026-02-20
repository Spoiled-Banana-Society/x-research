'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, type NotificationType } from '@/components/NotificationCenter';

const TYPE_CONFIG: Record<NotificationType, { emoji: string; color: string; label: string }> = {
  draft_starting: { emoji: '🏈', color: '#22c55e', label: 'Draft' },
  draft_results: { emoji: '📊', color: '#3b82f6', label: 'Results' },
  promo: { emoji: '🎁', color: '#f59e0b', label: 'Promo' },
  referral: { emoji: '🔗', color: '#a855f7', label: 'Referral' },
  jackpot: { emoji: '🎰', color: '#ef4444', label: 'Jackpot' },
  hof: { emoji: '🏆', color: '#d4af37', label: 'HOF' },
  system: { emoji: '📢', color: '#6b7280', label: 'System' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.25, ease: 'easeOut' as const },
  }),
};

type FilterKey = 'all' | 'unread' | NotificationType;

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications();
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All (${notifications.length})` },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'draft_starting', label: '🏈 Drafts' },
    { key: 'promo', label: '🎁 Promos' },
    { key: 'referral', label: '🔗 Referrals' },
    { key: 'system', label: '📢 System' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 sm:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-white text-2xl sm:text-3xl font-bold">Notifications</h1>
            <p className="text-white/40 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up 🍌'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 bg-banana/10 text-banana text-xs font-bold rounded-lg hover:bg-banana/20 transition-colors"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="px-3 py-1.5 bg-white/5 text-white/30 text-xs font-medium rounded-lg hover:bg-white/10 hover:text-white/50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1.5 mb-5 overflow-x-auto pb-1 scrollbar-hide"
        >
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                filter === f.key
                  ? 'bg-banana text-black'
                  : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
              }`}
            >
              {f.label}
            </button>
          ))}
        </motion.div>

        {/* Notification List */}
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="text-4xl mb-3 opacity-30">🔔</div>
                <p className="text-white/30 text-sm">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </motion.div>
            ) : (
              filtered.map((notif, i) => {
                const config = TYPE_CONFIG[notif.type];
                const inner = (
                  <motion.div
                    key={notif.id}
                    custom={i}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                    layout
                    onClick={() => { if (!notif.read) markAsRead(notif.id); }}
                    className={`flex gap-3 sm:gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                      !notif.read
                        ? 'bg-banana/[0.04] border-banana/10 hover:bg-banana/[0.06]'
                        : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      {config.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${!notif.read ? 'text-white' : 'text-white/70'}`}>
                              {notif.title}
                            </p>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                              style={{ color: config.color, backgroundColor: `${config.color}15` }}
                            >
                              {config.label}
                            </span>
                          </div>
                          <p className="text-white/40 text-xs mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notif.read && <div className="w-2.5 h-2.5 rounded-full bg-banana" />}
                        </div>
                      </div>
                      <p className="text-white/20 text-[10px] mt-1.5">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </motion.div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} className="block">
                    {inner}
                  </Link>
                ) : (
                  <div key={notif.id}>{inner}</div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
