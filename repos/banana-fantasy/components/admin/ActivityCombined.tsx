'use client';

import { useState } from 'react';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { UserActivity } from '@/components/admin/UserActivity';

type View = 'admin' | 'users';

export function ActivityCombined({ enabled }: { enabled: boolean }) {
  const [view, setView] = useState<View>('admin');

  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-1 rounded-lg bg-gray-800/60 border border-gray-700 p-1">
        <SegmentButton active={view === 'admin'} onClick={() => setView('admin')}>
          Admin actions
        </SegmentButton>
        <SegmentButton active={view === 'users'} onClick={() => setView('users')}>
          User events
        </SegmentButton>
      </div>
      {view === 'admin' ? <RecentActivity enabled={enabled} /> : <UserActivity enabled={enabled} />}
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        active ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
