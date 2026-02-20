'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'sbs-draft-tutorial-completed';

export type TutorialState = {
  shouldShowTutorial: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
};

export function useTutorial(totalSteps: number): TutorialState {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const completed = window.localStorage.getItem(STORAGE_KEY) === 'true';
      setHasCompleted(completed);
    } catch {
      setHasCompleted(false);
    }
  }, []);

  const completeTutorial = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore write errors
    }
    setHasCompleted(true);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        completeTutorial();
        return prev;
      }
      return prev + 1;
    });
  }, [completeTutorial, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTutorial = useCallback(() => {
    completeTutorial();
  }, [completeTutorial]);

  const shouldShowTutorial = useMemo(() => {
    if (hasCompleted == null) return false;
    return !hasCompleted;
  }, [hasCompleted]);

  return {
    shouldShowTutorial,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  };
}
