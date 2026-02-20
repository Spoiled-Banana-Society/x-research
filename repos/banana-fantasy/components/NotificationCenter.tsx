'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────

export type NotificationType = 'draft_starting' | 'draft_results' | 'promo' | 'referral' | 'jackpot' | 'hof' | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

// ─── Config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, { emoji: string; color: string }> = {
  draft_starting: { emoji: '🏈', color: '#22c55e' },
  draft_results: { emoji: '📊', color: '#3b82f6' },
  promo: { emoji: '🎁', color: '#f59e0b' },
  referral: { emoji: '🔗', color: '#a855f7' },
  jackpot: { emoji: '🎰', color: '#ef4444' },
  hof: { emoji: '🏆', color: '#d4af37' },
  system: { emoji: '📢', color: '#6b7280' },
};

const STORAGE_KEY = 'sbs-notifications';
const MAX_NOTIFICATIONS = 50;

// ─── localStorage helpers ────────────────────────────────────────────────

function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultNotifications();
  } catch {
    return getDefaultNotifications();
  }
}

function saveNotifications(notifs: Notification[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS)));
  } catch { /* quota */ }
}

function getDefaultNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: 'n-1',
      type: 'system',
      title: 'Welcome to BBB4! 🍌',
      message: 'Season 4 is here. Buy your first draft pass and get drafting!',
      read: false,
      createdAt: new Date(now - 60000).toISOString(),
      link: '/buy-drafts',
    },
    {
      id: 'n-2',
      type: 'promo',
      title: 'Welcome Gift Available',
      message: 'Claim 50% off your first draft pass — limited time!',
      read: false,
      createdAt: new Date(now - 300000).toISOString(),
      link: '/buy-drafts',
    },
    {
      id: 'n-3',
      type: 'draft_starting',
      title: 'Draft Starting Soon',
      message: 'Banana Blitz #142 starts in 5 minutes. Get ready!',
      read: false,
      createdAt: new Date(now - 600000).toISOString(),
      link: '/draft-room?id=d-101',
    },
    {
      id: 'n-4',
      type: 'draft_results',
      title: 'Draft Complete — Grade A!',
      message: 'Your team in Peel Party #98 scored an A grade. View your results.',
      read: true,
      createdAt: new Date(now - 86400000).toISOString(),
      link: '/draft-results/d-099',
    },
    {
      id: 'n-5',
      type: 'referral',
      title: 'Referral Bonus Earned!',
      message: 'CryptoKing joined using your link. You earned a free draft pass!',
      read: true,
      createdAt: new Date(now - 172800000).toISOString(),
      link: '/referrals',
    },
    {
      id: 'n-6',
      type: 'jackpot',
      title: 'Jackpot Qualification',
      message: 'You\'ve qualified for the $50K Jackpot pool! Keep drafting for more entries.',
      read: true,
      createdAt: new Date(now - 345600000).toISOString(),
      link: '/jackpot-hof',
    },
  ];
}

// ─── Time formatting ─────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    setNotifications(prev => {
      const newNotif: Notification = {
        ...notif,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const updated = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  return { notifications, unreadCount, markAsRead, markAllRead, addNotification, clearAll };
}

// ─── Bell Icon Button ────────────────────────────────────────────────────

export function NotificationBell({ unreadCount, onClick }: { unreadCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? `: ${unreadCount} unread` : ''}`}
      className="relative flex items-center px-3 py-2 rounded-lg hover:bg-bg-tertiary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3E216]"
    >
      <span className="text-xl" aria-hidden="true">🔔</span>
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
    </button>
  );
}

// ─── Dropdown Panel ──────────────────────────────────────────────────────

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationPanel({ isOpen, onClose, notifications, unreadCount, onMarkRead, onMarkAllRead }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[480px] bg-bg-secondary border border-bg-tertiary rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-bg-tertiary">
            <div className="flex items-center gap-2">
              <h3 className="text-text-primary font-bold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  className="text-banana text-[11px] font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/notifications"
                onClick={onClose}
                className="text-text-muted text-[11px] hover:text-text-primary transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[400px] divide-y divide-bg-tertiary/50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-3xl opacity-30">🔔</span>
                <p className="text-text-muted text-xs mt-2">No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((notif, i) => {
                const config = TYPE_CONFIG[notif.type];
                const content = (
                  <motion.div
                    initial={i < 5 ? { opacity: 0, x: -8 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    onClick={() => {
                      if (!notif.read) onMarkRead(notif.id);
                      if (notif.link) onClose();
                    }}
                    className={`flex gap-3 px-4 py-3 hover:bg-bg-tertiary/40 transition-colors cursor-pointer ${
                      !notif.read ? 'bg-banana/[0.03]' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ backgroundColor: `${config.color}15` }}
                    >
                      {config.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-tight ${!notif.read ? 'text-text-primary' : 'text-text-secondary'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-banana flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-text-muted text-[11px] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                      <p className="text-text-muted/50 text-[10px] mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                  </motion.div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 15 && (
            <div className="px-4 py-2.5 border-t border-bg-tertiary text-center">
              <Link
                href="/notifications"
                onClick={onClose}
                className="text-banana text-xs font-medium hover:underline"
              >
                View all {notifications.length} notifications
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Combined Header Widget ─────────────────────────────────────────────

export function NotificationWidget() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <NotificationBell
        unreadCount={unreadCount}
        onClick={() => setIsOpen(!isOpen)}
      />
      <NotificationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markAsRead}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
}
