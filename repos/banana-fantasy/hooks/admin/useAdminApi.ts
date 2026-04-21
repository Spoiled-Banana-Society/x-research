'use client';

import { useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

/* ────────── Types ────────── */

export interface AdminStats {
  totalUsers: number;
  pendingWithdrawals: number;
  totalWithdrawalAmount: number;
  verifiedUsers: number;
}

export interface AdminUser {
  id: string;
  walletAddress: string;
  username: string | null;
  email: string | null;
  createdAt: string | null;
  blueCheckVerified: boolean;
  banned: boolean;
  freeDrafts: number;
  wheelSpins: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  requestId?: string;
}

export interface AdminWithdrawalItem {
  id: string;
  userId: string;
  walletAddress: string;
  amount: number;
  status: string;
  createdAt: string | null;
  blueCheckVerified: boolean;
}

export interface AdminDraftItem {
  id: string;
  name: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  entryFee: number;
}

export interface AdminDraftsResponse {
  drafts: AdminDraftItem[];
  summary: { active: number; completed: number; pending: number; total: number };
  requestId?: string;
}

export interface AdminPromoItem {
  id: string;
  code: string;
  discountPercent: number;
  maxUses: number | null;
  currentUses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string | null;
}

export interface AdminAuditEntry {
  actor: string;
  action: string;
  target: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  requestId: string;
  timestamp: string;
}

export interface UserEventEntry {
  userId: string;
  eventType: string;
  meta?: Record<string, unknown>;
  timestamp: string;
}

/* ────────── Auth headers hook ────────── */

export function useAdminAuthHeaders() {
  const privy = usePrivy();
  return useCallback(async (): Promise<HeadersInit> => {
    const token = await privy.getAccessToken();
    if (!token) throw new Error('Missing Privy access token');
    return { Authorization: `Bearer ${token}` };
  }, [privy]);
}

/* ────────── Core fetcher ────────── */

class AdminApiError extends Error {
  status: number;
  requestId?: string;
  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.status = status;
    this.requestId = requestId;
  }
}

async function adminFetch<T>(
  url: string,
  getHeaders: () => Promise<HeadersInit>,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const headers = await getHeaders();
    const res = await fetch(url, {
      ...init,
      headers: { ...headers, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
      signal: controller.signal,
    });

    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      /* non-json */
    }

    const requestId = (payload as { requestId?: string } | null)?.requestId;
    if (!res.ok) {
      const msg = (payload as { error?: string } | null)?.error || res.statusText || 'Request failed';
      throw new AdminApiError(msg, res.status, requestId);
    }
    return payload as T;
  } catch (err) {
    if (err instanceof AdminApiError) throw err;
    if ((err as Error).name === 'AbortError') {
      throw new AdminApiError('Request timed out after 20s', 504);
    }
    throw new AdminApiError((err as Error).message || 'Network error', 0);
  } finally {
    clearTimeout(timeout);
  }
}

/* ────────── Queries ────────── */

export function useAdminStats(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<AdminStats>({
    queryKey: ['admin', 'stats'],
    enabled,
    queryFn: () => adminFetch<AdminStats>('/api/admin/stats', getHeaders),
  });
}

export function useAdminUsers(enabled: boolean, offset: number, limit: number, q: string) {
  const getHeaders = useAdminAuthHeaders();
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (offset) params.set('offset', String(offset));
  if (q.trim()) params.set('q', q.trim());
  return useQuery<AdminUsersResponse>({
    queryKey: ['admin', 'users', { offset, limit, q: q.trim() }],
    enabled,
    queryFn: () => adminFetch<AdminUsersResponse>(`/api/admin/users?${params}`, getHeaders),
    placeholderData: keepPreviousData,
  });
}

export function useAdminDrafts(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<AdminDraftsResponse>({
    queryKey: ['admin', 'drafts'],
    enabled,
    queryFn: () => adminFetch<AdminDraftsResponse>('/api/admin/drafts', getHeaders),
  });
}

export function useAdminWithdrawals(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<AdminWithdrawalItem[]>({
    queryKey: ['admin', 'withdrawals'],
    enabled,
    queryFn: () => adminFetch<AdminWithdrawalItem[]>('/api/admin/withdrawals', getHeaders),
  });
}

export function useAdminPromos(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<{ promos: AdminPromoItem[] }>({
    queryKey: ['admin', 'promos'],
    enabled,
    queryFn: () => adminFetch<{ promos: AdminPromoItem[] }>('/api/admin/promos', getHeaders),
  });
}

export function useRecentAdminActions(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<{ actions: AdminAuditEntry[]; requestId?: string }>({
    queryKey: ['admin', 'recent-actions'],
    enabled,
    queryFn: () =>
      adminFetch<{ actions: AdminAuditEntry[]; requestId?: string }>('/api/admin/recent-actions?limit=100', getHeaders),
  });
}

