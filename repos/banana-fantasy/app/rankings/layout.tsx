import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Player Rankings',
  description:
    'Analyze and customize Banana Fantasy player rankings before entering your next best ball draft.',
  alternates: {
    canonical: '/rankings',
  },
};

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
