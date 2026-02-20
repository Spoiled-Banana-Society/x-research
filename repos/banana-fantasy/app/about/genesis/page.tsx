'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const SBS_YELLOW = '#F3E216';

export default function GenesisLegacyPage() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0f] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(243,226,22,0.06),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 py-24 sm:px-8">
        {/* Badge */}
        <motion.div
          className="mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ borderColor: 'rgba(243,226,22,0.3)', background: 'rgba(243,226,22,0.08)', color: SBS_YELLOW }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>🍌</span> Legacy Program
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-center text-4xl font-black tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <span style={{ color: SBS_YELLOW }}>Genesis</span> Collection
        </motion.h1>

        <motion.p
          className="mt-4 text-center text-lg text-zinc-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          The original SBS cards that started it all.
        </motion.p>

        {/* Main content card */}
        <motion.div
          className="mt-10 w-full rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 backdrop-blur-sm sm:p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold">Genesis Has Moved</h2>
          <p className="mt-3 leading-relaxed text-zinc-400">
            The Genesis collection is no longer active on the website. The community and all Genesis
            activity now lives exclusively on{' '}
            <span className="font-semibold text-white">Discord</span>.
          </p>

          <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              🏆 Prize Claims
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              If you have unclaimed prizes from previous Genesis seasons (S1, S2, or S3),
              please reach out to our support team on Discord. We&apos;ll help you get
              everything sorted.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              📜 History
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Genesis was the first-ever SBS collection — 10,000 unique cards that pioneered
              onchain fantasy football. Three seasons of drafts, trades, and prizes.
              The cards still exist onchain and always will.
            </p>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <a
            href="https://discord.gg/spoiledbananasociety"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center rounded-xl px-6 text-sm font-bold text-black transition hover:brightness-110"
            style={{ background: SBS_YELLOW }}
          >
            Join Discord →
          </a>
          <Link
            href="/"
            className="inline-flex h-12 items-center rounded-xl border border-zinc-700 px-6 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            ← Back to Home
          </Link>
        </motion.div>

        {/* Footer note */}
        <p className="mt-16 text-center text-xs text-zinc-600">
          &copy; 2026 Spoiled Banana Society &middot; Genesis cards live forever onchain
        </p>
      </div>
    </main>
  );
}