export function useRecentUserEvents(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<{ events: UserEventEntry[]; requestId?: string }>({
    queryKey: ['admin', 'user-events'],
    enabled,
    queryFn: () =>
      adminFetch<{ events: UserEventEntry[]; requestId?: string }>('/api/admin/user-events?limit=100', getHeaders),
  });
}

export interface MetricsResponse {
  users: { total: number; newToday: number; newThisWeek: number; verified: number; xLinked: number };
  engagement: { signupsToday: number; signupsThisWeek: number; loginsToday: number; loginsThisWeek: number };
  wheel: { totalSpins: number; spinsToday: number; jackpotHits: number; hofHits: number; draftPassAwards: number; draftPassesAwardedTotal: number };
  promos: { sharesVerifiedTotal: number; sharesVerifiedToday: number; sharesEarnedCredit: number; promoClaimsToday: number };
  referrals: { totalCodes: number };
  withdrawals: { pending: number; approved: number; denied: number; totalVolume: number };
  drafts: { queued: number; jackpotQueueSize: number; hofQueueSize: number };
  generatedAt: string;
  requestId?: string;
  cached?: boolean;
}

export function useAdminMetrics(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<MetricsResponse>({
    queryKey: ['admin', 'metrics'],
    enabled,
    queryFn: () => adminFetch<MetricsResponse>('/api/admin/metrics', getHeaders),
    refetchInterval: 10_000, // live-polling every 10 seconds
    refetchIntervalInBackground: false,
    staleTime: 0,
  });
}

export interface ErrorEventEntry {
  source: string;
  route?: string;
  message: string;
  stack?: string;
  requestId?: string;
  actor?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

export function useRecentErrors(enabled: boolean) {
  const getHeaders = useAdminAuthHeaders();
  return useQuery<{ errors: ErrorEventEntry[]; requestId?: string }>({
    queryKey: ['admin', 'errors'],
    enabled,
    queryFn: () =>
      adminFetch<{ errors: ErrorEventEntry[]; requestId?: string }>('/api/admin/error-events?limit=100', getHeaders),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

/* ────────── Mutations ────────── */

export interface GrantDraftsInput {
  identifier: string;
  count: number;
}
export interface GrantDraftsResponse {
  success: boolean;
  userId: string;
  walletAddress: string | null;
  username: string | null;
  granted: number;
  freeDrafts: number;
  requestId?: string;
}

export function useGrantDrafts() {
  const getHeaders = useAdminAuthHeaders();
  const qc = useQueryClient();
  return useMutation<GrantDraftsResponse, AdminApiError, GrantDraftsInput>({
    mutationFn: (input) =>
      adminFetch<GrantDraftsResponse>('/api/admin/grant-drafts', getHeaders, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      // Optimistically patch the cached users rows if we know the target
      qc.setQueriesData<AdminUsersResponse>({ queryKey: ['admin', 'users'] }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === data.userId ? { ...u, freeDrafts: data.freeDrafts } : u,
          ),
        };
      });
      qc.invalidateQueries({ queryKey: ['admin', 'recent-actions'] });
    },
  });
}

export interface BanUserInput {
  userId: string;
  banned: boolean;
}
export function useBanUser() {
  const getHeaders = useAdminAuthHeaders();
  const qc = useQueryClient();
  return useMutation<AdminUser & { requestId?: string }, AdminApiError, BanUserInput>({
    mutationFn: ({ userId, banned }) =>
      adminFetch<AdminUser & { requestId?: string }>(`/api/admin/users/${encodeURIComponent(userId)}`, getHeaders, {
        method: 'PUT',
        body: JSON.stringify({ banned }),
      }),
    onSuccess: (data) => {
      qc.setQueriesData<AdminUsersResponse>({ queryKey: ['admin', 'users'] }, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.map((u) => (u.id === data.id ? { ...u, banned: data.banned } : u)),
        };
      });
      qc.invalidateQueries({ queryKey: ['admin', 'recent-actions'] });
    },
  });
}

export interface WithdrawalStatusInput {
  id: string;
  status: 'approved' | 'denied';
}
export function useUpdateWithdrawalStatus() {
  const getHeaders = useAdminAuthHeaders();
  const qc = useQueryClient();
  return useMutation<AdminWithdrawalItem & { requestId?: string }, AdminApiError, WithdrawalStatusInput>({
    mutationFn: ({ id, status }) =>
      adminFetch<AdminWithdrawalItem & { requestId?: string }>(
        `/api/admin/withdrawals/${encodeURIComponent(id)}`,
        getHeaders,
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      qc.invalidateQueries({ queryKey: ['admin', 'recent-actions'] });
    },
  });
}

export { AdminApiError };
