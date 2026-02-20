'use client';

import { useRef, useCallback } from 'react';

export function useDraftAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSpinningSound = useCallback(() => {
    try {
      const ctx = initAudio();
      for (let i = 0; i < 30; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 200 + Math.random() * 100;
        oscillator.type = 'square';
        const startTime = ctx.currentTime + i * 0.08;
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.05);
      }
    } catch {}
  }, [initAudio]);

  const playReelStop = useCallback(() => {
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 80;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      click.frequency.value = 1000;
      click.type = 'square';
      clickGain.gain.setValueAtTime(0.2, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      click.start(ctx.currentTime);
      click.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [initAudio]);

  const playCountdownTick = useCallback(() => {
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.08);
    } catch {}
  }, [initAudio]);

  const playWinSound = useCallback((isRare: boolean) => {
    try {
      const ctx = initAudio();
      if (isRare) {
        const fanfare = [
          { freq: 523, delay: 0, duration: 0.15 },
          { freq: 659, delay: 0.1, duration: 0.15 },
          { freq: 784, delay: 0.2, duration: 0.15 },
          { freq: 1047, delay: 0.3, duration: 0.3 },
          { freq: 784, delay: 0.5, duration: 0.1 },
          { freq: 880, delay: 0.6, duration: 0.1 },
          { freq: 1047, delay: 0.7, duration: 0.4 },
          { freq: 1319, delay: 0.9, duration: 0.5 },
        ];
        fanfare.forEach(note => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = note.freq;
          osc.type = 'sine';
          const start = ctx.currentTime + note.delay;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.01, start + note.duration);
          osc.start(start);
          osc.stop(start + note.duration);
        });
        for (let i = 0; i < 20; i++) {
          const shimmer = ctx.createOscillator();
          const shimmerGain = ctx.createGain();
          shimmer.connect(shimmerGain);
          shimmerGain.connect(ctx.destination);
          shimmer.frequency.value = 2000 + Math.random() * 2000;
          shimmer.type = 'sine';
          const start = ctx.currentTime + 0.3 + Math.random() * 0.8;
          shimmerGain.gain.setValueAtTime(0.05, start);
          shimmerGain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
          shimmer.start(start);
          shimmer.stop(start + 0.2);
        }
      } else {
        const frequencies = [440, 554, 659];
        frequencies.forEach((freq, i) => {
          const oscillator = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscillator.frequency.value = freq;
          oscillator.type = 'triangle';
          const startTime = ctx.currentTime + i * 0.1;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.03);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
          oscillator.start(startTime);
          oscillator.stop(startTime + 0.3);
        });
      }
    } catch {}
  }, [initAudio]);

  return { playSpinningSound, playReelStop, playCountdownTick, playWinSound };
}
