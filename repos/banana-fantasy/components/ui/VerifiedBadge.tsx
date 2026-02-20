'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface VerifiedBadgeProps {
  type: 'draft-type' | 'draft-order' | 'team';
  draftType?: 'jackpot' | 'hof' | 'pro' | 'regular';
  proof?: {
    txHash: string;
    blockNumber: number;
    chainId: number;
    timestamp: number;
    seed?: string;
    result?: string;
  };
  size?: 'sm' | 'md';
  compact?: boolean; // Just show icon, no text
}

export function VerifiedBadge({ type, draftType: rawDraftType = 'pro', proof, size = 'sm', compact = false }: VerifiedBadgeProps) {
  // Normalize 'regular' to 'pro' for color scheme
  const draftType: 'jackpot' | 'hof' | 'pro' = rawDraftType === 'regular' ? 'pro' : (rawDraftType || 'pro');
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update tooltip position when showing
  useEffect(() => {
    if (showTooltip && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPos({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    }
  }, [showTooltip]);

  // Color scheme based on draft type - slightly muted to not compete with main type badge
  const colorScheme = {
    jackpot: {
      bg: 'bg-red-500/15',
      bgHover: 'hover:bg-red-500/25',
      text: 'text-red-400',
      accent: '#ef4444',
    },
    hof: {
      bg: 'bg-hof/15',
      bgHover: 'hover:bg-hof/25',
      text: 'text-hof',
      accent: '#D4AF37',
    },
    pro: {
      bg: 'bg-purple-500/15',
      bgHover: 'hover:bg-purple-500/25',
      text: 'text-purple-400',
      accent: '#a855f7',
    },
  };

  const colors = colorScheme[draftType];

  // Mock proof data for demo
  const mockProof = proof || {
    txHash: '0x8a3f...7d2e',
    blockNumber: 19847523,
    chainId: 8453,
    timestamp: Date.now() - 60000,
    seed: '0x3d8f...a92c',
    result: type === 'draft-type'
      ? (draftType === 'jackpot' ? 'JACKPOT' : draftType === 'hof' ? 'HALL OF FAME' : 'PRO')
      : type === 'draft-order' ? 'Position #7' : 'Team #4523',
  };

  const getExplorerUrl = () => {
    // SBS is USDC on Base only.
    return `https://basescan.org/tx/${mockProof.txHash}`;
  };

  const getChainName = () => {
    return 'Base';
  };

  const sizeClasses = compact
    ? (size === 'sm' ? 'p-1' : 'p-1.5')
    : (size === 'sm' ? 'text-[9px] px-1 py-0.5 gap-0.5' : 'text-[11px] px-1.5 py-0.5 gap-1');

  const tooltip = showTooltip && mounted && createPortal(
    <div
      className="fixed w-64 p-3 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl z-[9999] pointer-events-none"
      style={{
        top: tooltipPos.top,
        left: tooltipPos.left,
        transform: 'translateX(-50%)',
      }}
    >
      {/* Arrow pointing up */}
      <div
        className="absolute w-2 h-2 bg-[#1a1a2e] border-l border-t border-white/10 transform rotate-45"
        style={{ top: -5, left: '50%', marginLeft: -4 }}
      />

      <div className="text-xs font-semibold text-white mb-1 flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: colors.accent }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Provably Fair
      </div>

      <p className="text-[11px] text-white/60 mb-3">
        This result was generated using Chainlink VRF — verified randomness that can&apos;t be manipulated.
      </p>

      <div className="space-y-1.5 text-[10px] bg-white/5 rounded-lg p-2">
        <div className="flex justify-between">
          <span className="text-white/50">Chain</span>
          <span className="text-white">{getChainName()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">Block</span>
          <span className="text-white font-mono">{mockProof.blockNumber.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">TX Hash</span>
          <span className="text-white font-mono">{mockProof.txHash}</span>
        </div>
        {mockProof.result && (
          <div className="flex justify-between">
            <span className="text-white/50">Result</span>
            <span className="font-semibold" style={{ color: colors.accent }}>{mockProof.result}</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40 text-center">
        Click badge to verify on {getChainName()}scan
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={buttonRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => window.open(getExplorerUrl(), '_blank')}
        className={`inline-flex items-center ${sizeClasses} ${colors.bg} ${colors.text} ${colors.bgHover} rounded font-medium transition-all cursor-pointer`}
      >
        <svg width={size === 'sm' ? 10 : 12} height={size === 'sm' ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {!compact && 'Verified'}
      </button>
      {tooltip}
    </>
  );
}
