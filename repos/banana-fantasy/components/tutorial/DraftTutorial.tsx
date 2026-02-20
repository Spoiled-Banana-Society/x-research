'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { TutorialState } from '@/hooks/useTutorial';

export type TutorialTab = 'draft' | 'queue' | 'board' | 'roster';

export const DRAFT_TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome',
    body: 'Welcome to your first fantasy draft. You will take turns picking real NFL players to build your roster.',
  },
  {
    id: 'player-list',
    title: 'Player list',
    body: 'Browse available players here. Use search and filters to find positions you need.',
    targetId: 'player-list',
    placement: 'right',
    requiredTab: 'draft' as TutorialTab,
  },
  {
    id: 'make-pick',
    title: 'Making a pick',
    body: 'When it is your turn, click Draft. If it is not your turn, add players to your queue to save them.',
    targetId: 'make-pick',
    placement: 'left',
    requiredTab: 'draft' as TutorialTab,
  },
  {
    id: 'timer',
    title: 'The timer',
    body: 'You have 30 seconds per pick. If time runs out, the best available player is auto-picked.',
    targetId: 'timer',
    placement: 'bottom',
  },
  {
    id: 'queue-tab',
    title: 'Queue tab',
    body: 'Open your queue to prioritize players you want next. Keep your top targets at the top.',
    targetId: 'queue-tab',
    placement: 'bottom',
  },
  {
    id: 'draft-board',
    title: 'Draft board',
    body: 'Track every pick across all teams and see which round each player went.',
    targetId: 'draft-board',
    placement: 'top',
    requiredTab: 'board' as TutorialTab,
  },
  {
    id: 'roster',
    title: 'Your roster',
    body: 'Your roster fills by position. Use this to see where you still need depth.',
    targetId: 'roster',
    placement: 'top',
    requiredTab: 'roster' as TutorialTab,
  },
  {
    id: 'good-luck',
    title: 'Good luck!',
    body: 'You are ready to draft. Trust your plan and have fun.',
  },
] as const;

type StepConfig = {
  id: string;
  title: string;
  body: string;
  targetId?: string;
  placement?: string;
  requiredTab?: TutorialTab;
};

const STEPS: readonly StepConfig[] = DRAFT_TUTORIAL_STEPS;

type Placement = 'top' | 'bottom' | 'left' | 'right';

