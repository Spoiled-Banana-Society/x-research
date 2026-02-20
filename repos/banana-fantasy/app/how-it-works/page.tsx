'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';

/* ────────── Scroll-animated wrapper ────────── */

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: 'easeOut' as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ────────── Data ────────── */

const STEPS = [
  {
    num: '01',
    icon: '🎟️',
    title: 'Buy Draft Passes',
    desc: 'Grab a pass with USDC, card, or Apple Pay. One pass = one draft entry. Bulk up for better odds at Jackpots & HOF entries.',
    color: 'from-yellow-500/20 to-yellow-600/5',
    border: 'border-yellow-500/30',
  },
  {
    num: '02',
    icon: '🏈',
    title: 'Draft Your Team',
    desc: '10-player snake draft against 9 opponents. Pick QBs, RBs, WRs, and TEs. Fast drafts (30s) or slow drafts (8hr picks) — your call.',
    color: 'from-green-500/20 to-green-600/5',
    border: 'border-green-500/30',
  },
  {
    num: '03',
    icon: '📊',
    title: 'Score Every Week',
    desc: 'Best Ball means zero lineup management. Your highest-scoring players are auto-selected each week. Just sit back and watch.',
    color: 'from-blue-500/20 to-blue-600/5',
    border: 'border-blue-500/30',
  },
  {
    num: '04',
    icon: '🏆',
    title: 'Win Prizes',
    desc: 'Top teams in each league win from the prize pool. Plus Jackpot drafts and Hall of Fame entries for massive bonus payouts.',
    color: 'from-purple-500/20 to-purple-600/5',
    border: 'border-purple-500/30',
  },
];

const COMPARISON = [
  { feature: 'Lineup management', trad: 'Set weekly', bb: 'None — auto-optimized' },
  { feature: 'Waiver wire', trad: 'Weekly hassle', bb: 'Not needed' },
  { feature: 'Time commitment', trad: '2-3 hrs/week', bb: '30 min total (draft only)' },
  { feature: 'Draft format', trad: 'One league draft', bb: 'Unlimited drafts' },
  { feature: 'Injury impact', trad: 'Season-wrecking', bb: 'Depth absorbs it' },
  { feature: 'Fun factor', trad: 'Stressful', bb: 'Pure upside excitement' },
  { feature: 'Prize pools', trad: 'League pot', bb: 'League + Jackpot + HOF' },
];

const FAQS = [
  {
    q: 'What is Best Ball?',
    a: 'Best Ball is a fantasy format where your highest-scoring players are automatically selected each week. You draft a team and never touch your lineup again — the optimal lineup is calculated for you.',
  },
  {
    q: 'How many players do I draft?',
    a: 'Each draft has 10 rounds. You\'ll pick 10 NFL players (QBs, RBs, WRs, TEs) in a snake draft against 9 other managers.',
  },
  {
    q: 'What are Fast vs Slow drafts?',
    a: 'Fast drafts have a 30-second pick timer — the whole draft finishes in about 30 minutes. Slow drafts give you 8 hours per pick, so you can draft on your own schedule over a few days.',
  },
  {
    q: 'What is a Jackpot draft?',
    a: 'Every 100 drafts, one is randomly selected as a Jackpot draft with a massively boosted prize pool. Our provably fair RNG system ensures transparent, verifiable randomness.',
  },
  {
    q: 'What are Hall of Fame (HOF) entries?',
    a: 'Within every batch of 100 drafts, 5 are designated as HOF drafts. Winners of HOF leagues compete in an end-of-season tournament for bonus prizes.',
  },
  {
    q: 'How does scoring work?',
    a: 'Standard PPR scoring. Your best lineup is auto-calculated each week from your 10 players. Scores update live during NFL games.',
  },
  {
    q: 'Is the draft order fair?',
    a: 'Yes. Draft order uses our provably fair RNG system — a cryptographic commit-reveal scheme (HMAC-SHA256) that anyone can independently verify. The seed is committed before the draft and revealed after.',
  },
  {
    q: 'When does the season run?',
    a: 'BBB4 drafts open in June 2026. Scoring runs through the full NFL regular season (September–January). Playoffs and final prizes are distributed after the season ends.',
  },
];

const PRIZES = [
  { tier: 'League Winner', icon: '🥇', desc: 'Top finisher in your 10-team league wins the biggest share of the prize pool.', highlight: true },
  { tier: 'Runner-Up', icon: '🥈', desc: '2nd place earns a solid payout — depth pays off in Best Ball.' , highlight: false },
  { tier: 'Jackpot', icon: '🎰', desc: '1-in-100 chance for a massively boosted prize pool. Provably fair selection.', highlight: true },
  { tier: 'Hall of Fame', icon: '⭐', desc: '5-in-100 drafts qualify. Winners enter an end-of-season bonus tournament.', highlight: false },
  { tier: 'Banana Wheel', icon: '🍌', desc: 'Spin for free passes, instant prizes, Jackpot entries, and more.', highlight: false },
];

