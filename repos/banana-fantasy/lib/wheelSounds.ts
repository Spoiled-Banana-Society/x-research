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

// Background music during spin — building tension drone + rising sweep
function startSpinMusic(): () => void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const duration = 5;

  // Master gain for all music
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(0.12, now + 0.5); // fade in
  masterGain.gain.setValueAtTime(0.12, now + duration - 0.8);
  masterGain.gain.linearRampToValueAtTime(0, now + duration); // fade out
  masterGain.connect(ctx.destination);

  // Low bass drone — builds anticipation
  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = 'sine';
  bass.frequency.setValueAtTime(65, now); // C2
  bass.frequency.linearRampToValueAtTime(82, now + duration); // subtle rise
  bassGain.gain.setValueAtTime(1, now);
  bass.connect(bassGain);
  bassGain.connect(masterGain);
  bass.start(now);
  bass.stop(now + duration);

  // Mid pad — warm chord that swells
  const pad1 = ctx.createOscillator();
  const pad1Gain = ctx.createGain();
  pad1.type = 'sine';
  pad1.frequency.setValueAtTime(196, now); // G3
  pad1.frequency.linearRampToValueAtTime(262, now + duration); // rise to C4
  pad1Gain.gain.setValueAtTime(0.3, now);
  pad1Gain.gain.linearRampToValueAtTime(0.7, now + duration);
  pad1.connect(pad1Gain);
  pad1Gain.connect(masterGain);
  pad1.start(now);
  pad1.stop(now + duration);

  // High shimmer — rising excitement
  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(392, now); // G4
  shimmer.frequency.exponentialRampToValueAtTime(784, now + duration); // rise to G5
  shimmerGain.gain.setValueAtTime(0, now);
  shimmerGain.gain.linearRampToValueAtTime(0.4, now + 2); // fade in slowly
  shimmerGain.gain.linearRampToValueAtTime(0.6, now + duration - 1);
  shimmerGain.gain.linearRampToValueAtTime(0, now + duration);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  shimmer.start(now);
  shimmer.stop(now + duration);

  // Pulsing rhythm — subtle eighth-note pulse that builds
  const pulseOsc = ctx.createOscillator();
  const pulseGain = ctx.createGain();
  const pulseLfo = ctx.createOscillator();
  const pulseLfoGain = ctx.createGain();
  pulseOsc.type = 'sine';
  pulseOsc.frequency.setValueAtTime(131, now); // C3
  pulseOsc.frequency.linearRampToValueAtTime(165, now + duration);
  pulseLfo.type = 'square';
  pulseLfo.frequency.setValueAtTime(3, now); // 3 Hz pulse
  pulseLfo.frequency.linearRampToValueAtTime(6, now + duration); // speeds up
  pulseLfoGain.gain.setValueAtTime(0.3, now);
  pulseLfo.connect(pulseLfoGain);
  pulseLfoGain.connect(pulseGain.gain);
  pulseGain.gain.setValueAtTime(0.3, now);
  pulseOsc.connect(pulseGain);
  pulseGain.connect(masterGain);
  pulseOsc.start(now);
  pulseLfo.start(now);
  pulseOsc.stop(now + duration);
  pulseLfo.stop(now + duration);

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    try {
      masterGain.gain.cancelScheduledValues(ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    } catch { /* already stopped */ }
  };
}

// Tick sounds — only in the last 2 seconds as wheel decelerates
function startDecelerationTicks(): () => void {
  let cancelled = false;

  // Wait 3 seconds (wheel at full speed), then start ticking for last 2s
  setTimeout(() => {
    if (cancelled) return;
    let elapsed = 0;
    const tickDuration = 2000;
    const startInterval = 80;
    const endInterval = 400;

    function scheduleTick() {
      if (cancelled) return;
      const t = elapsed / tickDuration;
      const interval = startInterval + (endInterval - startInterval) * (t * t); // quadratic slowdown
      const pitch = 1000 - t * 400; // pitch drops as it slows

      playTick(pitch);
      elapsed += interval;

      if (elapsed < tickDuration) {
        setTimeout(scheduleTick, interval);
      }
    }
    scheduleTick();
  }, 3000);

  return () => { cancelled = true; };
}

// Combined spin sound: music + deceleration ticks
export function startSpinSound(): () => void {
  const stopMusic = startSpinMusic();
  const stopTicks = startDecelerationTicks();

  return () => {
    stopMusic();
    stopTicks();
  };
}

// Win sounds — tiered by prize quality
export function playWinSound(tier: 'standard' | 'good' | 'great' | 'legendary') {
  const ctx = getAudioContext();
  const _now = ctx.currentTime;

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
  if (typeof segment.prizeValue === 'number' && segment.prizeValue >= 20) return 'legendary';
  if (typeof segment.prizeValue === 'number' && segment.prizeValue >= 10) return 'great';
  if (segment.id === 'hof') return 'good';
  if (typeof segment.prizeValue === 'number' && segment.prizeValue >= 5) return 'good';
  return 'standard';
}
