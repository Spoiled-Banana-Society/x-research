'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  {
    href: '/drafting',
    label: 'Draft',
    // Football icon
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="10" ry="7" />
        <path d="M12 5v14" />
        <path d="M7 8.5l10 7" />
        <path d="M7 15.5l10-7" />
      </svg>
    ),
    matchPaths: ['/drafting', '/draft-room', '/buy-drafts', '/special-drafts'],
  },
  {
    href: '/banana-wheel',
    label: 'Spin',
    // Wheel / star icon
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v7" />
        <path d="M12 15v7" />
        <path d="M2 12h7" />
        <path d="M15 12h7" />
      </svg>
    ),
    matchPaths: ['/banana-wheel'],
  },
  {
    href: '/standings',
    label: 'Teams',
    // Chart / bar icon
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
      </svg>
    ),
    matchPaths: ['/standings', '/exposure', '/leaderboard'],
  },
  {
    href: '/marketplace',
    label: 'Market',
    // Tag / price icon
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#fbbf24' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    matchPaths: ['/marketplace'],
  },
];

export function MobileTabBar() {
  const pathname = usePathname();

  // Don't show in draft room — it has its own UI
  if (pathname.startsWith('/draft-room')) return null;

  const isActive = (tab: typeof tabs[0]) =>
    tab.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(tab => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? 'text-banana' : 'text-white/35'
              }`}
            >
              {tab.icon(active)}
              <span className={`text-[10px] font-medium ${active ? 'text-banana' : 'text-white/35'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