/* ────────── Component ────────── */

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">

      {/* ═══ HERO ═══ */}
      <section className="relative py-20 sm:py-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#F3E216]/8 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <Reveal>
            <motion.div
              className="text-7xl sm:text-8xl mb-6 inline-block"
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              🍌
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-4">
              Fantasy Football,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3E216] to-yellow-400">
                Reimagined
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Draft once. Score all season. No lineups, no waivers, no stress.
              Just pick your players and let Best Ball do the rest.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/buy-drafts"
                className="px-8 py-4 bg-[#F3E216] text-black font-bold text-lg rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-[#F3E216]/20"
              >
                Buy Your First Pass →
              </Link>
              <Link
                href="/draft-queue"
                className="px-8 py-4 bg-gray-800 text-white font-semibold text-lg rounded-2xl hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Browse Drafts
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ HOW IT WORKS STEPS ═══ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">How It Works</p>
              <h2 className="text-3xl sm:text-5xl font-bold">Four Steps to Glory</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STEPS.map((step, i) => (
              <Reveal key={step.num} delay={i * 0.1}>
                <div className={`relative rounded-2xl border ${step.border} bg-gradient-to-br ${step.color} p-6 sm:p-8 h-full backdrop-blur`}>
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{step.icon}</span>
                    <div>
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Step {step.num}</span>
                      <h3 className="text-xl font-bold text-white mt-1 mb-2">{step.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHAT IS BEST BALL ═══ */}
      <section className="py-16 sm:py-24 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">The Format</p>
              <h2 className="text-3xl sm:text-5xl font-bold">What is Best Ball?</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Reveal delay={0}>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center h-full">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold mb-2">Draft &amp; Done</h3>
                <p className="text-gray-400 text-sm">
                  Pick your 10 players in a snake draft. That&apos;s your team for the entire NFL season. No adds, no drops, no trades.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center h-full">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-lg font-bold mb-2">Auto-Optimized</h3>
                <p className="text-gray-400 text-sm">
                  Every week, the system picks your highest-scoring lineup automatically. Your &quot;best ball&quot; lineup is always set perfectly.
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center h-full">
                <div className="text-4xl mb-3">😌</div>
                <h3 className="text-lg font-bold mb-2">Zero Stress</h3>
                <p className="text-gray-400 text-sm">
                  No Sunday morning panic. No forgetting to set your lineup. Draft smart, then enjoy watching your players ball out.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ PRIZE STRUCTURE ═══ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">Rewards</p>
              <h2 className="text-3xl sm:text-5xl font-bold">How You Win</h2>
              <p className="text-gray-400 mt-3 max-w-xl mx-auto">Multiple ways to cash in — not just your league finish.</p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {PRIZES.map((p, i) => (
              <Reveal key={p.tier} delay={i * 0.07}>
                <div className={`flex items-center gap-4 rounded-xl p-4 sm:p-5 border transition-colors ${
                  p.highlight
                    ? 'border-[#F3E216]/30 bg-[#F3E216]/5 hover:bg-[#F3E216]/10'
                    : 'border-gray-800 bg-gray-900/40 hover:bg-gray-900/60'
                }`}>
                  <span className="text-3xl flex-shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white">{p.tier}</h3>
                    <p className="text-gray-400 text-sm">{p.desc}</p>
                  </div>
                  {p.highlight && (
                    <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-[#F3E216]/20 text-[#F3E216] text-xs font-semibold border border-[#F3E216]/30 flex-shrink-0">
                      Featured
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═══ */}
      <section className="py-16 sm:py-24 px-4 bg-gray-900/50">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">Why Best Ball?</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Traditional Fantasy vs Best Ball</h2>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/80">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium text-xs uppercase tracking-wider" />
                    <th className="px-4 py-3 text-center text-gray-400 font-medium text-xs uppercase tracking-wider">Traditional</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider text-[#F3E216]">Best Ball 🍌</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.feature} className={`border-t border-gray-800/50 ${i % 2 === 0 ? 'bg-gray-900/30' : ''}`}>
                      <td className="px-4 py-3 text-white font-medium">{row.feature}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{row.trad}</td>
                      <td className="px-4 py-3 text-center text-green-400 font-medium">{row.bb}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-16 sm:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">Questions</p>
              <h2 className="text-3xl sm:text-4xl font-bold">Frequently Asked</h2>
            </div>
          </Reveal>

          <div className="space-y-2">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <Reveal key={i} delay={i * 0.05}>
                  <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-900/40 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium text-white pr-4">{faq.q}</span>
                      <svg
                        className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-4"
                      >
                        <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-16 sm:py-24 px-4 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <p className="text-[#F3E216] font-semibold text-sm uppercase tracking-widest mb-2">Community</p>
              <h2 className="text-3xl sm:text-4xl font-bold">What Players Say</h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'DraftKing_42', text: 'Best Ball is the only way I play fantasy now. Draft in 30 min, enjoy the whole season stress-free.', avatar: '🦍' },
              { name: 'BananaHolder', text: 'Hit a Jackpot draft on my 3rd entry. The provably fair system means I know it was legit.', avatar: '🍌' },
              { name: 'GridironGuru', text: 'The slow draft format is perfect — I can research picks between meetings. Way better than live drafts.', avatar: '🏈' },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 h-full flex flex-col">
                  <p className="text-gray-300 text-sm leading-relaxed flex-1 mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{t.avatar}</span>
                    <span className="text-sm font-medium text-gray-400">{t.name}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-20 sm:py-28 px-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#F3E216]/6 rounded-full blur-[100px]" />
        </div>

        <Reveal>
          <div className="relative max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-4">🍌</div>
            <h2 className="text-3xl sm:text-5xl font-black mb-4">Ready to Draft?</h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of players in BBB4 — the biggest Best Ball season yet.
              Buy a pass, draft your squad, win prizes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/buy-drafts"
                className="px-10 py-4 bg-[#F3E216] text-black font-bold text-lg rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-[#F3E216]/20"
              >
                Get Started — Buy a Pass
              </Link>
              <Link
                href="/faq"
                className="px-6 py-4 text-gray-400 hover:text-white transition-colors text-lg"
              >
                More Questions? →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
