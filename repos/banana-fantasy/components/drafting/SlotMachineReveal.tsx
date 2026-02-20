'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

type DraftType = 'jackpot' | 'hof' | 'pro';

interface SlotMachineRevealProps {
  onComplete: (type: DraftType) => void;
  contestName: string;
}

const TYPES = {
  jackpot: {
    id: 'jackpot',
    label: 'JACKPOT',
    logo: '/jackpot-logo.png',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    message: 'You hit the 1% Jackpot!',
  },
  hof: {
    id: 'hof',
    label: 'HALL OF FAME',
    logo: '/hof-logo.jpg',
    color: '#D4AF37',
    glowColor: 'rgba(212, 175, 55, 0.4)',
    message: 'Hall of Fame draft unlocked!',
  },
  pro: {
    id: 'pro',
    label: 'PRO',
    logo: null,
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    message: 'Pro draft ready. Good luck!',
  },
};

type SlotItem = 'jackpot' | 'hof' | 'banana' | 'pro';

const SLOT_ITEMS: SlotItem[] = ['jackpot', 'banana', 'hof', 'banana', 'pro', 'banana', 'jackpot', 'hof'];

function SlotItemDisplay({ item, stopped = false }: { item: SlotItem; stopped?: boolean }) {
  if (item === 'jackpot') {
    return (
      <div className={`flex items-center justify-center transition-all duration-500 ${stopped ? 'scale-110' : ''}`}>
        <Image
          src="/jackpot-logo.png"
          alt="Jackpot"
          width={80}
          height={40}
          className="object-contain"
          style={{ filter: stopped ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))' : 'none' }}
        />
      </div>
    );
  }

  if (item === 'hof') {
    return (
      <div className={`flex items-center justify-center transition-all duration-500 ${stopped ? 'scale-110' : ''}`}>
        <Image
          src="/hof-logo.jpg"
          alt="HOF"
          width={80}
          height={40}
          className="object-contain hof-gold-filter"
          style={{ filter: stopped ? 'sepia(100%) saturate(400%) brightness(110%) hue-rotate(10deg) drop-shadow(0 0 20px rgba(212, 175, 55, 0.8))' : undefined }}
        />
      </div>
    );
  }

  if (item === 'banana') {
    return (
      <div className="flex items-center justify-center">
        <span className="text-5xl">🍌</span>
      </div>
    );
  }

  // Pro
  return (
    <div className={`flex items-center justify-center transition-all duration-500 ${stopped ? 'scale-110' : ''}`}>
      <span
        className="font-black text-2xl tracking-wider"
        style={{
          color: '#a855f7',
          textShadow: stopped ? '0 0 30px rgba(168, 85, 247, 0.8)' : 'none'
        }}
      >
        PRO
      </span>
    </div>
  );
}

