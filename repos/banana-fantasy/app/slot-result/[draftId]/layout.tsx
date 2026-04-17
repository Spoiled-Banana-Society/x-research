import type { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://banana-fantasy-sbs.vercel.app';

function normalizeType(raw: string | string[] | undefined): 'jackpot' | 'hof' {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === 'hof' ? 'hof' : 'jackpot';
}

interface SlotCopy {
  title: string;
  description: string;
  image: string;
  video: string;
}

function copyFor(type: 'jackpot' | 'hof'): SlotCopy {
  if (type === 'hof') {
    return {
      title: 'Hall of Fame draft on SBS Fantasy 🏆',
      description: 'Bonus prizes in play. Draft passes reveal JP, HOF, or Pro — find out when your draft fills.',
      image: `${SITE_URL}/hof-logo.jpg`,
      video: `${SITE_URL}/slots/hof.mp4`,
    };
  }
  return {
    title: 'JACKPOT draft on SBS Fantasy 🎰',
    description: 'Win the league → skip straight to the finals. Draft passes reveal JP, HOF, or Pro.',
    image: `${SITE_URL}/jackpot-logo.png`,
    video: `${SITE_URL}/slots/jackpot.mp4`,
  };
}

export async function generateMetadata(
  { params, searchParams }: { params: { draftId: string }; searchParams: { type?: string } },
): Promise<Metadata> {
  const type = normalizeType(searchParams?.type);
  const copy = copyFor(type);
  const playerUrl = `${SITE_URL}/slot-result/${params.draftId}/player?type=${type}`;

  return {
    title: copy.title,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      images: [{ url: copy.image, alt: copy.title }],
      videos: [{ url: copy.video, type: 'video/mp4', width: 720, height: 720 }],
    },
    twitter: {
      card: 'player',
      title: copy.title,
      description: copy.description,
      images: [copy.image],
      players: [{ playerUrl, streamUrl: copy.video, width: 720, height: 720 }],
    },
  };
}

export default function SlotResultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
