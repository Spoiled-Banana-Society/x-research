'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { useAuth } from '@/hooks/useAuth';
import { isWalletAdmin } from '@/lib/adminAllowlist';
import { SkeletonStatGrid, SkeletonTable } from '@/components/ui/Skeleton';

/* ────────── Types ────────── */

type AdminStats = {
  totalUsers: number;
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
  verifiedUsers: number;
};

type WithdrawalItem = {
  id: string;
  userId: string;
  walletAddress: string;
  amount: number;
  status: string;
  createdAt: string | null;
  blueCheckVerified: boolean;
};

type UserItem = {
  id: string;
  walletAddress: string;
  email: string | null;
  createdAt: string | null;
  blueCheckVerified: boolean;
  banned?: boolean;
};

type UsersResponse = {
  users: UserItem[];
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
};

type DraftItem = {
  id: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  entryFee: number;
};

type DraftSummary = { active: number; completed: number; pending: number; total: number };

type PromoItem = {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string | null;
};

type TabKey = 'overview' | 'users' | 'drafts' | 'withdrawals' | 'promos' | 'season' | 'health' | 'revenue';

/* ────────── Helpers ────────── */

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

/* ────────── Component ────────── */

export default function AdminPage() {
  const router = useRouter();
  const privy = usePrivy();
  const { walletAddress, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersOffset, setUsersOffset] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [draftSummary, setDraftSummary] = useState<DraftSummary>({ active: 0, completed: 0, pending: 0, total: 0 });
  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: 50, maxUses: '' });

  // Grant free drafts form
  const [grantForm, setGrantForm] = useState({ identifier: '', count: '1' });
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantResult, setGrantResult] = useState<{ ok: boolean; message: string } | null>(null);

  const USERS_LIMIT = 50;

  const tabs: { key: TabKey; label: string; icon: string }[] = useMemo(() => [
    { key: 'overview', label: 'Dashboard', icon: '📊' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'drafts', label: 'Drafts', icon: '🏈' },
    { key: 'withdrawals', label: 'Withdrawals', icon: '💰' },
    { key: 'promos', label: 'Promos', icon: '🎟️' },
    { key: 'season', label: 'Season', icon: '📅' },
    { key: 'health', label: 'System', icon: '🟢' },
    { key: 'revenue', label: 'Revenue', icon: '💵' },
  ], []);

  const authHeaders = useCallback(async (): Promise<HeadersInit> => {
    const token = await privy.getAccessToken();
    if (!token) throw new Error('Missing Privy access token');
    return { Authorization: `Bearer ${token}` };
  }, [privy]);

  /* ── Loaders ── */

  const loadStats = useCallback(async () => {
    const res = await fetch('/api/admin/stats', { headers: await authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    setStats(await res.json() as AdminStats);
  }, [authHeaders]);

  const loadWithdrawals = useCallback(async () => {
    const res = await fetch('/api/admin/withdrawals', { headers: await authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    setWithdrawals(await res.json() as WithdrawalItem[]);
  }, [authHeaders]);

  const loadUsers = useCallback(async () => {
    const q = new URLSearchParams({ limit: String(USERS_LIMIT), offset: String(usersOffset) });
    const res = await fetch(`/api/admin/users?${q}`, { headers: await authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as UsersResponse;
    setUsers(data.users);
    setUsersTotal(data.pagination.total);
  }, [authHeaders, usersOffset]);

  const loadDrafts = useCallback(async () => {
    const res = await fetch('/api/admin/drafts', { headers: await authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { drafts: DraftItem[]; summary: DraftSummary };
    setDrafts(data.drafts);
    setDraftSummary(data.summary);
  }, [authHeaders]);

  const loadPromos = useCallback(async () => {
    const res = await fetch('/api/admin/promos', { headers: await authHeaders(), cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { promos: PromoItem[] };
    setPromos(data.promos);
  }, [authHeaders]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadWithdrawals()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadWithdrawals]);

  /* ── Actions ── */

  const handleWithdrawalStatus = useCallback(async (id: string, status: 'approved' | 'denied') => {
    try {
      setError(null);
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json() as WithdrawalItem;
      setWithdrawals((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  }, [authHeaders, loadStats]);

  const handleGrantDrafts = useCallback(async () => {
    const identifier = grantForm.identifier.trim();
    const count = Number(grantForm.count);
    if (!identifier) {
      setGrantResult({ ok: false, message: 'Enter a wallet or username' });
      return;
    }
    if (!Number.isFinite(count) || !Number.isInteger(count) || count === 0) {
      setGrantResult({ ok: false, message: 'Count must be a non-zero integer' });
      return;
    }
    setGrantBusy(true);
    setGrantResult(null);
    try {
      const res = await fetch('/api/admin/grant-drafts', {
        method: 'POST',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGrantResult({ ok: false, message: data.error || `Failed (${res.status})` });
      } else {
        const who = data.username || data.walletAddress || data.userId;
        setGrantResult({
          ok: true,
          message: `Granted ${data.granted > 0 ? '+' : ''}${data.granted} to ${who} — now at ${data.freeDrafts} free draft${data.freeDrafts === 1 ? '' : 's'}`,
        });
        setGrantForm({ identifier: '', count: '1' });
      }
    } catch (err) {
      setGrantResult({ ok: false, message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setGrantBusy(false);
    }
  }, [grantForm, authHeaders]);

  const handleBanUser = useCallback(async (userId: string, banned: boolean) => {
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ banned }),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ban action failed');
    }
  }, [authHeaders]);

  const handleCreatePromo = useCallback(async () => {
    if (!newPromo.code.trim()) return;
    try {
      setError(null);
      const res = await fetch('/api/admin/promos', {
        method: 'POST',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPromo.code,
          discountPercent: newPromo.discountPercent,
          maxUses: newPromo.maxUses ? parseInt(newPromo.maxUses, 10) : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewPromo({ code: '', discountPercent: 50, maxUses: '' });
      await loadPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create promo failed');
    }
  }, [authHeaders, newPromo, loadPromos]);

  /* ── Effects ── */

  useEffect(() => {
    if (isLoading) return;
    if (!walletAddress || !isWalletAdmin(walletAddress)) { router.replace('/'); return; }
    setIsAuthorized(true);
  }, [isLoading, router, walletAddress]);

  useEffect(() => { if (isAuthorized) void loadAll(); }, [isAuthorized, loadAll]);

  useEffect(() => {
    if (!isAuthorized) return;
    if (activeTab === 'users') void loadUsers();
    if (activeTab === 'drafts') void loadDrafts();
    if (activeTab === 'promos') void loadPromos();
  }, [activeTab, isAuthorized, loadUsers, loadDrafts, loadPromos]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter((u) =>
      u.walletAddress.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍌</span>
            <h1 className="text-xl font-bold">SBS Admin</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3E216]/20 text-[#F3E216] border border-[#F3E216]/30 font-medium">
              BBB4
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono">{formatWallet(walletAddress || '')}</span>
            <button
              type="button"
              onClick={() => void loadAll()}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-sm transition-colors"
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-3 text-red-400 hover:text-red-300">✕</button>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === t.key
                  ? 'bg-[#F3E216] text-black'
                  : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800 border border-gray-700/50'
              }`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
              <StatCard label="Verified Users" value={stats?.verifiedUsers ?? 0} sub={stats ? `${((stats.verifiedUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(0)}% verified` : undefined} />
              <StatCard label="Pending Withdrawals" value={stats?.pendingWithdrawals ?? 0} />
              <StatCard label="Total Withdrawals" value={`$${stats?.totalWithdrawalAmount?.toLocaleString() ?? 0}`} />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Active Drafts" value={draftSummary.active} />
              <StatCard label="Completed Drafts" value={draftSummary.completed} />
              <StatCard label="Pending Drafts" value={draftSummary.pending} />
              <StatCard label="Total Drafts" value={draftSummary.total} />
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveTab('users')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">👥 Manage Users</button>
                <button type="button" onClick={() => setActiveTab('drafts')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">🏈 View Drafts</button>
                <button type="button" onClick={() => setActiveTab('withdrawals')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">💰 Review Withdrawals</button>
                <button type="button" onClick={() => setActiveTab('promos')} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">🎟️ Create Promo</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ USERS TAB ═══ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Grant free drafts */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">Grant Free Drafts</h3>
                <span className="text-xs text-gray-500">Wallet (0x…) or username</span>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="0xabc… or username"
                  value={grantForm.identifier}
                  onChange={(e) => setGrantForm((f) => ({ ...f, identifier: e.target.value }))}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#F3E216]/50"
                />
                <input
                  type="number"
                  placeholder="Count"
                  value={grantForm.count}
                  onChange={(e) => setGrantForm((f) => ({ ...f, count: e.target.value }))}
                  className="w-full md:w-24 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#F3E216]/50"
                />
                <button
                  type="button"
                  onClick={() => void handleGrantDrafts()}
                  disabled={grantBusy}
                  className="px-4 py-2.5 rounded-lg bg-[#F3E216] hover:bg-[#F3E216]/90 text-black font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {grantBusy ? 'Granting…' : 'Grant'}
                </button>
              </div>
              {grantResult && (
                <p className={`mt-2 text-xs ${grantResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                  {grantResult.message}
                </p>
              )}
              <p className="mt-2 text-[11px] text-gray-500">
                Negative counts revoke drafts. Max ±1000 per request.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by wallet, email, or ID…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[#F3E216]/50"
              />
              <span className="text-sm text-gray-500">{usersTotal} total</span>
            </div>

            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{formatWallet(u.walletAddress)}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{u.email || '—'}</td>
                      <td className="px-4 py-3">{u.blueCheckVerified ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>}</td>
                      <td className="px-4 py-3">
                        {u.banned ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${statusBadge('banned')}`}>Banned</span>
                        ) : (
                          <span className="text-green-400 text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.banned ? (
                          <button type="button" onClick={() => void handleBanUser(u.id, false)} className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs">Unban</button>
                        ) : (
                          <button type="button" onClick={() => void handleBanUser(u.id, true)} className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs">Ban</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {users.length === 0 ? 0 : usersOffset + 1}–{Math.min(usersOffset + users.length, usersTotal)} of {usersTotal}
              </p>
              <div className="flex gap-2">
                <button type="button" disabled={usersOffset === 0} onClick={() => setUsersOffset((p) => Math.max(p - USERS_LIMIT, 0))} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-xs disabled:opacity-40">← Prev</button>
                <button type="button" disabled={usersOffset + users.length >= usersTotal} onClick={() => setUsersOffset((p) => p + USERS_LIMIT)} className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800 text-xs disabled:opacity-40">Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DRAFTS TAB ═══ */}
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
                    <th className="px-4 py-3">Draft</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Players</th>
                    <th className="px-4 py-3">Entry Fee</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No drafts found</td></tr>
                  ) : drafts.map((d) => (
                    <tr key={d.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{d.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{d.id.slice(0, 12)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border capitalize ${statusBadge(d.status)}`}>{d.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{d.playerCount}/{d.maxPlayers}</td>
                      <td className="px-4 py-3 text-gray-300">${d.entryFee}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ WITHDRAWALS TAB ═══ */}
        {activeTab === 'withdrawals' && (
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Wallet</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No withdrawal requests</td></tr>
                ) : withdrawals.map((w) => (
                  <tr key={w.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{formatWallet(w.walletAddress)}</td>
                    <td className="px-4 py-3 font-semibold">${w.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border capitalize ${statusBadge(w.status)}`}>{w.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(w.createdAt)}</td>
                    <td className="px-4 py-3">{w.blueCheckVerified ? <span className="text-green-400">✓</span> : '—'}</td>
                    <td className="px-4 py-3">
                      {w.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => void handleWithdrawalStatus(w.id, 'approved')} className="px-2 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs">✓ Approve</button>
                          <button type="button" onClick={() => void handleWithdrawalStatus(w.id, 'denied')} className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs">✕ Deny</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ PROMOS TAB ═══ */}
        {activeTab === 'promos' && (
          <div className="space-y-6">
            {/* Create Promo */}
            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Create Promo Code</h3>
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Code (e.g. BBB4LAUNCH)"
                  value={newPromo.code}
                  onChange={(e) => setNewPromo((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm w-48 focus:outline-none focus:border-[#F3E216]/50"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newPromo.discountPercent}
                    onChange={(e) => setNewPromo((p) => ({ ...p, discountPercent: parseInt(e.target.value, 10) || 0 }))}
                    className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white text-sm w-20 focus:outline-none focus:border-[#F3E216]/50"
                  />
                  <span className="text-gray-400 text-sm">% off</span>
                </div>
                <input
                  type="text"
                  placeholder="Max uses (empty = unlimited)"
                  value={newPromo.maxUses}
                  onChange={(e) => setNewPromo((p) => ({ ...p, maxUses: e.target.value }))}
                  className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 text-sm w-48 focus:outline-none focus:border-[#F3E216]/50"
                />
                <button
                  type="button"
                  onClick={() => void handleCreatePromo()}
                  className="px-4 py-2 rounded-lg bg-[#F3E216] text-black font-medium text-sm hover:bg-[#F3E216]/90 transition-colors"
                >
                  + Create
                </button>
              </div>
            </div>

            {/* Promos List */}
            <div className="rounded-xl border border-gray-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Discount</th>
                    <th className="px-4 py-3">Uses</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No promo codes found</td></tr>
                  ) : promos.map((p) => (
                    <tr key={p.id} className="border-t border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-[#F3E216]">{p.code}</td>
                      <td className="px-4 py-3">{p.discountPercent}%</td>
                      <td className="px-4 py-3 text-gray-300">{p.currentUses}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs border ${p.active ? statusBadge('active') : statusBadge('denied')}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ SEASON TAB ═══ */}
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

            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Week Advancement</h3>
              <p className="text-sm text-gray-300 mb-4">
                The <code className="bg-gray-900 px-1.5 py-0.5 rounded text-xs">advanceWeek</code> Cloud Function handles automatic week transitions.
                It updates scores, standings, and elimination results.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
                >
                  Open Firebase Console →
                </a>
                <a
                  href="https://console.cloud.google.com/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
                >
                  Cloud Functions →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HEALTH TAB ═══ */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Frontend (Vercel)', url: 'https://bananabestball.com', status: 'operational' },
                { name: 'Draft Server (Go)', url: 'EC2 :8000', status: 'operational' },
                { name: 'Drafts API (Go)', url: 'EC2 :7070', status: 'operational' },
                { name: 'Firebase', url: 'Firestore + Auth', status: 'operational' },
                { name: 'Redis', url: 'localhost:6379', status: 'operational' },
                { name: 'Cloud Functions', url: 'GCP', status: 'operational' },
              ].map((svc) => (
                <div key={svc.name} className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{svc.name}</p>
                    <p className="text-xs text-gray-500">{svc.url}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    {svc.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Deployment Info</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Frontend</p>
                  <p className="text-gray-300">Vercel (auto-deploy from main)</p>
                </div>
                <div>
                  <p className="text-gray-500">Backend</p>
                  <p className="text-gray-300">EC2 (manual deploy)</p>
                </div>
                <div>
                  <p className="text-gray-500">Database</p>
                  <p className="text-gray-300">Firebase Firestore</p>
                </div>
                <div>
                  <p className="text-gray-500">Auth</p>
                  <p className="text-gray-300">Privy (wallet-based)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ REVENUE TAB ═══ */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Today" value="$0" sub="Pre-launch" />
              <StatCard label="This Week" value="$0" sub="Pre-launch" />
              <StatCard label="This Month" value="$0" sub="Pre-launch" />
              <StatCard label="All Time" value={`$${stats?.totalWithdrawalAmount?.toLocaleString() ?? 0}`} sub="Total withdrawal volume" />
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Revenue Overview</h3>
              {/* Mock chart placeholder */}
              <div className="h-64 flex items-center justify-center border border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-4xl mb-2">📈</p>
                  <p className="text-gray-400 text-sm">Revenue charts will populate after BBB4 launch</p>
                  <p className="text-gray-600 text-xs mt-1">June 9, 2026</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-5">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Revenue Sources</h3>
              <div className="space-y-3">
                {[
                  { source: 'Draft Entry Fees', pct: 0 },
                  { source: 'Prize Wheel Spins', pct: 0 },
                  { source: 'Draft Pass Sales', pct: 0 },
                ].map((r) => (
                  <div key={r.source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{r.source}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-[#F3E216] rounded-full" style={{ width: `${r.pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{r.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
