import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Draft History',
  description:
    'Review completed Banana Fantasy drafts, final placements, and past roster performance in one place.',
  alternates: {
    canonical: '/history',
  },
};

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