type DraftTutorialProps = TutorialState & {
  activeTab: TutorialTab;
  setActiveTab: (tab: TutorialTab) => void;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export default function DraftTutorial({
  shouldShowTutorial,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTutorial,
  completeTutorial,
  activeTab,
  setActiveTab,
}: DraftTutorialProps) {
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);

  const step = STEPS[currentStep];

  useEffect(() => {
    if (step?.requiredTab && step.requiredTab !== activeTab) {
      setActiveTab(step.requiredTab);
    }
  }, [activeTab, setActiveTab, step]);

  const updateHighlight = useCallback(() => {
    if (!step?.targetId) {
      setHighlightRect(null);
      return;
    }

    const el = document.querySelector<HTMLElement>(`[data-tutorial="${step.targetId}"]`);
    if (!el) {
      setHighlightRect(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 10;
    const top = Math.max(rect.top - padding, 8);
    const left = Math.max(rect.left - padding, 8);
    const width = Math.min(rect.width + padding * 2, window.innerWidth - left - 8);
    const height = Math.min(rect.height + padding * 2, window.innerHeight - top - 8);

    setHighlightRect({ top, left, width, height });
  }, [step?.targetId]);

  useEffect(() => {
    if (!shouldShowTutorial) return undefined;

    const raf = requestAnimationFrame(updateHighlight);
    const handle = () => requestAnimationFrame(updateHighlight);

    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
    };
  }, [shouldShowTutorial, updateHighlight, currentStep]);

  const tooltipPosition = useMemo(() => {
    if (!highlightRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      } as React.CSSProperties;
    }

    const placement = (step?.placement ?? 'bottom') as Placement;
    const centerX = highlightRect.left + highlightRect.width / 2;
    const centerY = highlightRect.top + highlightRect.height / 2;

    switch (placement) {
      case 'top':
        return {
          top: highlightRect.top - 16,
          left: centerX,
          transform: 'translate(-50%, -100%)',
        } as React.CSSProperties;
      case 'left':
        return {
          top: centerY,
          left: highlightRect.left - 16,
          transform: 'translate(-100%, -50%)',
        } as React.CSSProperties;
      case 'right':
        return {
          top: centerY,
          left: highlightRect.left + highlightRect.width + 16,
          transform: 'translate(0, -50%)',
        } as React.CSSProperties;
      case 'bottom':
      default:
        return {
          top: highlightRect.top + highlightRect.height + 16,
          left: centerX,
          transform: 'translate(-50%, 0)',
        } as React.CSSProperties;
    }
  }, [highlightRect, step?.placement]);

  const arrowPlacement = (step?.placement ?? 'bottom') as Placement;
  const arrowClass = useMemo(() => {
    switch (arrowPlacement) {
      case 'top':
        return '-bottom-1.5 left-1/2 -translate-x-1/2';
      case 'left':
        return 'right-[-6px] top-1/2 -translate-y-1/2';
      case 'right':
        return 'left-[-6px] top-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return '-top-1.5 left-1/2 -translate-x-1/2';
    }
  }, [arrowPlacement]);

  if (!shouldShowTutorial) return null;

  const isLastStep = currentStep === totalSteps - 1;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const overlayTop = highlightRect ? Math.max(0, highlightRect.top) : 0;
  const overlayLeft = highlightRect ? Math.max(0, highlightRect.left) : 0;
  const overlayRight = highlightRect
    ? Math.min(viewportWidth, highlightRect.left + highlightRect.width)
    : 0;
  const overlayBottom = highlightRect
    ? Math.min(viewportHeight, highlightRect.top + highlightRect.height)
    : 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {!highlightRect && <div className="absolute inset-0 bg-black/70 pointer-events-auto" />}
      {highlightRect && (
        <>
          <div className="absolute bg-black/70 pointer-events-auto inset-x-0 top-0" style={{ height: overlayTop }} />
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{
              top: overlayTop,
              left: 0,
              width: overlayLeft,
              height: Math.max(0, overlayBottom - overlayTop),
            }}
          />
          <div
            className="absolute bg-black/70 pointer-events-auto"
            style={{
              top: overlayTop,
              left: overlayRight,
              right: 0,
              height: Math.max(0, overlayBottom - overlayTop),
            }}
          />
          <div
            className="absolute bg-black/70 pointer-events-auto inset-x-0"
            style={{ top: overlayBottom, bottom: 0 }}
          />
        </>
      )}
      {highlightRect && (
        <div
          className="absolute z-[55] rounded-xl border border-amber-400/80"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      )}

      <div
        className="absolute z-[60] pointer-events-auto w-[320px] max-w-[90vw] bg-zinc-900 text-white rounded-xl border border-amber-400/20 shadow-xl p-5"
        style={tooltipPosition}
        role="dialog"
        aria-live="polite"
      >
        <div className={`absolute w-3 h-3 rotate-45 bg-zinc-900 border border-amber-400/20 ${arrowClass}`} />
        <div className="flex items-center justify-between mb-2">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-wide">
            Step {currentStep + 1} of {totalSteps}
          </div>
          <button
            type="button"
            onClick={skipTutorial}
            className="text-xs text-white/50 hover:text-white"
          >
            Skip
          </button>
        </div>
        <div className="text-lg font-bold mb-2">{step.title}</div>
        <p className="text-sm text-white/70 mb-4">{step.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {STEPS.map((_, idx) => (
              <span
                key={`dot-${idx}`}
                className={`h-1.5 w-1.5 rounded-full ${
                  idx === currentStep ? 'bg-amber-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`text-xs font-bold px-3 py-1.5 rounded border transition-colors ${
                currentStep === 0
                  ? 'border-white/10 text-white/20 cursor-not-allowed'
                  : 'border-white/20 text-white/70 hover:text-white'
              }`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={isLastStep ? completeTutorial : nextStep}
              className="text-xs font-bold px-3 py-1.5 rounded bg-amber-400 text-black hover:bg-amber-300 transition-colors"
            >
              {isLastStep ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
