'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── TYPES ─── */
type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

/* ─── CONSTANTS ─── */
const LAUNCH_TIMESTAMP = new Date('2026-06-09T12:00:00-05:00').getTime();
const STORAGE_KEY = 'bbb4-notify-emails';
const SBS_YELLOW = '#F3E216';
const SBS_YELLOW_DIM = 'rgba(243,226,22,0.15)';

function getTimeLeft(target: number): TimeLeft {
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

/* ─── FEATURES ─── */
const features = [
  { emoji: '🏈', title: 'Draft & Compete', desc: "Fast and slow drafts with real NFL matchups. Auto-pick when you're busy." },
  { emoji: '💰', title: 'Win Prizes', desc: 'Weekly payouts, season championships, and Hall of Fame recognition.' },
  { emoji: '🔗', title: 'Own Your Picks', desc: 'Every draft pick is an onchain asset you truly own. Trade, hold, or flex.' },
  { emoji: '🍌', title: 'Spoiled Banana', desc: 'Join the Society. Exclusive contests, rare cards, and banana-powered glory.' },
];

/* ─── STAT TEASERS ─── */
const stats = [
  { value: '$250K+', label: 'Prize Pool' },
  { value: '10,000+', label: 'Draft Tokens' },
  { value: '18', label: 'NFL Weeks' },
  { value: '∞', label: 'Bananas' },
];

/* ─── FLOATING BANANA PARTICLE ─── */
function FloatingBanana({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="pointer-events-none fixed select-none"
      style={{ left: `${x}%`, fontSize: size, zIndex: 0 }}
      initial={{ y: '110vh', opacity: 0, rotate: 0 }}
      animate={{ y: '-10vh', opacity: [0, 0.7, 0.7, 0], rotate: 360 }}
      transition={{ duration: 12 + Math.random() * 8, delay, repeat: Infinity, ease: 'linear' }}
    >
      🍌
    </motion.div>
  );
}

/* ─── COUNTDOWN BLOCK ─── */
function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border px-4 py-5 text-center backdrop-blur-md sm:px-6 sm:py-7"
      style={{
        borderColor: 'rgba(243,226,22,0.25)',
        background: 'rgba(10,10,15,0.7)',
        boxShadow: `0 0 40px rgba(243,226,22,0.06), inset 0 1px 0 rgba(243,226,22,0.08)`,
      }}
      whileHover={{ scale: 1.04, borderColor: 'rgba(243,226,22,0.6)' }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Shimmer */}
      <motion.div
        className="absolute inset-0 opacity-10"
        style={{ background: `linear-gradient(105deg, transparent 40%, ${SBS_YELLOW} 50%, transparent 60%)` }}
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
      />
      <AnimatePresence mode="popLayout">
        <motion.p
          key={value}
          className="relative text-4xl font-black tabular-nums sm:text-5xl"
          style={{ color: SBS_YELLOW }}
          initial={{ y: 12, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          {String(value).padStart(2, '0')}
        </motion.p>
      </AnimatePresence>
      <p className="relative mt-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        {label}
      </p>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function ComingSoonPage() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(LAUNCH_TIMESTAMP));
  const [email, setEmail] = useState('');
  const [formState, setFormState] = useState<'idle' | 'success' | 'error'>('idle');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(LAUNCH_TIMESTAMP)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const countdownItems = useMemo(
    () => [
      { label: 'Days', value: timeLeft.days },
      { label: 'Hours', value: timeLeft.hours },
      { label: 'Minutes', value: timeLeft.minutes },
      { label: 'Seconds', value: timeLeft.seconds },
    ],
    [timeLeft.days, timeLeft.hours, timeLeft.minutes, timeLeft.seconds],
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setFormState('error');
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing: string[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...existing, normalized])]));
      setFormState('success');
      setEmail('');
    } catch {
      setFormState('error');
    }
  };

  // Generate banana particles (client only)
  const bananas = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 1.5,
      x: Math.random() * 100,
      size: 16 + Math.random() * 20,
    })),
    [],
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* ── Floating Bananas ── */}
      {bananas.map((b) => (
        <FloatingBanana key={b.id} delay={b.delay} x={b.x} size={b.size} />
      ))}

      {/* ── Mouse-follow glow ── */}
      <div
        ref={heroRef}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute h-[500px] w-[500px] rounded-full opacity-20 blur-[120px] transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${SBS_YELLOW}, transparent 70%)`,
            left: mousePos.x - 250,
            top: mousePos.y - 250,
          }}
        />
      </div>

      {/* ── Background effects ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(243,226,22,0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(243,226,22,0.08),transparent_50%)]" />

      {/* ── Grid pattern ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${SBS_YELLOW} 1px, transparent 1px), linear-gradient(90deg, ${SBS_YELLOW} 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 pb-12 pt-20 sm:px-8 lg:px-12">

        {/* HERO */}
        <motion.section
          className="mx-auto w-full max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 text-xs font-bold uppercase tracking-[0.25em]"
            style={{ borderColor: 'rgba(243,226,22,0.4)', background: SBS_YELLOW_DIM, color: SBS_YELLOW }}
            animate={{ boxShadow: ['0 0 15px rgba(243,226,22,0.15)', '0 0 30px rgba(243,226,22,0.3)', '0 0 15px rgba(243,226,22,0.15)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>🍌</span> Spoiled Banana Society
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl">
            <span className="block" style={{ color: SBS_YELLOW }}>BBB4</span>
            <span className="block bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              IS COMING
            </span>
          </h1>

          <motion.p
            className="mt-4 text-base text-zinc-400 sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Best Ball Banana &bull; Season 4 &bull; June 9, 2026
          </motion.p>

          <motion.p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-500 sm:text-base"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            The ultimate onchain best ball fantasy football experience.
            Draft your squad, compete for prizes, own your picks.
          </motion.p>
        </motion.section>

        {/* COUNTDOWN */}
        <motion.section
          className="mx-auto mt-12 w-full max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          {timeLeft.expired ? (
            <motion.div
              className="rounded-3xl border p-10 text-center backdrop-blur-md"
              style={{ borderColor: SBS_YELLOW, background: 'rgba(10,10,15,0.8)', boxShadow: `0 0 80px rgba(243,226,22,0.2)` }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-4xl font-black sm:text-5xl" style={{ color: SBS_YELLOW }}>
                🍌 BBB4 IS LIVE!
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full px-8 py-3 text-sm font-bold text-black transition hover:brightness-110"
                style={{ background: SBS_YELLOW }}
              >
                Enter Now →
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {countdownItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <CountdownBlock value={item.value} label={item.label} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* STAT TEASERS */}
        <motion.section
          className="mx-auto mt-12 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 px-4 py-4 text-center backdrop-blur-sm"
              whileHover={{ borderColor: 'rgba(243,226,22,0.4)', y: -2 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            >
              <p className="text-2xl font-black" style={{ color: SBS_YELLOW }}>{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* EMAIL CAPTURE */}
        <motion.section
          className="mx-auto mt-12 w-full max-w-2xl rounded-2xl border p-6 backdrop-blur-md sm:p-8"
          style={{ borderColor: 'rgba(243,226,22,0.2)', background: 'rgba(10,10,15,0.6)', boxShadow: '0 0 50px rgba(243,226,22,0.05)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h2 className="text-center text-xl font-bold">Get Launch Alerts</h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Be first in line when drafts open.
          </p>

          {formState === 'success' ? (
            <motion.p
              className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm font-medium text-emerald-400"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              🍌 You&apos;re on the list!
            </motion.p>
          ) : (
            <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormState('idle'); }}
                placeholder="you@example.com"
                className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900/80 px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[#F3E216]"
                required
              />
              <motion.button
                type="submit"
                className="h-12 rounded-xl px-6 text-sm font-bold text-black transition"
                style={{ background: SBS_YELLOW }}
                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(243,226,22,0.4)' }}
                whileTap={{ scale: 0.97 }}
              >
                Notify Me 🍌
              </motion.button>
            </form>
          )}
          {formState === 'error' && (
            <p className="mt-3 text-center text-sm text-red-400">Please enter a valid email.</p>
          )}
        </motion.section>

        {/* FEATURES */}
        <section className="mx-auto mt-14 grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, i) => (
            <motion.article
              key={feat.title}
              className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 backdrop-blur-sm transition-colors"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.1 }}
              whileHover={{
                borderColor: 'rgba(243,226,22,0.5)',
                y: -4,
                boxShadow: '0 0 30px rgba(243,226,22,0.1)',
              }}
            >
              <span className="text-3xl">{feat.emoji}</span>
              <h3 className="mt-3 text-base font-bold">{feat.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feat.desc}</p>
            </motion.article>
          ))}
        </section>

        {/* FOOTER */}
        <footer className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/50 pt-8 text-sm text-zinc-600 sm:flex-row">
          <p>&copy; 2026 Spoiled Banana Society</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="transition hover:text-[#F3E216]">Twitter</Link>
            <Link href="#" className="transition hover:text-[#F3E216]">Discord</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
