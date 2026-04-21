'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { useAuth } from '@/hooks/useAuth';
import { isWalletAdmin } from '@/lib/adminAllowlist';
import { SkeletonStatGrid, SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import {
  useAdminStats,
  useAdminWithdrawals,
  useAdminDrafts,
  useAdminPromos,
  useUpdateWithdrawalStatus,
  AdminApiError,
  type AdminWithdrawalItem,
  type AdminPromoItem,
} from '@/hooks/admin/useAdminApi';
import { UsersTable } from '@/components/admin/UsersTable';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { UserActivity } from '@/components/admin/UserActivity';
import { MetricsDashboard } from '@/components/admin/MetricsDashboard';
import { ErrorLog } from '@/components/admin/ErrorLog';

type TabKey = 'metrics' | 'errors' | 'overview' | 'users' | 'drafts' | 'withdrawals' | 'promos' | 'activity' | 'user-activity' | 'season' | 'health' | 'revenue';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatWallet(value: string): string {
  if (!value) return '—';
  return value.length < 12 ? value : `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function statusBadge(status: string): string {
  const s = status.toLowerCase();
  if (['approved', 'completed', 'finished', 'active'].includes(s)) return 'bg-green-500/20 text-green-300 border-green-500/40';
  if (['denied', 'failed', 'cancelled', 'banned'].includes(s)) return 'bg-red-500/20 text-red-300 border-red-500/40';
  return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5 backdrop-blur">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub ? <p className="text-xs text-gray-500 mt-1">{sub}</p> : null}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { walletAddress, isLoading } = useAuth();
  const { show } = useToast();

  const [activeTab, setActiveTab] = useState<TabKey>('metrics');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const tabs: { key: TabKey; label: string; icon: string }[] = useMemo(() => [
    { key: 'metrics', label: 'Metrics', icon: '📈' },
    { key: 'errors', label: 'Errors', icon: '🚨' },
    { key: 'overview', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'drafts', label: 'Drafts', icon: '🏈' },
    { key: 'withdrawals', label: 'Withdrawals', icon: '💰' },
    { key: 'promos', label: 'Promos', icon: '🎟️' },
    { key: 'activity', label: 'Admin Activity', icon: '📝' },
    { key: 'user-activity', label: 'User Activity', icon: '👁️' },
    { key: 'season', label: 'Season', icon: '📅' },
    { key: 'health', label: 'System', icon: '🟢' },
    { key: 'revenue', label: 'Revenue', icon: '💵' },
  ], []);

  // Gate access
  useEffect(() => {
    if (isLoading) return;
    if (!walletAddress || !isWalletAdmin(walletAddress)) {
      router.replace('/');
      return;
    }
    setIsAuthorized(true);
  }, [isLoading, router, walletAddress]);

  // Only-when-authorized queries — each tab's data loads independently via React Query
  const statsQuery = useAdminStats(isAuthorized);
  const withdrawalsQuery = useAdminWithdrawals(isAuthorized);
  const draftsQuery = useAdminDrafts(isAuthorized && (activeTab === 'drafts' || activeTab === 'overview'));
  const promosQuery = useAdminPromos(isAuthorized && activeTab === 'promos');

  // Surface query errors as toasts (non-blocking)
  useEffect(() => {
    for (const q of [statsQuery, withdrawalsQuery, draftsQuery, promosQuery]) {
      if (q.isError && q.error) {
        const e = q.error as AdminApiError;
        Sentry.captureException(e, { tags: { admin: true }, extra: { requestId: e.requestId } });
        show({ level: 'error', message: e.message || 'Admin request failed', requestId: e.requestId });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsQuery.isError, withdrawalsQuery.isError, draftsQuery.isError, promosQuery.isError]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <SkeletonStatGrid count={4} />
          <SkeletonTable rows={5} cols={5} />
        </div>
      </div>
    );
  }

  const stats = statsQuery.data;
  const withdrawals = withdrawalsQuery.data ?? [];
  const drafts = draftsQuery.data?.drafts ?? [];
  const draftSummary = draftsQuery.data?.summary ?? { active: 0, completed: 0, pending: 0, total: 0 };
  const promos = promosQuery.data?.promos ?? [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🍌 SBS Admin <span className="text-xs font-normal ml-2 px-2 py-0.5 rounded bg-[#F3E216]/20 text-[#F3E216] border border-[#F3E216]/40">BBB4</span></h1>
            <p className="text-gray-400 text-sm mt-1">Wallet: <span className="font-mono">{formatWallet(walletAddress ?? '')}</span></p>
          </div>
          <button
            onClick={() => {
              statsQuery.refetch();
              withdrawalsQuery.refetch();
              if (activeTab === 'drafts') draftsQuery.refetch();
              if (activeTab === 'promos') promosQuery.refetch();
            }}
            className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs"
          >
            ↻ Refresh
          </button>
        </header>

        {/* Tabs */}
        <nav className="mb-6 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'bg-[#F3E216] text-black font-semibold' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* METRICS */}
        {activeTab === 'metrics' && <MetricsDashboard enabled={isAuthorized} />}

        {/* ERRORS */}
        {activeTab === 'errors' && <ErrorLog enabled={isAuthorized} />}

        {/* DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {statsQuery.isLoading ? (
              <SkeletonStatGrid count={4} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
                <StatCard label="Verified Users" value={stats?.verifiedUsers ?? 0} />
                <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} />
                <StatCard label="Total Withdrawals" value={`$${(stats?.totalWithdrawalAmount ?? 0).toLocaleString()}`} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Draft Activity</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div><p className="text-xl font-bold text-green-400">{draftSummary.active}</p><p className="text-xs text-gray-500">Active</p></div>
                  <div><p className="text-xl font-bold text-yellow-400">{draftSummary.pending}</p><p className="text-xs text-gray-500">Pending</p></div>
                  <div><p className="text-xl font-bold text-blue-400">{draftSummary.completed}</p><p className="text-xs text-gray-500">Completed</p></div>
                  <div><p className="text-xl font-bold">{draftSummary.total}</p><p className="text-xs text-gray-500">Total</p></div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab('users')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">👥 Manage Users</button>
                  <button onClick={() => setActiveTab('withdrawals')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">💰 Review Withdrawals</button>
                  <button onClick={() => setActiveTab('activity')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">📝 Recent Activity</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && <UsersTable enabled={isAuthorized} />}

        {/* DRAFTS */}
        {activeTab === 'drafts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Active" value={draftSummary.active} />
              <StatCard label="Pending" value={draftSummary.pending} />
              <StatCard label="Completed" value={draftSummary.completed} />
              <StatCard label="Total" value={draftSummary.total} />
            </div>

            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Players</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 text-right">Entry</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No drafts found</td></tr>
                  ) : drafts.map((d) => (
                    <tr key={d.id} className="border-t border-gray-800/50">
                      <td className="px-4 py-3 font-mono text-xs">{d.id.slice(0, 12)}</td>
                      <td className="px-4 py-3 text-gray-300">{d.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${statusBadge(d.status)}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{d.playerCount}/{d.maxPlayers}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(d.createdAt)}</td>
                      <td className="px-4 py-3 text-right text-xs">${d.entryFee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WITHDRAWALS */}
        {activeTab === 'withdrawals' && <WithdrawalsPanel items={withdrawals} />}

        {/* PROMOS */}
        {activeTab === 'promos' && <PromosPanel items={promos} />}

        {/* ADMIN ACTIVITY */}
        {activeTab === 'activity' && <RecentActivity enabled={isAuthorized} />}

        {/* USER ACTIVITY */}
        {activeTab === 'user-activity' && <UserActivity enabled={isAuthorized} />}

        {/* SEASON */}
        {activeTab === 'season' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6">
              <h3 className="text-lg font-semibold mb-4">Season Controls</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Current Season</p>
                  <p className="text-3xl font-bold text-[#F3E216]">BBB4</p>
                  <p className="text-sm text-gray-500 mt-1">Best Ball Banana Season 4</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">NFL Week</p>
                  <p className="text-3xl font-bold">Pre-Season</p>
                  <p className="text-sm text-gray-500 mt-1">Regular season starts Sep 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEALTH */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Frontend (Vercel)', url: 'banana-fantasy-sbs.vercel.app' },
                { name: 'Draft Server (Go)', url: 'sbs-drafts-server-staging' },
                { name: 'Drafts API (Go)', url: 'sbs-drafts-api-staging' },
                { name: 'Firebase', url: 'sbs-staging-env' },
                { name: 'Privy Auth', url: 'auth.privy.io' },
                { name: 'Sentry', url: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'NOT configured' },
              ].map((svc) => (
                <div key={svc.name} className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{svc.name}</p>
                    <p className="text-xs text-gray-500 break-all">{svc.url}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> operational
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVENUE */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today" value="$0" sub="Pre-launch" />
              <StatCard label="This Week" value="$0" sub="Pre-launch" />
              <StatCard label="This Month" value="$0" sub="Pre-launch" />
              <StatCard label="All Time" value={`$${stats?.totalWithdrawalAmount?.toLocaleString() ?? 0}`} sub="Total withdrawal volume" />
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6">
              <p className="text-gray-400 text-sm">Revenue charts will populate after BBB4 launch (June 9, 2026).</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────── Withdrawals ────────── */

function WithdrawalsPanel({ items }: { items: AdminWithdrawalItem[] }) {
  const update = useUpdateWithdrawalStatus();
  const { show } = useToast();

  const handle = async (id: string, status: 'approved' | 'denied') => {
    try {
      const res = await update.mutateAsync({ id, status });
      show({ level: 'success', message: `Withdrawal ${status}`, requestId: res.requestId });
    } catch (err) {
      const e = err as AdminApiError;
      Sentry.captureException(e, { tags: { admin: true, action: 'withdrawal-status' }, extra: { id, status, requestId: e.requestId } });
      show({ level: 'error', message: e.message, requestId: e.requestId });
    }
  };

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Created</th>
            <th className="px-4 py-3">Wallet</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No withdrawals</td></tr>
          ) : items.map((w) => (
            <tr key={w.id} className="border-t border-gray-800/50">
              <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(w.createdAt)}</td>
              <td className="px-4 py-3 font-mono text-xs">{formatWallet(w.walletAddress)}</td>
              <td className="px-4 py-3 text-right">${w.amount.toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${statusBadge(w.status)}`}>{w.status}</span>
              </td>
              <td className="px-4 py-3">
                {w.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => handle(w.id, 'approved')} disabled={update.isPending} className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs disabled:opacity-50">Approve</button>
                    <button onClick={() => handle(w.id, 'denied')} disabled={update.isPending} className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs disabled:opacity-50">Deny</button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ────────── Promos ────────── */

function PromosPanel({ items }: { items: AdminPromoItem[] }) {
  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3 text-right">Discount</th>
            <th className="px-4 py-3 text-right">Uses</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Expires</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No promos yet</td></tr>
          ) : items.map((p) => (
            <tr key={p.id} className="border-t border-gray-800/50">
              <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
              <td className="px-4 py-3 text-right">{p.discountPercent}%</td>
              <td className="px-4 py-3 text-right text-xs">{p.currentUses}{p.maxUses ? `/${p.maxUses}` : ''}</td>
              <td className="px-4 py-3">
                {p.active ? <span className="text-green-400 text-xs">✓</span> : <span className="text-gray-600 text-xs">—</span>}
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.expiresAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
