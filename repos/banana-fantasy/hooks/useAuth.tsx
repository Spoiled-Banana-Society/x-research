'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo, useRef } from 'react';
import { useSafePrivy as usePrivy } from '@/providers/PrivyProvider';
import { User } from '@/types';
import { getOwnerUser } from '@/lib/api/owner';
import { ApiError as ClientApiError } from '@/lib/api/client';

const USER_PROFILE_KEY = 'banana-fantasy-user-profile';
const USER_STORAGE_KEYS = [
  USER_PROFILE_KEY,
  'banana-active-drafts',
  'banana-completed-drafts',
  'banana-fantasy-onboarding-complete',
  'hasSeenOnboarding',
];

interface SavedProfile {
  username?: string;
  profilePicture?: string;
  nflTeam?: string;
  draftPasses?: number;
}

interface AuthContextType {
  user: User | null;
  walletAddress: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  setIsNewUser: (isNew: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  login: (method?: 'wallet' | 'social') => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getSavedProfile(): SavedProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(USER_PROFILE_KEY);
    if (!saved) return null;
    const profile = JSON.parse(saved);
    delete profile.profilePicture;
    return profile;
  } catch {
    return null;
  }
}

function saveProfile(profile: SavedProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Derive wallet address from Privy user — prioritize external wallets (MetaMask etc)
  const walletAddress = useMemo(() => {
    if (!privy.user) return null;
    // First: look for an external (non-Privy) wallet
    const external = privy.user.linkedAccounts?.find(
      (a: { type: string; walletClientType?: string; walletClient?: string }) =>
        a.type === 'wallet' && a.walletClientType !== 'privy' && a.walletClient !== 'privy'
    ) as { address?: string } | undefined;
    if (external?.address) return external.address;
    // Fallback: any wallet (embedded Privy wallet)
    const anyWallet = privy.user.linkedAccounts?.find(
      (a: { type: string }) => a.type === 'wallet'
    ) as { address?: string } | undefined;
    if (anyWallet?.address) return anyWallet.address;
    // Last resort: wallet field
    const w = privy.user.wallet;
    return w?.address ?? null;
  }, [privy.user]);

  // Track whether we've already started fetching for this wallet
  const fetchingRef = useRef<string | null>(null);

  // Sync Privy auth state → local user (with real backend profile fetch)
  useEffect(() => {
    if (privy.ready && privy.authenticated && privy.user && walletAddress) {
      // Avoid duplicate fetches for the same wallet
      if (fetchingRef.current === walletAddress) return;
      fetchingRef.current = walletAddress;

      const savedProfile = getSavedProfile();
      // Determine login method: 'wallet' only if user has a non-embedded (external) wallet.
      // privy.user.wallet exists for ALL users (embedded wallets are auto-created),
      // so we check walletClientType to distinguish external wallet logins.
      const walletAccounts = privy.user.linkedAccounts?.filter(
        (a: { type: string }) => a.type === 'wallet'
      );
      console.log('[SBS Auth] Wallet accounts:', JSON.stringify(walletAccounts));
      console.log('[SBS Auth] All linked accounts types:', privy.user.linkedAccounts?.map((a: { type: string; walletClientType?: string; walletClient?: string }) => `${a.type}/${a.walletClientType || a.walletClient || 'none'}`));
      const hasExternalWallet = privy.user.linkedAccounts?.some(
        (a: { type: string; walletClientType?: string; walletClient?: string }) =>
          a.type === 'wallet' && a.walletClientType !== 'privy' && a.walletClient !== 'privy'
      );
      console.log('[SBS Auth] hasExternalWallet:', hasExternalWallet);
      const loginMethod: 'wallet' | 'social' = hasExternalWallet ? 'wallet' : 'social';
      console.log('[SBS Auth] loginMethod:', loginMethod);

      // Try to fetch real SBS profile from backend
      getOwnerUser(walletAddress)
        .then((backendUser) => {
          // Merge backend data with any locally saved profile overrides
          // Use cached draftPasses as initial value — on-chain read will confirm/update
          const merged: User = {
            ...backendUser,
            loginMethod,
            username: savedProfile?.username || backendUser.username,
            profilePicture: savedProfile?.profilePicture || backendUser.profilePicture,
            nflTeam: savedProfile?.nflTeam || backendUser.nflTeam,
            draftPasses: savedProfile?.draftPasses ?? backendUser.draftPasses,
          };
          setUser(merged);
          setIsNewUser(false);
          setShowOnboarding(false);
        })
        .catch((err) => {
          // Backend unreachable or user not found — fall back to Privy-only profile
          const isNotFound = err instanceof ClientApiError && err.status === 404;
          const fallbackUser: User = {
            id: privy.user!.id,
            username: savedProfile?.username || walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4),
            walletAddress,
            loginMethod,
            profilePicture: savedProfile?.profilePicture,
            nflTeam: savedProfile?.nflTeam,
            xHandle: undefined,
            draftPasses: savedProfile?.draftPasses || 0,
            freeDrafts: 20,
            wheelSpins: 0,
            jackpotEntries: 0,
            hofEntries: 0,
            isVerified: false,
            createdAt: new Date().toISOString(),
          };
          setUser(fallbackUser);
          if (isNotFound) {
            setIsNewUser(true);
            setShowOnboarding(true);
          } else {
            setIsNewUser(false);
            setShowOnboarding(false);
          }
        });
    } else if (privy.ready && !privy.authenticated) {
      setUser(null);
      fetchingRef.current = null;
      setIsNewUser(false);
      setShowOnboarding(false);
    }
  }, [privy.ready, privy.authenticated, privy.user, walletAddress]);

  // Read on-chain NFT balance and sync to user.draftPasses
  // Runs on login, every 30s, and on network reconnect
  useEffect(() => {
    if (!walletAddress || !user) return;

    const readBalance = () => {
      const BBB4_ADDRESS = '0x14065412b3A431a660e6E576A14b104F1b3E463b';
      const balanceOfSig = '0x70a08231'; // balanceOf(address)
      const paddedAddr = walletAddress.slice(2).toLowerCase().padStart(64, '0');
      fetch('https://mainnet.base.org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'eth_call',
          params: [{ to: BBB4_ADDRESS, data: balanceOfSig + paddedAddr }, 'latest'],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result) {
            const nftBalance = parseInt(data.result, 16);
            setUser((prev) => {
              if (prev && prev.draftPasses !== nftBalance) {
                // Cache to localStorage so it persists across reconnects
                try {
                  const saved = localStorage.getItem(USER_PROFILE_KEY);
                  const profile = saved ? JSON.parse(saved) : {};
                  profile.draftPasses = nftBalance;
                  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
                } catch { /* ignore */ }
                return { ...prev, draftPasses: nftBalance };
              }
              return prev;
            });
          }
        })
        .catch(() => { /* silent — don't break auth if RPC fails */ });
    };

    // Read immediately
    readBalance();

    // Poll every 30s
    const interval = setInterval(readBalance, 30_000);

    // Re-read on network reconnect
    const onOnline = () => { setTimeout(readBalance, 1000); };
    window.addEventListener('online', onOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, [walletAddress, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback((_method?: 'wallet' | 'social') => {
    privy.login();
  }, [privy]);

  const logout = useCallback(async () => {
    await privy.logout();
    setUser(null);
    if (typeof window !== 'undefined') {
      USER_STORAGE_KEYS.forEach((key) => {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
      });
    }
  }, [privy]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveProfile({
        username: updated.username,
        profilePicture: updated.profilePicture,
        nflTeam: updated.nflTeam,
      });
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        walletAddress,
        isLoggedIn: !!user,
        isLoading: !privy.ready,
        isNewUser,
        setIsNewUser,
        showOnboarding,
        setShowOnboarding,
        login,
        logout,
        updateUser,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
