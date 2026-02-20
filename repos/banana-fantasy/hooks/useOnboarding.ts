'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ONBOARDING_KEY = 'banana-fantasy-onboarding-complete';

type OnboardingStep = 'tutorial' | 'profile';

interface OwnerProfilePayload {
  walletAddress: string;
  displayName: string;
  avatar?: string | null;
  onboardingComplete?: boolean;
}

async function callOwnerApi(method: 'POST' | 'PUT', payload: OwnerProfilePayload) {
  const res = await fetch('/api/owners', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Owner profile request failed');
  }
  return res.json() as Promise<unknown>;
}

export function useOnboarding() {
  const { user, updateUser, isNewUser, showOnboarding, setShowOnboarding, setIsNewUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('tutorial');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showOnboarding) {
      setCurrentStep('tutorial');
      setError(null);
    }
  }, [showOnboarding]);

  const walletAddress = user?.walletAddress ?? null;

  const createProfile = useCallback(
    async (displayName: string, avatar?: string | null) => {
      if (!walletAddress) throw new Error('Missing wallet address');
      setIsSubmitting(true);
      setError(null);
      try {
        await callOwnerApi('POST', {
          walletAddress,
          displayName,
          avatar: avatar ?? undefined,
        });
        updateUser({
          username: displayName,
          profilePicture: avatar ?? undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create profile';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateUser, walletAddress],
  );

  const updateProfile = useCallback(
    async (displayName: string, avatar?: string | null) => {
      if (!walletAddress) throw new Error('Missing wallet address');
      setIsSubmitting(true);
      setError(null);
      try {
        await callOwnerApi('PUT', {
          walletAddress,
          displayName,
          avatar: avatar ?? undefined,
        });
        updateUser({
          username: displayName,
          profilePicture: avatar ?? undefined,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile';
        setError(message);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [updateUser, walletAddress],
  );

  const completeOnboarding = useCallback(
    async (opts?: { displayName?: string; avatar?: string | null }) => {
      if (!walletAddress) return;
      try {
        await callOwnerApi('PUT', {
          walletAddress,
          displayName: opts?.displayName || user?.username || walletAddress.slice(0, 6),
          avatar: opts?.avatar ?? user?.profilePicture ?? undefined,
          onboardingComplete: true,
        });
      } catch {
        // Ignore backend completion errors to avoid blocking the UI
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(ONBOARDING_KEY, 'true');
        } catch {
          // ignore storage errors
        }
      }
      setShowOnboarding(false);
      setIsNewUser(false);
    },
    [setIsNewUser, setShowOnboarding, user?.profilePicture, user?.username, walletAddress],
  );

  const hasCompletedOnboarding = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ONBOARDING_KEY) === 'true';
  }, []);

  return {
    currentStep,
    setCurrentStep,
    isNewUser,
    showOnboarding,
    hasCompletedOnboarding,
    isSubmitting,
    error,
    createProfile,
    updateProfile,
    completeOnboarding,
  };
}
