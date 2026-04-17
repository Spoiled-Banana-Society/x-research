import type { Metadata } from 'next';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

const WHEEL_SPINS_COLLECTION = 'wheelSpins';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://banana-fantasy-sbs.vercel.app';

interface WheelSpinDoc {
  userId: string;
  spinId: string;
  result: string;
  prize: { type: string; value: string | number };
  timestamp: string;
}

async function fetchSpin(spinId: string): Promise<WheelSpinDoc | null> {
  if (!isFirestoreConfigured()) return null;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection(WHEEL_SPINS_COLLECTION).doc(spinId).get();
    if (!snap.exists) return null;
    return snap.data() as WheelSpinDoc;
  } catch {
    return null;
  }
}

function prizeCopy(result: string): { title: string; description: string; image: string } {
  if (result === 'jackpot') {
    return {
      title: 'JACKPOT on the Banana Wheel 🎰',
      description: 'Win the league → skip straight to the finals. Come spin yours on SBS Fantasy.',
      image: `${SITE_URL}/jackpot-logo.png`,
    };
  }
  if (result === 'hof') {
    return {
      title: 'Hall of Fame draft unlocked 🏆',
      description: 'Competing for bonus prizes on SBS Fantasy. Spin the Banana Wheel for your shot.',
      image: `${SITE_URL}/hof-logo.jpg`,
    };
  }
  const m = result.match(/^draft-(\d+)$/);
  if (m) {
    const n = m[1];
    return {
      title: `Won ${n} draft pass${n === '1' ? '' : 'es'} on the Banana Wheel 🍌`,
      description: 'Spin the Banana Wheel on SBS Fantasy for free drafts, HOF entries, and Jackpot shots.',
      image: `${SITE_URL}/banana-wheel.png`,
    };
  }
  return {
    title: 'Banana Wheel Spin 🍌',
    description: 'Spin the Banana Wheel on SBS Fantasy for free drafts, HOF entries, and Jackpot shots.',
    image: `${SITE_URL}/banana-wheel.png`,
  };
}

export async function generateMetadata(
  { params }: { params: { spinId: string } },
): Promise<Metadata> {
  const spin = await fetchSpin(params.spinId);
  const copy = prizeCopy(spin?.result ?? '');

  return {
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      images: [{ url: copy.image, alt: copy.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.title,
      description: copy.description,
      images: [copy.image],
    },
  };
}

export default function WheelResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
