import type { Metadata } from 'next';
import Link from 'next/link';
import styles from './teaser.module.css';

const TEASER_PRIZE_POOL = '$500,000';

export const metadata: Metadata = {
  title: 'Teaser Landing',
  description: 'Pre-launch teaser for Banana Fantasy with loading animation and prize pool preview.',
  alternates: {
    canonical: '/teaser',
  },
};

export default function TeaserLandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <div className={styles.gridOverlay} aria-hidden="true" />

      <section className={styles.card}>
        <p className={styles.statusPill}>Pre-Launch Sequence</p>

        <h1 className={styles.headline}>Banana Fantasy is loading.</h1>
        <p className={styles.subhead}>
          Final systems check in progress. Early drafters get first shot at launch contests.
        </p>

        <div className={styles.loaderBlock} aria-live="polite" aria-label="Launch status loading">
          <div className={styles.spinner} aria-hidden="true" />
          <div>
            <p className={styles.loaderLabel}>Initializing launch queues</p>
            <p className={styles.loaderHint}>Syncing draft rooms, prizes, and leaderboard states...</p>
          </div>
        </div>

        <div className={styles.prizePanel}>
          <p className={styles.prizeLabel}>Projected Prize Pool</p>
          <p className={styles.prizeAmount}>{TEASER_PRIZE_POOL}</p>
          <p className={styles.prizeFootnote}>Placeholder preview for teaser. Final launch amount will be announced soon.</p>
        </div>

        <div className={styles.actions}>
          <Link href="/coming-soon" className={styles.primaryCta}>
            View Launch Countdown
          </Link>
          <Link href="/" className={styles.secondaryCta}>
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