export function SlotMachineReveal({ onComplete, contestName }: SlotMachineRevealProps) {
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'revealed'>('ready');
  const [result, setResult] = useState<typeof TYPES.jackpot | typeof TYPES.pro | null>(null);
  const [reelOffset, setReelOffset] = useState(0);
  const [_stoppedReels, setStoppedReels] = useState([false, false, false]);
  const [finalItem, setFinalItem] = useState<SlotItem | null>(null);
  const animationRef = useRef<number | null>(null);
  const stoppedReelsRef = useRef([false, false, false]);

  const spin = () => {
    setPhase('spinning');
    setResult(null);
    setStoppedReels([false, false, false]);
    stoppedReelsRef.current = [false, false, false];
    setReelOffset(0);

    // TEST MODE: Higher odds to see logos (change back later)
    // Real odds: Jackpot 1%, HOF 5%, Pro 94%
    const random = Math.random() * 100;
    let resultType: typeof TYPES.jackpot | typeof TYPES.pro;
    let resultItem: SlotItem;

    if (random < 33) {
      resultType = TYPES.jackpot;
      resultItem = 'jackpot';
    } else if (random < 66) {
      resultType = TYPES.hof;
      resultItem = 'hof';
    } else {
      resultType = TYPES.pro;
      resultItem = 'pro';
    }

    setFinalItem(resultItem);

    // Smooth spinning animation
    const itemHeight = 100;
    const totalHeight = SLOT_ITEMS.length * itemHeight;
    let currentOffset = 0;
    let speed = 50;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;

      // Gradually slow down after 2 seconds
      if (elapsed > 2000) {
        speed = Math.max(5, speed * 0.98);
      }

      currentOffset = (currentOffset + speed) % totalHeight;
      setReelOffset(currentOffset);

      if (speed > 5) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Snap to final position
        setPhase('revealed');
        setResult(resultType);
        setStoppedReels([true, true, true]);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleEnterDraft = () => {
    if (result) {
      onComplete(result.id as DraftType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex items-center justify-center overflow-hidden">
      {/* Subtle animated gradient background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: result
              ? `radial-gradient(ellipse at center, ${result.glowColor} 0%, transparent 70%)`
              : 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
            transition: 'all 1s ease-out',
          }}
        />
      </div>

      {/* Celebration particles for Jackpot/HOF */}
      {phase === 'revealed' && result && (result.id === 'jackpot' || result.id === 'hof') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float-up"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '-10px',
                width: `${4 + Math.random() * 6}px`,
                height: `${4 + Math.random() * 6}px`,
                backgroundColor: result.id === 'jackpot'
                  ? ['#ef4444', '#f87171', '#fca5a5'][Math.floor(Math.random() * 3)]
                  : ['#D4AF37', '#fbbf24', '#fcd34d'][Math.floor(Math.random() * 3)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center px-6 max-w-md mx-auto">
        {/* Contest name */}
        <div className="mb-12">
          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mb-3">
            Entering Draft
          </p>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            {contestName}
          </h1>
        </div>

        {/* Single elegant slot reel */}
        <div className="relative mb-12">
          {/* Glow effect */}
          <div
            className="absolute -inset-8 rounded-[40px] blur-3xl transition-all duration-1000"
            style={{
              backgroundColor: result ? result.glowColor : 'rgba(255,255,255,0.03)',
              opacity: phase === 'revealed' ? 0.6 : 0.3,
            }}
          />

          {/* Glass container */}
          <div className="relative bg-white/[0.03] backdrop-blur-xl rounded-[32px] p-8 border border-white/[0.08] shadow-2xl">
            {/* Reel window */}
            <div className="relative h-[300px] w-[200px] mx-auto overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent">
              {/* Top fade */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black to-transparent z-10" />
              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-10" />

              {/* Center highlight line */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[100px] border-y border-white/10 z-20 pointer-events-none" />

              {/* Spinning content */}
              {phase === 'ready' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl">🍌</span>
                    <p className="text-white/30 text-sm mt-4 font-medium">Spin to reveal</p>
                  </div>
                </div>
              ) : phase === 'revealed' && finalItem ? (
                <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
                  <SlotItemDisplay item={finalItem} stopped={true} />
                </div>
              ) : (
                <div
                  className="absolute w-full transition-transform"
                  style={{ transform: `translateY(-${reelOffset}px)` }}
                >
                  {[...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS, ...SLOT_ITEMS].map((item, idx) => (
                    <div key={idx} className="h-[100px] flex items-center justify-center">
                      <SlotItemDisplay item={item} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Result message */}
        {phase === 'revealed' && result && (
          <div className="mb-10 animate-fade-in">
            <p
              className="text-lg font-medium"
              style={{ color: result.color }}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Action button */}
        {phase === 'ready' && (
          <button
            onClick={spin}
            className="group relative px-10 py-4 bg-white text-black font-semibold text-base rounded-full shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
          >
            <span className="relative z-10">Spin</span>
          </button>
        )}

        {phase === 'spinning' && (
          <div className="h-14 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {phase === 'revealed' && result && (
          <button
            onClick={handleEnterDraft}
            className="px-10 py-4 font-semibold text-base rounded-full shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: result.color,
              color: result.id === 'hof' ? 'black' : 'white',
              boxShadow: `0 10px 40px ${result.glowColor}`,
            }}
          >
            Enter Draft
          </button>
        )}

        {/* Odds - subtle */}
        <div className="mt-16 flex justify-center gap-8 text-[11px] font-medium tracking-wide">
          <span className="text-red-500/40">1% Jackpot</span>
          <span className="text-[#D4AF37]/40">5% HOF</span>
          <span className="text-purple-500/40">94% Pro</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up 4s ease-out forwards;
        }
        @keyframes scale-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
