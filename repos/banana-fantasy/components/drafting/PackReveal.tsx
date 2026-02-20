'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { DRAFT_TYPE_COLORS, HOF_LOGO_FILTER } from '@/lib/draftTypes';
import type { DraftType } from '@/lib/draftTypes';

interface PackRevealProps {
  onComplete: (type: DraftType) => void;
  contestName: string;
}

const TYPES = {
  jackpot: {
    id: 'jackpot' as const,
    label: DRAFT_TYPE_COLORS.jackpot.label,
    logo: '/jackpot-logo.png',
    color: DRAFT_TYPE_COLORS.jackpot.primary,
    glowColor: DRAFT_TYPE_COLORS.jackpot.glowStrong,
    particleColors: DRAFT_TYPE_COLORS.jackpot.particleColors,
    message: 'You hit the 1% Jackpot!',
    bgGradient: `radial-gradient(ellipse at center, ${DRAFT_TYPE_COLORS.jackpot.glow} 0%, transparent 70%)`,
  },
  hof: {
    id: 'hof' as const,
    label: DRAFT_TYPE_COLORS.hof.label,
    logo: '/hof-logo.jpg',
    color: DRAFT_TYPE_COLORS.hof.primary,
    glowColor: DRAFT_TYPE_COLORS.hof.glowStrong,
    particleColors: DRAFT_TYPE_COLORS.hof.particleColors,
    message: 'Hall of Fame draft unlocked!',
    bgGradient: `radial-gradient(ellipse at center, ${DRAFT_TYPE_COLORS.hof.glow} 0%, transparent 70%)`,
  },
  pro: {
    id: 'pro' as const,
    label: DRAFT_TYPE_COLORS.pro.label,
    logo: null,
    color: DRAFT_TYPE_COLORS.pro.primary,
    glowColor: DRAFT_TYPE_COLORS.pro.glow,
    particleColors: DRAFT_TYPE_COLORS.pro.particleColors,
    message: 'Pro draft ready. Good luck!',
    bgGradient: `radial-gradient(ellipse at center, ${DRAFT_TYPE_COLORS.pro.glow} 0%, transparent 70%)`,
  },
};

type Phase = 'sealed' | 'holding' | 'tearing' | 'glowing' | 'revealing' | 'revealed';

