import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Standings And Leaderboards',
  description:
    'View Banana Fantasy league standings, roster performance, and public leaderboards across contests.',
  alternates: {
    canonical: '/standings',
  },
};

export default function StandingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
