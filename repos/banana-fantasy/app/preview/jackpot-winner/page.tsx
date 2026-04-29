'use client';

import React, { useState } from 'react';
import { JackpotWinnerCycle } from '@/components/promos/JackpotWinnerCycle';

// Standalone preview of the JackpotWinnerCycle component as it
// renders inside the Jackpot Hit promo modal. Lets us verify the
// animation visual without filling a real JP draft (which we can't
// force on staging now that VRF decides slot positions).
export default function JackpotWinnerPreviewPage() {
  const [seed, setSeed] = useState('jackpot-promo-demo');

  const reseed = () => setSeed(`demo-${Math.random().toString(36).slice(2, 10)}`);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-5">
        <header className="space-y-1 text-center">
          <h1 className="text-xl font-bold">Jackpot Hit → FREE SPIN</h1>
          <p className="text-sm text-text-muted">Modal preview — animation only</p>
        </header>

        <div className="bg-bg-secondary rounded-2xl p-5 space-y-4">
          <div className="bg-bg-tertiary rounded-xl p-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-text-primary font-medium">Progress</span>
              <span className="text-xl font-bold">0/1</span>
            </div>
            <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-banana" style={{ width: '0%' }} />
            </div>
            <p className="text-xs text-text-muted mt-2">Complete 1 more to claim your reward.</p>
          </div>

          <JackpotWinnerCycle seed={seed} />

          <p className="text-text-muted text-sm text-center py-2">
            No Jackpots hit yet. Keep drafting for a chance to win!
          </p>
        </div>

        <div className="text-center space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-text-muted">Seed</div>
          <div className="font-mono text-xs text-white/70 break-all">{seed}</div>
          <button
            onClick={reseed}
            className="mt-2 px-5 py-2 rounded-lg bg-banana text-black font-bold tracking-wide hover:brightness-110 transition"
          >
            Reseed
          </button>
        </div>
      </div>
    </div>
  );
}