export function PackReveal({ onComplete, contestName }: PackRevealProps) {
  const [phase, setPhase] = useState<Phase>('sealed');
  const [result, setResult] = useState<typeof TYPES.jackpot | typeof TYPES.hof | typeof TYPES.pro | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; angle: number; speed: number }>>([]);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);

  // Determine result on component mount
  useEffect(() => {
    // TEST MODE: Higher odds to see logos (change back later)
    // Real odds: Jackpot 1%, HOF 5%, Pro 94%
    const random = Math.random() * 100;
    if (random < 33) {
      setResult(TYPES.jackpot);
    } else if (random < 66) {
      setResult(TYPES.hof);
    } else {
      setResult(TYPES.pro);
    }
  }, []);

  const startHold = () => {
    if (phase !== 'sealed') return;
    setPhase('holding');
    holdStartRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(elapsed / 1000, 1); // 1 second to fill
      setHoldProgress(progress);

      if (progress >= 1) {
        // Trigger open
        openPack();
      } else {
        holdTimerRef.current = setTimeout(updateProgress, 16);
      }
    };

    holdTimerRef.current = setTimeout(updateProgress, 16);
  };

  const endHold = () => {
    if (phase !== 'holding') return;
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setPhase('sealed');
    setHoldProgress(0);
  };

  const openPack = () => {
    setPhase('tearing');

    // Tearing animation
    setTimeout(() => {
      setPhase('glowing');

      // Create glow particles
      if (result) {
        const newParticles = Array.from({ length: 30 }, (_, i) => ({
          id: i,
          x: 50,
          y: 50,
          color: result.particleColors[Math.floor(Math.random() * result.particleColors.length)],
          size: 4 + Math.random() * 8,
          angle: (Math.PI * 2 * i) / 30,
          speed: 2 + Math.random() * 3,
        }));
        setParticles(newParticles);
      }

      // Reveal card
      setTimeout(() => {
        setPhase('revealing');

        // Final reveal with explosion
        setTimeout(() => {
          setPhase('revealed');

          // Create explosion particles
          if (result && (result.id === 'jackpot' || result.id === 'hof')) {
            const explosionParticles = Array.from({ length: 100 }, (_, i) => ({
              id: i + 100,
              x: 50,
              y: 40,
              color: result.particleColors[Math.floor(Math.random() * result.particleColors.length)],
              size: 6 + Math.random() * 10,
              angle: Math.random() * Math.PI * 2,
              speed: 5 + Math.random() * 10,
            }));
            setParticles(explosionParticles);
          }
        }, 800);
      }, 600);
    }, 400);
  };

  const handleEnterDraft = () => {
    if (result) {
      onComplete(result.id as DraftType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex items-center justify-center overflow-hidden select-none">
      {/* Background glow */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background: phase === 'revealed' && result ? result.bgGradient : 'transparent',
          opacity: phase === 'revealed' ? 1 : 0,
        }}
      />

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full animate-particle-explode"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              '--angle': `${p.angle}rad`,
              '--speed': p.speed,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Ambient particles when revealed */}
      {phase === 'revealed' && result && (result.id === 'jackpot' || result.id === 'hof') && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={`ambient-${i}`}
              className="absolute rounded-full animate-float-ambient"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                backgroundColor: result.particleColors[Math.floor(Math.random() * result.particleColors.length)],
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center px-6 max-w-md mx-auto">
        {/* Contest name */}
        <div className={`mb-10 transition-all duration-500 ${phase === 'revealed' ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
          <p className="text-white/40 text-xs font-medium uppercase tracking-[0.2em] mb-3">
            Entering Draft
          </p>
          <h1 className="text-white text-xl font-semibold tracking-tight">
            {contestName}
          </h1>
        </div>

        {/* Pack / Card Container */}
        <div className="relative h-[400px] flex items-center justify-center mb-10">
          {/* Sealed Pack */}
          {(phase === 'sealed' || phase === 'holding') && (
            <div
              className={`relative cursor-pointer transition-transform duration-200 ${phase === 'holding' ? 'scale-[1.02]' : 'hover:scale-[1.02]'}`}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
            >
              {/* Pack glow on hold */}
              <div
                className="absolute -inset-8 rounded-3xl blur-2xl transition-all duration-300"
                style={{
                  backgroundColor: result?.glowColor || 'transparent',
                  opacity: holdProgress * 0.8,
                }}
              />

              {/* Pack */}
              <div className="relative w-[220px] h-[300px] rounded-2xl overflow-hidden shadow-2xl">
                {/* Pack background */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600" />

                {/* Pack pattern */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-4xl"
                      style={{
                        left: `${(i % 4) * 25 + 5}%`,
                        top: `${Math.floor(i / 4) * 20 + 5}%`,
                        transform: 'rotate(-15deg)',
                      }}
                    >
                      🍌
                    </div>
                  ))}
                </div>

                {/* Pack center logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🍌</div>
                    <div className="text-black/80 font-black text-xl tracking-tight">BANANA</div>
                    <div className="text-black/60 font-bold text-sm tracking-widest">FANTASY</div>
                  </div>
                </div>

                {/* Sealed strip */}
                <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
                <div className="absolute top-6 left-0 right-0 h-1 bg-white/40" />

                {/* Shimmer effect on hold */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000"
                  style={{
                    transform: `translateX(${-100 + holdProgress * 200}%)`,
                  }}
                />

                {/* Color hint glow at edges */}
                {phase === 'holding' && result && (
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      boxShadow: `inset 0 0 60px ${result.glowColor}`,
                      opacity: holdProgress,
                    }}
                  />
                )}
              </div>

              {/* Hold progress ring */}
              {phase === 'holding' && (
                <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke={result?.color || '#fbbf24'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray={`${holdProgress * 301.6} 301.6`}
                    transform="rotate(-90 50 50)"
                    className="transition-all duration-100"
                  />
                </svg>
              )}
            </div>
          )}

          {/* Tearing Pack */}
          {phase === 'tearing' && (
            <div className="relative animate-tear">
              <div className="w-[220px] h-[300px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-6xl">🍌</div>
                </div>
              </div>
              {/* Tear particles */}
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-3 h-3 bg-yellow-400 rounded-sm animate-tear-particle"
                  style={{
                    left: '50%',
                    top: '20%',
                    animationDelay: `${i * 20}ms`,
                    '--tx': `${(Math.random() - 0.5) * 200}px`,
                    '--ty': `${-50 - Math.random() * 100}px`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}

          {/* Glowing state - card emerging */}
          {phase === 'glowing' && result && (
            <div className="relative">
              {/* Intense glow */}
              <div
                className="absolute -inset-20 rounded-full blur-3xl animate-pulse"
                style={{ backgroundColor: result.glowColor }}
              />
              {/* Card silhouette */}
              <div
                className="w-[200px] h-[280px] rounded-2xl animate-float-up-slow"
                style={{
                  backgroundColor: result.color,
                  boxShadow: `0 0 100px ${result.glowColor}`,
                }}
              />
            </div>
          )}

          {/* Revealing - Card flip */}
          {phase === 'revealing' && result && (
            <div className="relative perspective-1000">
              <div
                className="w-[200px] h-[280px] rounded-2xl animate-card-flip"
                style={{
                  backgroundColor: result.color,
                  boxShadow: `0 0 80px ${result.glowColor}`,
                }}
              />
            </div>
          )}

          {/* Revealed Card */}
          {phase === 'revealed' && result && (
            <div className="relative animate-card-settle">
              {/* Card glow */}
              <div
                className="absolute -inset-12 rounded-3xl blur-3xl"
                style={{
                  backgroundColor: result.glowColor,
                  opacity: result.id === 'jackpot' ? 0.8 : result.id === 'hof' ? 0.7 : 0.5,
                }}
              />

              {/* JACKPOT Card */}
              {result.id === 'jackpot' && (
                <div
                  className="relative w-[240px] h-[320px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'linear-gradient(180deg, #1a0000 0%, #3d0000 30%, #1a0000 100%)',
                    boxShadow: '0 0 100px rgba(239, 68, 68, 0.6), inset 0 0 60px rgba(239, 68, 68, 0.1)',
                  }}
                >
                  {/* Red animated border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-red-500/50" />
                  <div className="absolute inset-2 rounded-xl border border-red-600/30" />

                  {/* Fire particles at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-8 rounded-full animate-fire-particle"
                        style={{
                          left: `${10 + (i * 4)}%`,
                          bottom: '-20px',
                          background: 'linear-gradient(to top, #ef4444, #f97316, transparent)',
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: `${1 + Math.random()}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Logo */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Image
                      src="/jackpot-logo.png"
                      alt="JACKPOT"
                      width={200}
                      height={100}
                      className="object-contain"
                      style={{ filter: 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.8))' }}
                    />
                    <div className="mt-6 text-red-400/80 text-xs font-bold tracking-[0.3em] uppercase">
                      1% Ultra Rare
                    </div>
                  </div>

                  {/* Animated red glow pulse */}
                  <div className="absolute inset-0 bg-red-500/10 animate-pulse" />

                  {/* Shine */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-red-400/20 to-transparent rotate-12 animate-shine" />
                  </div>
                </div>
              )}

              {/* HOF Card - Gold Theme */}
              {result.id === 'hof' && (
                <div
                  className="relative w-[240px] h-[320px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'linear-gradient(180deg, #1a1400 0%, #3d2d00 30%, #1a1400 100%)',
                    boxShadow: '0 0 100px rgba(212, 175, 55, 0.5), inset 0 0 60px rgba(212, 175, 55, 0.1)',
                  }}
                >
                  {/* Gold border */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-yellow-500/50" />
                  <div className="absolute inset-2 rounded-xl border border-yellow-600/30" />

                  {/* Gold sparkles */}
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"
                        style={{
                          left: `${10 + Math.random() * 80}%`,
                          top: `${10 + Math.random() * 80}%`,
                          animationDelay: `${Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Logo with gold filter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Image
                      src="/hof-logo.jpg"
                      alt="HOF"
                      width={140}
                      height={100}
                      className="object-contain hof-gold-filter"
                      style={{
                        filter: `${HOF_LOGO_FILTER} drop-shadow(0 0 20px rgba(212, 175, 55, 0.8))`,
                      }}
                    />
                    <div className="mt-6 text-yellow-500/80 text-xs font-bold tracking-[0.3em] uppercase">
                      Hall of Fame
                    </div>
                  </div>

                  {/* Gold shine */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -inset-full bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent rotate-12 animate-shine" />
                  </div>
                </div>
              )}

              {/* PRO Card - Purple/Clean */}
              {result.id === 'pro' && (
                <div
                  className="relative w-[240px] h-[320px] rounded-2xl overflow-hidden shadow-2xl"
                  style={{
                    background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%)',
                    boxShadow: '0 0 60px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  {/* Purple border */}
                  <div className="absolute inset-0 rounded-2xl border border-purple-500/30" />
                  <div className="absolute inset-3 rounded-xl border border-purple-500/10" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-7xl mb-4">🍌</div>
                    <div
                      className="text-4xl font-black tracking-wider"
                      style={{
                        background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 50%, #7c3aed 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))',
                      }}
                    >
                      PRO
                    </div>
                    <div className="mt-4 text-purple-400/60 text-xs font-medium tracking-[0.2em] uppercase">
                      Standard Draft
                    </div>
                  </div>

                  {/* Subtle shine */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions / Result */}
        {phase === 'sealed' && (
          <p className="text-white/40 text-sm font-medium animate-pulse">
            Hold to open pack
          </p>
        )}

        {phase === 'holding' && (
          <p className="text-white/60 text-sm font-medium">
            Keep holding...
          </p>
        )}

        {phase === 'revealed' && result && (
          <div className="animate-fade-in-up">
            <p
              className="text-xl font-semibold mb-8"
              style={{ color: result.color }}
            >
              {result.message}
            </p>

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
          </div>
        )}

        {/* Odds - subtle */}
        {phase === 'sealed' && (
          <div className="mt-12 flex justify-center gap-8 text-[11px] font-medium tracking-wide">
            <span className="text-red-500/40">1% Jackpot</span>
            <span className="text-[#D4AF37]/40">5% HOF</span>
            <span className="text-purple-500/40">94% Pro</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }

        @keyframes tear {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(-2deg); }
          100% { transform: scale(0.8) rotate(5deg) translateY(-50px); opacity: 0; }
        }
        .animate-tear {
          animation: tear 0.4s ease-out forwards;
        }

        @keyframes tear-particle {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(360deg); opacity: 0; }
        }
        .animate-tear-particle {
          animation: tear-particle 0.6s ease-out forwards;
        }

        @keyframes float-up-slow {
          0% { transform: translateY(100px) scale(0.8); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-float-up-slow {
          animation: float-up-slow 0.6s ease-out forwards;
        }

        @keyframes card-flip {
          0% { transform: rotateY(0deg) scale(0.9); }
          50% { transform: rotateY(90deg) scale(1); }
          100% { transform: rotateY(0deg) scale(1); }
        }
        .animate-card-flip {
          animation: card-flip 0.8s ease-in-out forwards;
        }

        @keyframes card-settle {
          0% { transform: scale(1.1) translateY(-20px); }
          50% { transform: scale(0.95) translateY(10px); }
          100% { transform: scale(1) translateY(0); }
        }
        .animate-card-settle {
          animation: card-settle 0.5s ease-out forwards;
        }

        @keyframes particle-explode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% {
            transform: translate(
              calc(cos(var(--angle)) * var(--speed) * 50px),
              calc(sin(var(--angle)) * var(--speed) * 50px)
            ) scale(0);
            opacity: 0;
          }
        }
        .animate-particle-explode {
          animation: particle-explode 1s ease-out forwards;
        }

        @keyframes float-ambient {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.3; }
        }
        .animate-float-ambient {
          animation: float-ambient 4s ease-in-out infinite;
        }

        @keyframes shine {
          0% { transform: translateX(-100%) rotate(12deg); }
          100% { transform: translateX(100%) rotate(12deg); }
        }
        .animate-shine {
          animation: shine 2s ease-in-out infinite;
        }

        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }

        @keyframes fire-particle {
          0% { transform: translateY(0) scaleY(1); opacity: 0.8; }
          50% { opacity: 1; }
          100% { transform: translateY(-80px) scaleY(0.5); opacity: 0; }
        }
        .animate-fire-particle {
          animation: fire-particle 1.5s ease-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
