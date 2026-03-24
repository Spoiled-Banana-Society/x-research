// Web Audio API sound effects for the Banana Wheel
// No external files needed — generates tones programmatically

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, volume = 0.15, type: OscillatorType = 'sine') {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Tick sound — short click as wheel passes each segment
export function playTick(pitch = 800) {
  playTone(pitch, 0.05, 0.08, 'square');
}

// Spinning ticks — accelerate then decelerate over 5 seconds
export function startSpinSound(): () => void {
  let cancelled = false;
  const totalDuration = 5000;
  const startInterval = 300; // ms between ticks at start
  const fastestInterval = 60; // ms at peak speed
  let elapsed = 0;

  function scheduleTick() {
    if (cancelled) return;

    // Ease: fast in middle, slow at start and end
    const t = elapsed / totalDuration;
    const speed = t < 0.3
      ? 1 - (t / 0.3) // accelerating
      : t < 0.7
        ? 0 // full speed
        : (t - 0.7) / 0.3; // decelerating

    const interval = fastestInterval + (startInterval - fastestInterval) * speed;
    const pitch = 600 + (1 - speed) * 400; // higher pitch when faster

    playTick(pitch);
    elapsed += interval;

    if (elapsed < totalDuration) {
      setTimeout(scheduleTick, interval);
    }
  }

  scheduleTick();
  return () => { cancelled = true; };
}

// Win sounds — tiered by prize quality
export function playWinSound(tier: 'standard' | 'good' | 'great' | 'legendary') {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  switch (tier) {
    case 'standard': {
      // Simple two-note chime
      playTone(523, 0.3, 0.12); // C5
      setTimeout(() => playTone(659, 0.4, 0.12), 150); // E5
      break;
    }
    case 'good': {
      // Three-note ascending
      playTone(523, 0.25, 0.15); // C5
      setTimeout(() => playTone(659, 0.25, 0.15), 120); // E5
      setTimeout(() => playTone(784, 0.5, 0.15), 240); // G5
      break;
    }
    case 'great': {
      // Four-note fanfare
      playTone(523, 0.2, 0.18); // C5
      setTimeout(() => playTone(659, 0.2, 0.18), 100); // E5
      setTimeout(() => playTone(784, 0.2, 0.18), 200); // G5
      setTimeout(() => playTone(1047, 0.6, 0.2), 300); // C6
      break;
    }
    case 'legendary': {
      // Epic ascending chord with harmonics
      const play = (freq: number, delay: number, dur: number, vol: number) => {
        setTimeout(() => {
          playTone(freq, dur, vol, 'sine');
          playTone(freq * 1.5, dur, vol * 0.4, 'sine'); // fifth harmonic
        }, delay);
      };
      play(392, 0, 0.3, 0.15);    // G4
      play(523, 100, 0.3, 0.17);   // C5
      play(659, 200, 0.3, 0.19);   // E5
      play(784, 300, 0.3, 0.21);   // G5
      play(1047, 450, 0.8, 0.25);  // C6
      play(1319, 550, 1.0, 0.2);   // E6
      break;
    }
  }
}

// Map a wheel segment to a sound tier
export function getWinTier(segment: { prizeValue?: number | string; id: string }): 'standard' | 'good' | 'great' | 'legendary' {
  if (segment.id === 'jackpot') return 'legendary';
  if (segment.id === 'hof') return 'legendary';
  if (typeof segment.prizeValue === 'number' && segment.prizeValue >= 20) return 'great';
  if (typeof segment.prizeValue === 'number' && segment.prizeValue >= 5) return 'good';
  return 'standard';
}
