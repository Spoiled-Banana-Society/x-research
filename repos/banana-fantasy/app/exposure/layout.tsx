import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exposure Dashboard',
  description:
    'Track team and position exposure, bye week balance, and stacking trends across your Banana Fantasy drafts.',
  alternates: {
    canonical: '/exposure',
  },
};

export default function ExposureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
